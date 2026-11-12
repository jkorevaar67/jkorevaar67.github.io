const api = "https://wgocbnhtmzxalvwlpvyo.supabase.co/functions/v1/bijles";
const $ = id => document.getElementById(id);
const zone = "Europe/Amsterdam";
const localDate = new Intl.DateTimeFormat("sv-SE", { timeZone: zone, dateStyle:"short" });
const heading = new Intl.DateTimeFormat("nl-NL", { timeZone: zone, weekday:"long", day:"numeric", month:"long" });
const shortDate = new Intl.DateTimeFormat("nl-NL", { timeZone: "UTC", day:"numeric", month:"short" });
const clock = new Intl.DateTimeFormat("nl-NL", { timeZone:zone, hour:"2-digit", minute:"2-digit" });
const dayMs = 86400000;
const today = Date.parse(localDate.format(new Date()));
let week = 0;
let selected;
let requestId;
let submitting = false;
let generation = 0;

function endpoint() {
  return api + "?minutes=" + $("duration").value;
}

function range(slot) {
  return clock.format(new Date(slot.starts)) + "–" + clock.format(new Date(slot.ends));
}

function resetSelection() {
  selected = undefined;
  requestId = undefined;
  $("form").hidden = true;
  $("form").elements.agree.checked = false;
}

function render(slots) {
  const start = today + week * 7 * dayMs;
  const end = start + 7 * dayMs;
  const groups = new Map();
  for (const slot of slots) {
    const key = localDate.format(new Date(slot.starts));
    const day = Date.parse(key);
    if (day < start || day >= end) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(slot);
  }
  $("status").textContent = groups.size ? "" : "Geen tijdvakken in deze week.";
  for (const day of groups.values()) {
    const section = document.createElement("section");
    section.className = "day";
    const title = document.createElement("h3");
    title.textContent = heading.format(new Date(day[0].starts));
    const list = document.createElement("div");
    list.className = "slots";
    for (const slot of day) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slot";
      button.disabled = slot.busy;
      button.setAttribute("aria-pressed","false");
      button.textContent = range(slot) + (slot.busy ? " · Bezet" : " · Vrij");
      button.addEventListener("click", () => {
        if (submitting) return;
        document.querySelector('.slot[aria-pressed="true"]')?.setAttribute("aria-pressed","false");
        button.setAttribute("aria-pressed","true");
        selected = slot;
        requestId = crypto.randomUUID();
        $("form").elements.agree.checked = false;
        $("selection").textContent = heading.format(new Date(slot.starts)) + ", " + range(slot)
          + " uur · " + ($("duration").value === "60" ? "€40" : "€60");
        $("result").hidden = true;
        $("form").hidden = false;
        $("form").elements.name.focus();
      });
      list.append(button);
    }
    section.append(title, list);
    $("days").append(section);
  }
}

async function load() {
  const current = ++generation;
  resetSelection();
  $("days").replaceChildren();
  const first = today + week * 7 * dayMs;
  $("week").textContent = shortDate.format(first) + " t/m " + shortDate.format(first + 6 * dayMs);
  $("prev").disabled = week === 0;
  $("next").disabled = week === 3;
  $("status").textContent = "Beschikbaarheid ophalen…";
  try {
    const response = await fetch(endpoint(), {cache:"no-store",signal:AbortSignal.timeout(16000)});
    if (!response.ok) throw Error();
    const slots = await response.json();
    if (current === generation) render(slots);
  } catch {
    if (current === generation) $("status").textContent = "De agenda is tijdelijk onbereikbaar. Probeer Vernieuwen of gebruik het informatieformulier.";
  }
}

$("prev").onclick = () => { if (!submitting && week > 0) { week--; load(); } };
$("next").onclick = () => { if (!submitting && week < 3) { week++; load(); } };
$("refresh").onclick = () => { if (!submitting) load(); };
$("duration").onchange = load;

$("form").addEventListener("submit", async event => {
  event.preventDefault();
  if (submitting || !selected) return;
  submitting = true;
  $("submit").disabled = true;
  $("duration").disabled = true;
  const payload = Object.fromEntries(new FormData($("form")));
  const result = $("result");
  result.hidden = false;
  result.textContent = "Reservering opslaan…";
  try {
    const response = await fetch(endpoint(), {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...payload, starts:selected.starts, agree:payload.agree === "on", id:requestId}),
      signal:AbortSignal.timeout(25000),
    });
    const data = await response.json();
    if (!response.ok) {
      result.textContent = data.error;
      if (response.status === 409) await load();
      return;
    }
    result.textContent = "Je bijles is gereserveerd. Reserveringsnummer: " + data.id
      + (data.emailSent ? ". De bevestiging is per e-mail verstuurd." : ". De e-mailverzending is nog niet bevestigd. Bewaar dit nummer.");
    $("form").reset();
    await load();
    result.focus();
  } catch {
    result.textContent = "De verbinding is onderbroken. Verstuur hetzelfde formulier opnieuw om je reservering te controleren.";
  } finally {
    submitting = false;
    $("submit").disabled = false;
    $("duration").disabled = false;
  }
});
load();
