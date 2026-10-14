const results = __ENV.NAMES.trim().split(/\s+/).map((name) => JSON.parse(open(`/reports/${name}.json`)));
const { vus, duration } = results[0];
const CPUS = __ENV.CPUS || '?';

export const options = { vus: 1, iterations: 1 };
export default function () {}

export function handleSummary() {
  return { '/reports/index.html': page() };
}

const GROUPS = [
  ['node-', 'Node.js + Express'],
  ['python-', 'Python + FastAPI'],
];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const sec = (ms) => `${(ms / 1000).toFixed(2)} s`;
const path = (r) => r.url.replace(/^\w+:\/\/[^/]+/, '');

function chart(title, note, value, format) {
  const max = Math.max(...results.map(value));
  const rows = GROUPS.map(([prefix, label]) => {
    const items = results.filter((r) => r.name.startsWith(prefix));
    const bars = items.map((r) => {
      const v = format(value(r));
      return `
      <div class="row" tabindex="0" data-value="${esc(v)}" data-name="${esc(r.name)}" data-what="${esc(r.what)}"
           aria-label="${esc(`${r.name}: ${v}`)}">
        <span class="label">${esc(path(r))}</span>
        <span class="track"><span class="bar" style="--w:${(value(r) / max).toFixed(4)}"></span><span class="value">${esc(v)}</span></span>
      </div>`;
    });
    return `<div class="group">${label}</div>${bars.join('')}`;
  });
  return `
    <figure class="card">
      <figcaption><h2>${title}</h2><p>${note}</p></figcaption>
      <div class="bars">${rows.join('')}</div>
    </figure>`;
}

function table() {
  const rows = results.map((r) => `
        <tr>
          <td>${esc(r.name)}</td>
          <td class="what">${esc(r.what)}</td>
          <td class="num">${r.requests}</td>
          <td class="num">${r.rps.toFixed(2)}</td>
          <td class="num">${sec(r.avg)}</td>
          <td class="num">${sec(r.med)}</td>
          <td class="num">${sec(r.p95)}</td>
          <td class="num">${sec(r.max)}</td>
          <td class="num">${(r.failed * 100).toFixed(1)}%</td>
          <td><a href="${esc(r.name)}.html">dashboard</a></td>
        </tr>`);
  return `
    <div class="card scroll">
      <table>
        <thead><tr>
          <th>Scenario</th><th>What the endpoint does</th><th class="num">Requests</th><th class="num">Req/s</th>
          <th class="num">Avg</th><th class="num">Median</th><th class="num">p95</th><th class="num">Max</th>
          <th class="num">Failed</th><th>Over time</th>
        </tr></thead>
        <tbody>${rows.join('')}
        </tbody>
      </table>
    </div>`;
}

function page() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concurrency vs parallelism: k6 results</title>
<style>
  :root {
    color-scheme: light;
    --page: #f9f9f7; --surface: #fcfcfb; --border: rgba(11, 11, 11, 0.10);
    --text: #0b0b0b; --text-2: #52514e; --muted: #898781; --grid: #e1e0d9; --baseline: #c3c2b7;
    --series-1: #2a78d6;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --page: #0d0d0d; --surface: #1a1a19; --border: rgba(255, 255, 255, 0.10);
      --text: #f0efec; --text-2: #c3c2b7; --muted: #898781; --grid: #2c2c2a; --baseline: #383835;
      --series-1: #3987e5;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--page); color: var(--text); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 1040px; margin: 0 auto; padding: 40px 24px 64px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 0; }
  h3 { font-size: 16px; margin: 32px 0 12px; }
  p { margin: 0; }
  a { color: var(--series-1); }
  code { font-size: 0.9em; }
  .meta { color: var(--muted); font-size: 13px; }
  .lede { color: var(--text-2); margin: 16px 0 24px; max-width: 75ch; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin: 0; }
  .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 16px; }
  figcaption p { color: var(--muted); font-size: 13px; margin-bottom: 12px; }

  .group { color: var(--text-2); font-size: 13px; font-weight: 600; margin: 12px 0 4px; }
  .row { display: grid; grid-template-columns: 7.5rem 1fr; align-items: center; height: 30px; border-radius: 6px; outline-offset: 2px; }
  .row:hover .bar, .row:focus-visible .bar { filter: brightness(1.15); }
  .label { color: var(--text-2); font-size: 13px; font-family: ui-monospace, monospace; }
  .track { display: flex; align-items: center; gap: 8px; height: 100%; border-left: 1px solid var(--baseline); }
  .bar { width: calc((100% - 4.5rem) * var(--w)); min-width: 2px; height: 18px; background: var(--series-1); border-radius: 0 4px 4px 0; }
  .value { color: var(--text); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }

  #tip { position: fixed; z-index: 1; pointer-events: none; max-width: 280px; padding: 8px 10px; border-radius: 8px;
         background: var(--surface); border: 1px solid var(--border); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12); font-size: 13px; }
  #tip strong { display: block; font-size: 15px; }
  #tip span { display: block; color: var(--text-2); }
  #tip small { display: block; color: var(--muted); }

  .scroll { overflow-x: auto; padding: 8px 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; color: var(--muted); font-weight: 600; }
  th, td { padding: 8px; border-bottom: 1px solid var(--grid); white-space: nowrap; }
  tbody tr:last-child td { border-bottom: 0; }
  td.what { color: var(--text-2); white-space: normal; min-width: 16rem; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }

  dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 16px; margin: 0; }
  dt { font-weight: 600; }
  dd { margin: 0; color: var(--text-2); }
</style>
</head>
<body>
<main>
  <h1>Concurrency vs parallelism: k6 results</h1>
  <p class="meta">${vus} virtual users per scenario · ${esc(duration)} each · each server capped at ${esc(CPUS)} CPUs · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC</p>
  <p class="lede">
    Each virtual user sends a request, waits for the answer, then immediately sends the next one, so there are always
    ${vus} requests in flight. Every request is about 1 s of work: a 1 s wait or about 1 s of CPU.
    A server that works on all of them at once does about ${vus} req/s at about 1 s each.
    A server that works on one at a time does about 1 req/s, and each request waits about ${vus} s in line.
    Parallel CPU work sits in between: it can't go faster than one request per core, so at most about ${esc(CPUS)} req/s.
  </p>

  <div class="charts">
    ${chart('Throughput', 'Requests completed per second (higher is better)', (r) => r.rps, (v) => `${v.toFixed(2)} req/s`)}
    ${chart('Average latency', 'Seconds from sending a request to getting the response (lower is better)', (r) => r.avg, sec)}
  </div>

  <h3>All metrics</h3>
  ${table()}

  <h3>What the numbers mean</h3>
  <div class="card">
    <dl>
      <dt>Requests</dt><dd>HTTP requests completed during the scenario (k6 <code>http_reqs</code>).</dd>
      <dt>Req/s</dt><dd>Throughput: how many requests the server finished per second.</dd>
      <dt>Avg, Median, p95, Max</dt><dd>Latency (k6 <code>http_req_duration</code>), including time spent queued behind other requests. p95 means 95% of requests were faster than this value.</dd>
      <dt>Failed</dt><dd>Share of requests that errored or returned a non-2xx/3xx status (k6 <code>http_req_failed</code>).</dd>
      <dt>Sanity check</dt><dd>Req/s × average latency ≈ ${vus} (the number of virtual users) on every row. That is Little's law: if the server is slow, each user simply waits longer.</dd>
      <dt>Over time</dt><dd>Each scenario's k6 dashboard shows the same metrics in 2 s buckets across the run.</dd>
    </dl>
  </div>
</main>

<div id="tip" role="tooltip" hidden><strong></strong><span></span><small></small></div>
<script>
  const tip = document.getElementById('tip');
  const [value, name, what] = tip.children;
  function show(row, x, y) {
    value.textContent = row.dataset.value;
    name.textContent = row.dataset.name;
    what.textContent = row.dataset.what;
    tip.hidden = false;
    tip.style.left = Math.min(x, innerWidth - tip.offsetWidth - 8) + 'px';
    tip.style.top = Math.min(y, innerHeight - tip.offsetHeight - 8) + 'px';
  }
  for (const row of document.querySelectorAll('.row')) {
    row.addEventListener('pointermove', (e) => show(row, e.clientX + 14, e.clientY + 14));
    row.addEventListener('focus', () => { const b = row.getBoundingClientRect(); show(row, b.left + 120, b.bottom + 4); });
    row.addEventListener('pointerleave', () => (tip.hidden = true));
    row.addEventListener('blur', () => (tip.hidden = true));
  }
</script>
</body>
</html>
`;
}
