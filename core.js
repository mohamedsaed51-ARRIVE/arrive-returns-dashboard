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
  window.OCT = { prep, unrecvOf, pick, totals, group, DUP };
})();
