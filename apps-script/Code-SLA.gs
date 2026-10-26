/**
 * ARRIVE — واجهة بيانات تبويب «SLA المرتجعات» (قراءة فقط)
 * مشروع Apps Script مستقل مرتبط بشيت «Sla RTO» (ليس شيت تقرير المرتجعات).
 * يقرأ كل التابات المسماة يوم-شهر (مثل 1-9 و30-9) ويعيدها كجدول واحد مضغوط.
 *
 * النشر: الشيت → Extensions → Apps Script → الصق الملف → Deploy → New deployment
 *   Type: Web app | Execute as: Me | Who has access: Anyone
 * ثم ضع رابط /exec في SLA_LIVE_URL داخل sla.js
 */
const TAB_PATTERN = /^\d{1,2}-\d{1,2}$/;   // أسماء التابات اليومية (تُقصّ المسافات قبل الفحص)

// رؤوس الأعمدة كما في الشيت (أول كلمات)، مع موضع احتياطي (A=0)
const COLS = {
  waybill:  { head: 'رقم البوليصة',        pos: 0 },
  sender:   { head: 'الراسل',              pos: 1 },
  pickup:   { head: 'تاريخ استلام البيك',  pos: 2 },
  status:   { head: 'حالة الشحنة',         pos: 3 },
  close:    { head: 'تاريخ التقفيل',       pos: 4 },
  branch:   { head: 'فرع المرتجع',         pos: 5 },
  final:    { head: 'حاله النهائيه',       pos: 6 },
  retClose: { head: 'تاريخ تقفيل المرتجع', pos: 7 },
  age:      { head: 'عمر المرتجع',         pos: 8 },
};

function doGet() {
  try {
    const ss = SpreadsheetApp.getActive();
    const tz = ss.getSpreadsheetTimeZone();
    const dict = { senders: [], statuses: [], branches: [], finals: [], tabs: [] };
    const ix = { senders: {}, statuses: {}, branches: {}, finals: {}, tabs: {} };
    const id = (k, v) => { if (!(v in ix[k])) { ix[k][v] = dict[k].length; dict[k].push(v); } return ix[k][v]; };
    const rows = [];
    const tabs = ss.getSheets().filter(s => TAB_PATTERN.test(s.getName().trim()));

    tabs.forEach(sh => {
      const vals = sh.getDataRange().getValues();
      if (vals.length < 2) return;
      const head = vals[0].map(c => String(c).replace(/\s+/g, ' ').trim());
      const idx = {};
      Object.keys(COLS).forEach(k => {
        const f = head.findIndex(c => c.indexOf(COLS[k].head) === 0);
        idx[k] = f >= 0 ? f : COLS[k].pos;
      });
      const tab = sh.getName().trim();
      for (let i = 1; i < vals.length; i++) {
        const r = vals[i];
        const wb = String(r[idx.waybill] || '').trim();
        if (!wb) continue;
        const age = String(r[idx.age]).trim();
        rows.push([
          wb,
          id('senders', String(r[idx.sender] || '').trim()),
          iso_(r[idx.pickup], tz),
          id('statuses', String(r[idx.status] || '').trim()),
          iso_(r[idx.close], tz),
          id('branches', String(r[idx.branch] || '').trim()),
          id('finals', String(r[idx.final] || '').trim()),
          iso_(r[idx.retClose], tz),
          /^-?\d+$/.test(age) ? Number(age) : null,
          id('tabs', tab),
        ]);
      }
    });
    return out_({ ok: true, updatedAt: new Date().toISOString(), count: rows.length, tabs: tabs.length, dict: dict, rows: rows });
  } catch (e) {
    return out_({ ok: false, error: String(e) });
  }
}

// تاريخ الشيت: كائن Date، أو نص يوم/شهر/سنة، أو نص ISO. أي شيء آخر ← نص فارغ
function iso_(v, tz) {
  if (v instanceof Date) return Utilities.formatDate(v, tz, 'yyyy-MM-dd');
  const s = String(v || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  m = s.match(/^\d{4}-\d{2}-\d{2}$/);
  return m ? s : '';
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
