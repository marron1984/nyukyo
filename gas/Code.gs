/**
 * Web App entry. Receives POST from the Next.js API route.
 * Body: { secret, payload, message }
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty('SHARED_SECRET');
    if (!expected || body.secret !== expected) {
      return jsonOut_({ error: 'unauthorized' }, 401);
    }

    var action = body.action || 'create';

    if (action === 'list') {
      return jsonOut_({ ok: true, rows: listRows_() });
    }
    if (action === 'delete') {
      deleteRow_(Number(body.rowNumber));
      return jsonOut_({ ok: true });
    }

    var payload = body.payload || {};
    var message = body.message || '';

    appendRow_(payload);

    var lineworksError = null;
    try {
      sendLineWorksMessage_(message);
    } catch (err) {
      lineworksError = String(err && err.message ? err.message : err);
    }

    return jsonOut_({ ok: true, lineworksError: lineworksError });
  } catch (err) {
    return jsonOut_({ error: String(err && err.message ? err.message : err) }, 500);
  }
}

var COLUMNS_ = [
  ['timestamp', 'タイムスタンプ'],
  ['inquiryDate', '問い合わせ日'],
  ['customerName', '顧客名'],
  ['age', '年齢'],
  ['gender', '性別'],
  ['careLevel', '介護度'],
  ['budgetYen', '費用上限(円)'],
  ['adlSitting', 'ADL:座位'],
  ['adlStanding', 'ADL:立位'],
  ['adlToilet', 'ADL:排泄'],
  ['adlMeal', 'ADL:食事'],
  ['adlCommunication', 'ADL:意思疎通'],
  ['adlDetail', 'ADL詳細'],
  ['hasDebt', '借金の有無'],
  ['debtNote', '借金の補足'],
  ['situation', '現在の詳細状況'],
  ['ent', 'エント'],
  ['others', 'その他'],
  ['keyPerson', 'キーパーソン'],
  ['companyName', '御社名'],
  ['contactPerson', 'ご担当者名'],
];

function appendRow_(p) {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('SHEET_NAME') || '入居相談';
  if (!ssId) throw new Error('SPREADSHEET_ID is not set');

  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNS_.map(function (c) { return c[1]; }));
  }

  var row = COLUMNS_.map(function (c) {
    if (c[0] === 'timestamp') return new Date();
    var v = p[c[0]];
    return v === undefined || v === null ? '' : v;
  });
  sheet.appendRow(row);
}

function listRows_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('SHEET_NAME') || '入居相談';
  if (!ssId) throw new Error('SPREADSHEET_ID is not set');
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, COLUMNS_.length);
  var values = range.getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var obj = { _rowNumber: i + 2 };
    for (var j = 0; j < COLUMNS_.length; j++) {
      var key = COLUMNS_[j][0];
      var v = r[j];
      if (key === 'timestamp' && v instanceof Date) v = v.toISOString();
      obj[key] = v;
    }
    rows.push(obj);
  }
  rows.reverse();
  return rows;
}

function deleteRow_(rowNumber) {
  if (!rowNumber || rowNumber < 2) throw new Error('invalid rowNumber');
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('SHEET_NAME') || '入居相談';
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('sheet not found');
  sheet.deleteRow(rowNumber);
}

function jsonOut_(obj, status) {
  // Apps Script Web Apps cannot set arbitrary status codes; we embed the status in the body.
  if (status && status !== 200) obj.status = status;
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Manual test — fill SPREADSHEET_ID + SHARED_SECRET in Script Properties first.
 */
function testIntake() {
  var sample = {
    inquiryDate: '2026-05-21',
    customerName: '鈴木一世様',
    age: 78,
    gender: '男性',
    careLevel: '要介護2',
    budgetYen: 140000,
    adlSitting: '自立',
    adlStanding: '自立',
    adlToilet: '自立',
    adlMeal: '自立',
    adlCommunication: '支離滅裂だが時折可能',
    adlDetail: '基本動作は自立。日常生活動作は概ね保たれているが、意思疎通に波があり、会話内容が支離滅裂になることがある。',
    hasDebt: 'なし',
    debtNote: '',
    situation: '昭和23年1月27日生まれ。大阪市鶴見区在住。家族と同居中。20年前から被害妄想などの症状が多く、近年は徘徊が目立つようになっている。ご家族の介護負担が増加したため、入居相談に至った。',
    ent: '未確認',
    others: '徘徊あり。被害妄想あり。キーパーソンである奥様はADL高めだが、認知症あり。',
    keyPerson: '奥様',
    companyName: '未確認',
    contactPerson: '未確認',
  };
  appendRow_(sample);
  sendLineWorksMessage_('【テスト送信】入居相談フォーム疎通確認');
}
