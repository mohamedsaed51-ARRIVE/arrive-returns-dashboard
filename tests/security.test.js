// اختبارات أمان لوحة المرتجعات — بيانات اصطناعية فقط. يشغّل apps-script/Code.gs و Code-SLA.gs الحقيقيين في vm بشيت ضار.
// Chart.js (CDN) يُستبدل بـ Stub محلي. التشغيل: node tests/security.test.js    ROOT=<مجلد> لاختبار نسخة أخرى.
const { chromium } = require('playwright');
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = process.env.ROOT || path.join(__dirname, '..');
const X = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
let pass = 0, fail = 0;
const check = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? 'PASS' : 'FAIL') + ' - ' + n + (c || extra === undefined ? '' : ' ' + JSON.stringify(extra))); };
const STUB = `(function(){const P=()=>new Proxy(function(){},{get:(t,k)=>k===Symbol.toPrimitive?()=>'':P(),apply:()=>P(),set:()=>true});
function Chart(){this.destroy=()=>{};this.update=()=>{};this.resize=()=>{};this.data={datasets:[]};this.options={};}
Chart.getChart=()=>undefined;Chart.register=()=>{};Chart.defaults=P();Chart.Chart=Chart;window.Chart=Chart;})();`;
const fmt = (d, tz, f) => { const p = (n) => String(n).padStart(2, '0'); return f === 'M' ? String(d.getMonth() + 1) : f === 'd' ? String(d.getDate()) : f === 'yyyy' ? String(d.getFullYear()) : f === 'yyyy-MM-dd' ? d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) : ''; };
const mkVm = (file, ssObj) => { const sb = { console, Date, Math, JSON, Object, Number, String, Array, RegExp, Error, isNaN, Set, Map,
  ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) }, Utilities: { formatDate: fmt }, SpreadsheetApp: { getActive: () => ssObj } };
  vm.createContext(sb); vm.runInContext(fs.readFileSync(path.join(ROOT, 'apps-script', file), 'utf8'), sb); return sb; };
const shArr = (name, id, data) => ({ getName: () => name, getSheetId: () => id, getDataRange: () => ({ getValues: () => data }) });
// --- شيت المطابقة ---
const mh = ['اليوم', 'x', 'الفرع', 'عدد الشحنات المرسلة', 'عدد الشحنات المستلمة', 'حاله المطابقه', 'عدد الشحنات الغير مستلمة', 'y', 'عدد الشحنات المختلطة'];
const match = [mh];
for (let i = 0; i < 12; i++) match.push([new Date(2026, 9, 1 + (i % 9)), '', i < 8 ? X + 'BR' + (i % 3) : 'فرع ' + (i % 3), 10 + i, 8, i < 8 ? X + 'ST' : 'لم يتم الاستلام بالكامل', 2 + i, '', 0]);
const sbMatch = mkVm('Code.gs', { getSpreadsheetTimeZone: () => 'Africa/Cairo', getSheets: () => [shArr('شهر 10', 1064670621, match)] });
// --- شيت SLA ---
const sh2 = ['رقم البوليصة', 'الراسل', 'تاريخ استلام البيك أب', 'حالة الشحنة', 'تاريخ التقفيل', 'فرع المرتجع', 'حاله النهائيه', 'تاريخ تقفيل المرتجع', 'عمر المرتجع'];
const sla = [sh2];
for (let i = 0; i < 14; i++) sla.push(['AV' + (1000 + i), i < 8 ? X + 'SD' + (i % 3) : 'راسل ' + (i % 3), new Date(2026, 8, 1), i < 8 ? X + 'S' : 'مرتجع', new Date(2026, 8, 2), i < 8 ? X + 'B' : 'فرع', i < 8 ? X + 'F' : 'تم', new Date(2026, 8, 5), 3]);
const sbSla = mkVm('Code-SLA.gs', { getSpreadsheetTimeZone: () => 'Africa/Cairo', getSheets: () => [shArr('1-9', 2, sla)] });
const bodyMatch = sbMatch.doGet().s, bodySla = sbSla.doGet().s;

(async () => {
  const jm = JSON.parse(bodyMatch), js = JSON.parse(bodySla);
  check('Code.gs و Code-SLA.gs الحقيقيان (vm) أعادا بيانات', jm.ok && jm.rows.length > 0 && js.ok && js.rows.length > 0, [jm.error, js.error]);
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
  await pg.route('**/*', (r) => { const u = r.request().url();
    if (u.includes('Chart.js')) return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    if (u.includes('script.google.com')) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: u.includes('xa6AXk') ? bodySla : bodyMatch });
    return u.startsWith('file:') ? r.continue() : r.abort(); });
  await pg.goto('file://' + path.join(ROOT, 'index.html'), { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(3500);
  check('تبويب المطابقة عرض صفوف الشيت الاصطناعي', await pg.evaluate("document.body.innerText.includes('BR0') || document.body.innerText.includes('img src=x')"));
  await pg.evaluate("document.querySelector('.view-tab[data-view=sla]').click()"); await pg.waitForTimeout(3500);
  await pg.evaluate(() => { document.querySelectorAll('#view-sla input[type=checkbox], #view-match input[type=checkbox]').forEach((c) => { try { c.click(); } catch (e) {} }); });
  await pg.waitForTimeout(800);
  await pg.evaluate("document.querySelectorAll('#view-sla tbody tr[data-b], #view-sla tbody tr[data-s]').forEach(tr => tr.click())"); await pg.waitForTimeout(500);
  for (const id of ['sReport', 'qaReport']) { await pg.evaluate((i) => { const e = document.getElementById(i); e && e.click(); }, id); await pg.waitForTimeout(2200); await pg.keyboard.press('Escape'); }
  const n = await pg.evaluate('window.__xss||0');
  check('XSS: لا تنفيذ (تبويبان، فلاتر، جداول، تقريران)', n === 0, n);
  check('XSS: لا img[onerror] في DOM', (await pg.evaluate("document.querySelectorAll('img[onerror]').length")) === 0);
  check('الوظيفة: النص الضار ظاهر كنص في الواجهة (لم يُحذف)', await pg.evaluate("/img src=x onerror/.test(document.body.innerText)"));
  check('الوظيفة: بيانات تبويب SLA المحاكاة ظاهرة (الاختبار غير فارغ)', await pg.evaluate("/img src=x onerror/.test(document.getElementById('view-sla').innerText)"));
  check('لا أخطاء JavaScript', errs.length === 0, errs.slice(0, 2));
  await b.close();
  console.log(`\n${pass}/${pass + fail} اختبارًا ناجحًا`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(2); });
