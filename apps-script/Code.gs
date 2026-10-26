/**
 * ARRIVE — واجهة بيانات لوحة مطابقة المرتجعات (قراءة فقط)
 * يعيد صفوف ورقة «شهر 10» كـ JSON ليقرأها الداش بورد مباشرة.
 *
 * النشر: Extensions → Apps Script → الصق الملف → Deploy → New deployment
 *   Type: Web app | Execute as: Me | Who has access: Anyone
 * ثم انسخ رابط /exec وضعه في LIVE_URL داخل live.js
 */
const SHEET_GID = 1064670621;   // رقم التبويب (gid) من رابط الشيت
const MONTH = 10;               // الداش بورد خاص بشهر أكتوبر

// أول كلمات رؤوس الأعمدة كما في الشيت، مع موضع احتياطي (A=0)
const COLS = {
  day:    { head: 'اليوم',               pos: 0 },
  branch: { head: 'الفرع',               pos: 2 },
  sent:   { head: 'عدد الشحنات المرس',   pos: 3 },
  recv:   { head: 'عدد الشحنات المست',   pos: 4 },
  status: { head: 'حاله المطابقه',       pos: 5 },
  unrecv: { head: 'عدد الشحنات الغير',   pos: 6 },
  extra:  { head: 'عدد الشحنات المخت',   pos: 8 },
};

function doGet() {
  try {
    const sh = SpreadsheetApp.getActive().getSheets().filter(s => s.getSheetId() === SHEET_GID)[0];
    if (!sh) return out_({ ok: false, error: 'التبويب غير موجود (gid=' + SHEET_GID + ')' });
    const tz = SpreadsheetApp.getActive().getSpreadsheetTimeZone();
    const vals = sh.getDataRange().getValues();

    // صف الرؤوس: أول صف تبدأ إحدى خلاياه بـ «اليوم»
    let h = -1;
    for (let i = 0; i < Math.min(vals.length, 15) && h < 0; i++) {
      if (vals[i].some(c => String(c).trim().indexOf(COLS.day.head) === 0)) h = i;
    }
    if (h < 0) return out_({ ok: false, error: 'لم يتم العثور على صف الرؤوس' });
    const idx = {};
    Object.keys(COLS).forEach(k => {
      const f = vals[h].findIndex(c => String(c).replace(/\s+/g, ' ').trim().indexOf(COLS[k].head) === 0);
      idx[k] = f >= 0 ? f : COLS[k].pos;
    });

    const rows = [];
    for (let i = h + 1; i < vals.length; i++) {
      const r = vals[i];
      const date = parseDate_(r[idx.day], tz);
      const branch = String(r[idx.branch] || '').replace(/\s+/g, ' ').trim();
      if (!date || !branch) continue;
      rows.push({
        sheetRow: i + 1, date: date, branch: branch,
        sent: num_(r[idx.sent]), recv: num_(r[idx.recv]),
        status: String(r[idx.status] || '').trim(),
        unrecv: num_(r[idx.unrecv]), extra: num_(r[idx.extra]),
      });
    }
    return out_({ ok: true, updatedAt: new Date().toISOString(), count: rows.length, rows: rows });
  } catch (e) {
    return out_({ ok: false, error: String(e) });
  }
}

function num_(x) { const n = Number(x); return isFinite(n) ? n : 0; }

// بعض التواريخ مكتوبة يوم/شهر وبعضها شهر/يوم: الرقم المساوي لرقم الشهر (10) هو الشهر، والآخر هو اليوم
function parseDate_(v, tz) {
  let a, b, y;
  if (v instanceof Date) {
    a = Number(Utilities.formatDate(v, tz, 'M')); b = Number(Utilities.formatDate(v, tz, 'd'));
    y = Number(Utilities.formatDate(v, tz, 'yyyy'));
  } else {
    const m = String(v).trim().match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!m) return null;
    a = Number(m[1]); b = Number(m[2]); y = Number(m[3]);
  }
  let day;
  if (a === MONTH) day = b; else if (b === MONTH) day = a; else return null;   // تجاهل الأشهر الأخرى
  if (day < 1 || day > 31) return null;
  return y + '-' + String(MONTH).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
