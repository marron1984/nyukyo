/**
 * LINE Works Bot API client.
 *
 * Script Properties required:
 *   LW_CLIENT_ID, LW_CLIENT_SECRET,
 *   LW_SERVICE_ACCOUNT,
 *   LW_PRIVATE_KEY        (BEGIN/END PRIVATE KEY 形式のRSA秘密鍵)
 *   LW_BOT_ID,
 *   LW_CHANNEL_ID
 */
function sendLineWorksMessage_(text) {
  var props = PropertiesService.getScriptProperties();
  var botId = props.getProperty('LW_BOT_ID');
  var channelId = props.getProperty('LW_CHANNEL_ID');
  if (!botId || !channelId) throw new Error('LW_BOT_ID / LW_CHANNEL_ID is not set');

  var token = getLineWorksAccessToken_();
  var url = 'https://www.worksapis.com/v1.0/bots/' + encodeURIComponent(botId)
    + '/channels/' + encodeURIComponent(channelId) + '/messages';

  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + token },
    payload: JSON.stringify({ content: { type: 'text', text: text } }),
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('LINE Works send failed: ' + code + ' ' + res.getContentText());
  }
}

function getLineWorksAccessToken_() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get('lw_token');
  if (cached) return cached;

  var props = PropertiesService.getScriptProperties();
  var clientId = props.getProperty('LW_CLIENT_ID');
  var clientSecret = props.getProperty('LW_CLIENT_SECRET');
  var serviceAccount = props.getProperty('LW_SERVICE_ACCOUNT');
  var privateKey = props.getProperty('LW_PRIVATE_KEY');
  if (!clientId || !clientSecret || !serviceAccount || !privateKey) {
    throw new Error('LINE Works credentials are not fully set in Script Properties');
  }

  var now = Math.floor(Date.now() / 1000);
  var header = { alg: 'RS256', typ: 'JWT' };
  var claims = {
    iss: clientId,
    sub: serviceAccount,
    iat: now,
    exp: now + 3600,
  };
  var unsigned = b64url_(JSON.stringify(header)) + '.' + b64url_(JSON.stringify(claims));
  var signature = Utilities.computeRsaSha256Signature(unsigned, privateKey);
  var jwt = unsigned + '.' + b64urlBytes_(signature);

  var res = UrlFetchApp.fetch('https://auth.worksmobile.com/oauth2/v2.0/token', {
    method: 'post',
    payload: {
      assertion: jwt,
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'bot',
    },
    muteHttpExceptions: true,
  });
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('LINE Works token failed: ' + code + ' ' + res.getContentText());
  }
  var body = JSON.parse(res.getContentText());
  var token = body.access_token;
  var expiresIn = Number(body.expires_in) || 3600;
  cache.put('lw_token', token, Math.min(3000, expiresIn - 60));
  return token;
}

function b64url_(s) {
  return b64urlBytes_(Utilities.newBlob(s).getBytes());
}

function b64urlBytes_(bytes) {
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}
