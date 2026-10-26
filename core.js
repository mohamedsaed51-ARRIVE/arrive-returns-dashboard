(function () {
  const num = (x) => { const n = Number(x); return Number.isFinite(n) ? n : 0; };
  const DUP = ['مكرر_متطابق', 'متابعة_متبقي'];

  function prep(rows) {
    return rows.map((r) => ({
      sheetRow: num(r.sheetRow), date: String(r.date), day: num(String(r.date).slice(8, 10)),
      branch: String(r.branch), sent: num(r.sent), recv: num(r.recv), status: String(r.status),
      unrecv: num(r.unrecv), extra: num(r.extra),
      flags: r.flags ? String(r.flags).split(';').map((s) => s.trim()).filter(Boolean) : [],
    }));
  }
  // الغير مستلم لكل صف: "written" = العمود زي ما هو في الشيت، "calc" = مرسل − (مستلم − غير مدرجة)
  function unrecvOf(r, mode) {
    if (mode === 'calc') return Math.min(r.sent, Math.max(0, r.sent - (r.recv - r.extra)));
    return r.unrecv;
  }
  function pick(rows, f) {
    return rows.filter((r) =>
      (!f.branches || f.branches.size === 0 || f.branches.has(r.branch)) &&
      r.day >= f.from && r.day <= f.to &&
      !(f.excl && r.flags.some((x) => DUP.includes(x))));
  }
  function totals(rows, mode) {
    let sent = 0, unrecv = 0, extra = 0, flagged = 0;
    const days = new Set();
    for (const r of rows) {
      sent += r.sent; unrecv += unrecvOf(r, mode); extra += r.extra;
      if (r.flags.length) flagged++; days.add(r.day);
    }
    return { rows: rows.length, sent, unrecv, matched: sent - unrecv, extra, flagged, days: days.size,
             rate: sent > 0 ? (sent - unrecv) / sent : null };
  }
  function group(rows, key, mode) {
    const m = new Map();
    for (const r of rows) {
      const k = r[key];
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(r);
    }
    return [...m].map(([k, v]) => Object.assign({ key: k }, totals(v, mode)));
  }

  // وسم الجودة (يُحسب من الصفوف بترتيبها في الشيت؛ لا يغيّر أي قيمة)
  function flagRows(rows) {
    const seen = new Set(), prev = new Map(), kind = [], follows = new Set();
    rows.forEach((r, i) => {
      const sig = r.date + '|' + r.branch + '|' + r.sent + '|' + r.recv + '|' + r.unrecv + '|' + r.extra;
      const p = prev.get(r.branch);
      if (seen.has(sig)) kind[i] = 'dup';
      else if (p && p.r.date === r.date && p.r.unrecv > 0 && Math.abs(r.sent - p.r.unrecv) <= 1) { kind[i] = 'follow'; follows.add(p.i); }
      seen.add(sig); prev.set(r.branch, { r, i });
    });
    const perDay = new Map();
    rows.forEach((r, i) => { if (kind[i] || follows.has(i)) return; const k = r.date + '|' + r.branch; perDay.set(k, (perDay.get(k) || 0) + 1); });
    return rows.map((r, i) => {
      const f = [];
      if (kind[i] === 'dup') f.push('مكرر_متطابق');
      else if (kind[i] === 'follow') f.push('متابعة_متبقي');
      else if (!follows.has(i) && perDay.get(r.date + '|' + r.branch) > 1) f.push('تكرار_غير_واضح');
      if (r.recv > r.sent && (r.recv - r.sent > r.extra || r.unrecv > 0)) f.push('مستلم_اكبر_غير_مفسر');
      const a = Math.min(r.sent, Math.max(0, r.sent - (r.recv - r.extra))), b2 = Math.max(0, r.sent - r.recv);
      if (r.unrecv !== a && r.unrecv !== b2) f.push('غير_مستلم_غير_مطابق');
      const full = /^تم الاستلام/.test(r.status);
      if ((full && r.unrecv > 0) || (!full && r.unrecv === 0)) f.push('حالة_غير_متسقة');
      if (/[,،+]/.test(r.branch)) f.push('فرعين_مدمجين');
      return Object.assign({}, r, { flags: f.join(';') });
    });
  }
  window.OCT = { flagRows, prep, unrecvOf, pick, totals, group, DUP };
})();
