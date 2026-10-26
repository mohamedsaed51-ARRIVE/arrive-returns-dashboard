// الاتصال المباشر بالشيت عبر Apps Script (راجع apps-script/Code.gs).
// ضع رابط النشر (ينتهي بـ /exec) هنا. إن بقي فارغًا تعمل اللوحة على اللقطة الثابتة في data.js.
const LIVE_URL = 'https://script.google.com/macros/s/AKfycbxaE4H9at7cd1U7oQMTkTD3zTDLxs81qZISyaqn8wyfHrz2vLe8Y6Oev11_bTWwqbmvSA/exec';
const REFRESH_SEC = 120;

(function () {
  const chip = document.querySelector('.conn-status-chip');
  const label = chip && chip.lastElementChild;
  const stamp = document.querySelector('.last-updated-chip');
  const setConn = (state, text) => { if (!chip) return; chip.dataset.state = state; label.textContent = text; };
  if (!LIVE_URL) return;

  const SNAP = window.OCT_DATA;                       // اللقطة الأصلية: تُستخدم لتعلّم أسماء الفروع المختصرة
  const snapByRow = new Map(SNAP.map((r) => [String(r.sheetRow), r]));
  const alias = new Map();                            // اسم الفرع كما في الشيت ← الاسم المختصر في اللوحة
  const clean = (b) => b.replace(/^\s*فرع\s+/, '').replace(/\s+/g, ' ').replace(/[()]/g, '').replace(/\.{2,}|…/g, '').trim();
  const nameOf = (raw) => alias.get(raw) || clean(raw);

  function learn(rows) {
    for (const r of rows) {
      const s = snapByRow.get(String(r.sheetRow));
      if (s && s.date === r.date && Number(s.sent) === r.sent && Number(s.recv) === r.recv && !alias.has(r.branch)) alias.set(r.branch, s.branch);
    }
  }

  let lastSig = '';
  async function pull() {
    try {
      const res = await fetch(LIVE_URL, { cache: 'no-store' });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'رد غير صالح');
      learn(j.rows);
      const rows = OCT.flagRows(j.rows.map((r) => Object.assign({}, r, { branch: nameOf(r.branch) })));
      const sig = JSON.stringify(rows);
      if (sig !== lastSig) { lastSig = sig; window.ARRIVE_setData(rows); }
      const t = new Date(j.updatedAt);
      stamp.innerHTML = '<span class="lu-dot"></span><span>آخر تحديث من الشيت</span><span class="lu-time">' +
        t.toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) + '</span>';
      setConn('live', 'متصل بالشيت — تحديث تلقائي كل ' + REFRESH_SEC / 60 + ' دقيقة');
    } catch (e) {
      setConn('error', 'تعذّر الاتصال بالشيت — يُعرض آخر بيانات محمّلة');
      console.error('[live]', e);
    }
  }
  setConn('demo', 'جارٍ الاتصال بالشيت…');
  pull();
  setInterval(pull, REFRESH_SEC * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pull(); });
})();
