// أدوات مشتركة لاختبارات النسخة ثنائية اللغة: صفحات الأصل والنسخة بنفس البيانات الاصطناعية، Chart.js مسجِّل، بلا شبكة.
const { chromium } = require('playwright');
const path = require('path');
const fx = require('./fixtures');
const ROOT = path.join(__dirname, '..', '..');
const ORIG = 'file://' + path.join(ROOT, 'index.html');
const BI = 'file://' + path.join(ROOT, 'i18n', 'index.html');
const MATCH = fx.match(), SLA = fx.sla();
const STUB = `(function(){window.__charts=[];function Chart(ctx,cfg){var seen=[];var c=JSON.parse(JSON.stringify(cfg,function(k,v){return typeof v==='function'?undefined:v}));window.__charts.push({id:ctx&&ctx.id||'',cfg:c});this.destroy=function(){};this.update=function(){};this.resize=function(){};this.data=cfg.data;this.options=cfg.options||{};}
Chart.getChart=function(){return undefined};Chart.register=function(){};Chart.defaults={font:{},color:'',plugins:{legend:{labels:{}}}};window.Chart=Chart;})();`;
async function launch() { return chromium.launch({ args: ['--no-sandbox'] }); }
// live: 'abort' (يبقى على اللقطة) | 'ok' (يرد بنفس البيانات) | 'badjson' | 'error'
async function open(b, url, o) {
  o = o || {};
  const pg = await b.newPage({ viewport: { width: o.width || 1440, height: o.height || 900 } });
  pg.__errs = []; pg.on('pageerror', (e) => pg.__errs.push(String(e).slice(0, 160)));
  if (o.storage) await pg.addInitScript((v) => { try { localStorage.setItem('arrive_lang', v); } catch (e) {} }, o.storage);
  await pg.addInitScript(() => { try { localStorage.setItem('x', '1'); } catch (e) {} });
  const matchData = o.matchData || MATCH, slaData = o.slaData || SLA;
  await pg.route('**/*', (r) => {
    const u = r.request().url();
    if (u.includes('Chart.js')) return r.fulfill({ status: 200, contentType: 'text/javascript', body: STUB });
    if (/\/data\.js$/.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.OCT_DATA=' + JSON.stringify(matchData) + ';' });
    if (/\/sla-data\.js$/.test(u)) return r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.RTO_SNAP=' + JSON.stringify(slaData) + ';' });
    if (u.includes('script.google.com')) {
      const mode = o.live || 'abort', isSla = u.includes('xa6AXk');
      if (mode === 'abort') return r.abort();
      const h = { 'access-control-allow-origin': '*' };
      if (mode === 'badjson') return r.fulfill({ status: 200, contentType: 'text/html', headers: h, body: '<html>login</html>' });
      if (mode === 'error') return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify({ ok: false, error: 'خطأ اختباري' }) });
      return r.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(isSla ? slaData : { ok: true, updatedAt: '2026-10-26T09:30:00.000Z', rows: matchData.map((x) => ({ sheetRow: +x.sheetRow, date: x.date, branch: x.branch, sent: +x.sent, recv: +x.recv, status: x.status, unrecv: +x.unrecv, extra: +x.extra })) }) });
    }
    return u.startsWith('file:') ? r.continue() : r.abort();
  });
  await pg.goto(url + (o.query || ''), { waitUntil: 'domcontentloaded' });
  await pg.waitForTimeout(o.wait || 1800);
  return pg;
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();
// نص الصفحة المرئي (دون زر اللغة)
const text = (pg) => pg.evaluate(() => { const t = document.getElementById('langToggle'); const prev = t && t.style.display; if (t) t.style.display = 'none'; const s = document.body.innerText; if (t) t.style.display = prev || ''; return s; }).then(norm);
const charts = (pg) => pg.evaluate(() => JSON.stringify((window.__charts || []).map((c) => ({ id: c.id, labels: c.cfg.data && c.cfg.data.labels, ds: (c.cfg.data && c.cfg.data.datasets || []).map((d) => ({ l: d.label, d: d.data })), opts: JSON.stringify(c.cfg.options || {}) }))));
const clearCharts = (pg) => pg.evaluate(() => { window.__charts = []; });
// سيناريو حالات الواجهة: يُنفَّذ بنفس الخطوات على أي صفحة ويعيد لقطات (نص + رسوم)
async function scenario(pg, snap) {
  const out = {}; const step = async (name, fn, wait) => { await clearCharts(pg); await pg.evaluate(fn); await pg.waitForTimeout(wait || 500); out[name] = await snap(pg, name); };
  await step('01-match-initial', '0');
  await step('02-sort-sent', "document.querySelector('#logTbl thead th[data-k=sent]').click()");
  await step('03-sort-branches', "document.querySelector('#brTbl thead th[data-k=rate]').click()");
  await step('04-branch-rows', "document.querySelectorAll('#brBody tr[data-b]').forEach((t,i)=>{ if(i<2) t.click(); })");
  await step('05-mode-calc-excl', "(function(){var m=document.getElementById('fMode');m.value='calc';m.dispatchEvent(new Event('change'));var e=document.getElementById('fExcl');e.value='yes';e.dispatchEvent(new Event('change'));var f=document.getElementById('fFlag');f.value='flag';f.dispatchEvent(new Event('change'));})()");
  await step('06-dates-search', "(function(){var a=document.getElementById('fFrom');a.value='2026-10-03';a.dispatchEvent(new Event('change'));var b=document.getElementById('fTo');b.value='2026-10-10';b.dispatchEvent(new Event('change'));var q=document.getElementById('fSearch');q.value='زقازيق';q.dispatchEvent(new Event('input'));})()");
  await step('07-empty', "(function(){var q=document.getElementById('fSearch');q.value='لا يوجد شيء هنا';q.dispatchEvent(new Event('input'));})()");
  await step('08-reset-page2', "(function(){document.getElementById('btnReset').click();document.getElementById('pgNext').click();})()");
  await step('09-pgsize', "(function(){var s=document.getElementById('pgSize');s.value='100';s.dispatchEvent(new Event('change'));})()");
  await step('10-multiselect', "(function(){var c=document.querySelector('#msBranch .ms-control');c.click();})()");
  await step('11-multiselect-all', "(function(){var b=document.querySelector('#msBranch [data-a=all]');b&&b.click();})()");
  await step('12-multiselect-clear', "(function(){var b=document.querySelector('#msBranch [data-a=none]');b&&b.click();document.body.click();document.getElementById('btnReset').click();})()");
  await step('13-report-match', "document.getElementById('qaReport').click()", 3500);
  await step('14-report-close', "document.getElementById('rpClose').click()");
  await step('15-sla-initial', "document.querySelector('.view-tab[data-view=sla]').click()", 3000);
  await step('16-sla-threshold', "(function(){var t=document.getElementById('sThr');t.value='5';t.dispatchEvent(new Event('input'));t.dispatchEvent(new Event('change'));})()", 900);
  await step('17-sla-filters', "(function(){var f=document.getElementById('sFlag');f.value='flag';f.dispatchEvent(new Event('change'));var m=document.getElementById('sMode');m.value='calc';m.dispatchEvent(new Event('change'));var d=document.getElementById('sDup');d.value='last';d.dispatchEvent(new Event('change'));})()");
  await step('18-sla-rows', "document.querySelectorAll('#sBrBody tr[data-b]').forEach((t,i)=>{ if(i<1) t.click(); }); document.querySelectorAll('#sSdBody tr[data-s]').forEach((t,i)=>{ if(i<2) t.click(); })");
  await step('19-sla-sort-page', "document.querySelector('#sLogTbl thead th[data-k=age]') && document.querySelector('#sLogTbl thead th[data-k=age]').click(); document.getElementById('sPgNext').click()");
  await step('20-sla-empty', "(function(){var q=document.getElementById('sQ');q.value='لا يوجد شيء هنا';q.dispatchEvent(new Event('input'));})()");
  await step('21-sla-reset', "(function(){document.getElementById('sReset2').click();})()");
  await step('22-sla-report', "document.getElementById('sReport').click()", 3500);
  await step('23-sla-report-close', "document.getElementById('rpClose').click()");
  await step('24-back-match', "document.querySelector('.view-tab[data-view=match]').click()", 700);
  return out;
}
module.exports = { launch, open, text, charts, scenario, norm, ORIG, BI, MATCH, SLA, ROOT };
