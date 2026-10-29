// بيانات اصطناعية (حتمية) بنفس بنية data.js وsla-data.js — لا تحوي أي بيانات حقيقية.
let seed = 20261029;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pad = (n) => String(n).padStart(2, '0');
const BR = ['الزقازيق', 'المنصوره', 'طنطا', 'الهرم', 'الشروق', 'المعادى', 'الحدائق', 'العجوزة', 'اكتوبر', 'مدينه نصر', 'مصر الجديدة', 'الموسسه', 'فرع تجريبي غير معرّف'];
const FLAGS = ['', '', '', '', 'مكرر_متطابق', 'تكرار_غير_واضح', 'مستلم_اكبر_غير_مفسر', 'حالة_غير_متسقة', 'غير_مستلم_غير_مطابق', 'متابعة_متبقي', 'فرعين_مدمجين'];
function match() {
  const rows = []; let row = 3;
  for (let d = 1; d <= 14; d++) for (const b of BR) {
    const sent = ri(20, 150), un = rnd() < .55 ? ri(0, 40) : 0, extra = rnd() < .15 ? ri(1, 5) : 0, recv = Math.max(0, sent - un + extra);
    rows.push({ sheetRow: String(row++), date: '2026-10-' + pad(d), branch: b, sent: String(sent), recv: String(recv), status: un > 0 ? 'لم يتم الاستلام بالكامل' : 'تم الاستلام بالكامل', unrecv: String(un), extra: String(extra), flags: FLAGS[ri(0, FLAGS.length - 1)] });
  }
  return rows;
}
function sla() {
  const branches = ['فرع رئيسى', 'الموسسه', 'فرع الاسكندريه', 'فرع الهرم', 'طنطا', 'حدائق القبة', 'فرع المنصورة', 'الشروق', 'فرع مدينه نصر', 'فرع اكتوبر', 'تم الارتجاع للراسل', 'فرع زقازيق', 'فرع تجريبي غير معرّف'];
  const statuses = ['تقفيل مرتجع', 'فى الطريق للتاجر', 'مرتجعات الى الفروع', 'في الطريق للتاجر'];
  const finals = ['تم الارتجاع للراسل', 'تم الارتجاع للفرع', 'في الطريق للتاجر', 'مرتجعات الى الفروع', 'مرتجعات معلقه', 'مرتجعات الي الرئيسي'];
  const senders = []; for (let i = 0; i < 30; i++) senders.push(i % 2 ? 'متجر اختبار ' + i : 'Test Store ' + i + ' - متجر ' + i);
  const tabs = []; for (let i = 1; i <= 12; i++) tabs.push(i + '-9');
  const rows = [];
  for (let i = 0; i < 800; i++) {
    const pick = '2026-09-' + pad(ri(1, 10)), closeD = ri(1, 12), retD = closeD + ri(0, 18);
    const close = rnd() < .03 ? '' : '2026-09-' + pad(closeD), ret = rnd() < .03 ? '' : (retD <= 30 ? '2026-09-' + pad(retD) : '2026-10-' + pad(Math.min(28, retD - 30)));
    const ageC = close && ret ? Math.round((Date.parse(ret) - Date.parse(close)) / 864e5) : null;
    rows.push(['AV' + (7000 + (i % 700)) + '-R', ri(0, 29), rnd() < .05 ? '' : pick, ri(0, 3), close, ri(0, branches.length - 1), ri(0, finals.length - 1), ret, ageC == null ? null : (rnd() < .08 ? ageC + 2 : ageC), ri(0, 11)]);
  }
  return { ok: true, updatedAt: '2026-10-26T00:00:00.000Z', dict: { senders, statuses, branches, finals, tabs }, rows };
}
module.exports = { match, sla };
