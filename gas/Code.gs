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
    if (action === 'update') {
      updateCells_(Number(body.rowNumber), body.cells || {});
      return jsonOut_({ ok: true });
    }

    var payload = body.payload || {};
    appendRow_(payload);
    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ error: String(err && err.message ? err.message : err) }, 500);
  }
}

// 既存スプレッドシートの16列。値は formToRow_ で組み立てる。
var COLUMN_HEADERS_ = [
  'No.',
  '問い合わせ日',
  'ステータス',
  '名前',
  '年齢',
  '性別',
  '入居\n場所',
  '連絡先',
  'キーパーソン',
  '介護度',
  '状況',
  'ADL詳細',
  '希望物件',
  'エント希望',
  '借金有無',
  '費用',
];

function formToRow_(p, nextNo) {
  function s(v) { return v === undefined || v === null ? '' : String(v); }
  function fmtDate(v) {
    if (!v) return '';
    var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return m[1] + '/' + m[2] + '/' + m[3];
    return String(v);
  }
  function fmtYen(v) {
    if (v === undefined || v === null || v === '') return '';
    var n = Number(v);
    if (isNaN(n)) return String(v);
    return n.toLocaleString('ja-JP') + '円\nまで';
  }
  function fmtAge(v) {
    if (v === undefined || v === null || v === '') return '';
    return String(v) + '歳';
  }
  function joinNonEmpty(parts, sep) {
    return parts.filter(function (x) { return x && String(x).trim(); }).join(sep);
  }

  var adlBody = joinNonEmpty([
    p.adlSitting ? '座位：' + p.adlSitting : '',
    p.adlStanding ? '立位：' + p.adlStanding : '',
    p.adlToilet ? '排泄：' + p.adlToilet : '',
    p.adlMeal ? '食事：' + p.adlMeal : '',
    p.adlCommunication ? '意思疎通：' + p.adlCommunication : '',
  ], ' / ');
  var adlDetail = joinNonEmpty([adlBody, s(p.adlDetail)], '\n');

  var debt = p.hasDebt === 'あり'
    ? (p.debtNote ? 'あり（' + p.debtNote + '）' : 'あり')
    : 'なし';

  var contact = joinNonEmpty([
    s(p.contact),
    p.companyName && p.companyName !== '未確認' ? '御社名:' + p.companyName : '',
    p.contactPerson && p.contactPerson !== '未確認' ? '担当:' + p.contactPerson : '',
  ], ' / ');

  var situation = joinNonEmpty([s(p.situation), s(p.others)], '\n\n');

  return [
    nextNo,                          // No.
    fmtDate(p.inquiryDate),          // 問い合わせ日
    s(p.status) || '新規',           // ステータス
    s(p.customerName),               // 名前
    fmtAge(p.age),                   // 年齢
    s(p.gender),                     // 性別
    s(p.residenceLocation),          // 入居場所
    contact,                         // 連絡先
    s(p.keyPerson),                  // キーパーソン
    s(p.careLevel),                  // 介護度
    situation,                       // 状況
    adlDetail,                       // ADL詳細
    s(p.preferredProperty),          // 希望物件
    s(p.ent),                        // エント希望
    debt,                            // 借金有無
    fmtYen(p.budgetYen),             // 費用
  ];
}

function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var ssId = props.getProperty('SPREADSHEET_ID');
  var sheetName = props.getProperty('SHEET_NAME') || 'メールから';
  if (!ssId) throw new Error('SPREADSHEET_ID is not set');
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  return sheet;
}

function appendRow_(p) {
  var sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMN_HEADERS_);
  }
  // No.列(1列目)の既存最大値+1。空シートなら1から。
  var nextNo = 1;
  if (sheet.getLastRow() >= 2) {
    var noValues = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < noValues.length; i++) {
      var n = Number(noValues[i][0]);
      if (!isNaN(n) && n >= nextNo) nextNo = n + 1;
    }
  }
  sheet.appendRow(formToRow_(p, nextNo));
}

function listRows_() {
  var sheet = getSheet_();
  if (sheet.getLastRow() < 2) return [];
  var range = sheet.getRange(2, 1, sheet.getLastRow() - 1, COLUMN_HEADERS_.length);
  var values = range.getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    var obj = { _rowNumber: i + 2 };
    for (var j = 0; j < COLUMN_HEADERS_.length; j++) {
      var v = r[j];
      if (v instanceof Date) v = v.toISOString();
      obj['c' + j] = v;
    }
    rows.push(obj);
  }
  rows.reverse();
  return rows;
}

function updateCells_(rowNumber, cells) {
  if (!rowNumber || rowNumber < 2) throw new Error('invalid rowNumber');
  var sheet = getSheet_();
  Object.keys(cells).forEach(function (key) {
    var m = key.match(/^c(\d+)$/);
    if (!m) return;
    var colIdx = Number(m[1]);
    if (colIdx < 0 || colIdx >= COLUMN_HEADERS_.length) return;
    var v = cells[key];
    sheet.getRange(rowNumber, colIdx + 1).setValue(v == null ? '' : v);
  });
}

function deleteRow_(rowNumber) {
  if (!rowNumber || rowNumber < 2) throw new Error('invalid rowNumber');
  var sheet = getSheet_();
  sheet.deleteRow(rowNumber);
}

function jsonOut_(obj, status) {
  if (status && status !== 200) obj.status = status;
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function testIntake() {
  var sample = {
    inquiryDate: '2026-05-21',
    status: '新規',
    customerName: '鈴木一世様',
    age: 78,
    gender: '男性',
    residenceLocation: '大阪市鶴見区',
    contact: '',
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
    situation: '昭和23年1月27日生まれ。大阪市鶴見区在住。家族と同居中。20年前から被害妄想などの症状が多く、近年は徘徊が目立つようになっている。',
    ent: '未確認',
    others: '徘徊あり。被害妄想あり。キーパーソンである奥様はADL高めだが、認知症あり。',
    preferredProperty: '',
    keyPerson: '奥様',
    companyName: '未確認',
    contactPerson: '未確認',
  };
  appendRow_(sample);
}
