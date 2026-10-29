(async function () {
  'use strict';
  const output = document.getElementById('visitor-total');
  if (!output) return;
  let visitorId = null;
  try {
    const key = 'wiznovaVisitorIdV1';
    const stored = localStorage.getItem(key);
    const valid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    visitorId = stored && valid.test(stored) ? stored : crypto.randomUUID();
    localStorage.setItem(key, visitorId);
  } catch (_) {
    // Without persistent browser storage, only read the total.
    visitorId = null;
  }
  try {
    const response = await fetch('https://wgocbnhtmzxalvwlpvyo.supabase.co/rest/v1/rpc/wiznova_home_visit', {
      method: 'POST',
      headers: {
        apikey: 'sb_publishable_0yRUp4LVsYdBcdmwLYfqxg_soc0fpQB',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_visitor_id: visitorId }),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Counter unavailable');
    const total = await response.json();
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Invalid total');
    output.textContent = total.toLocaleString('nl-NL');
  } catch (_) {
    output.textContent = 'tijdelijk niet beschikbaar';
  }
})();
