import http from 'k6/http';
import { check } from 'k6';

const { NAME, URL, WHAT, VUS = '8', DURATION = '30s' } = __ENV;

export const options = {
  scenarios: {
    [NAME]: {
      executor: 'constant-vus',
      vus: Number(VUS),
      duration: DURATION,
      gracefulStop: '2m',
    },
  },
};

export default function () {
  const res = http.get(URL, { timeout: '2m' });
  check(res, { 'status is 200': (r) => r.status === 200 });
}

export function handleSummary(data) {
  const reqs = data.metrics.http_reqs.values;
  const latency = data.metrics.http_req_duration.values;
  const r = {
    name: NAME,
    url: URL,
    what: WHAT,
    vus: Number(VUS),
    duration: DURATION,
    requests: reqs.count,
    rps: reqs.rate,
    avg: latency.avg,
    med: latency.med,
    p95: latency['p(95)'],
    max: latency.max,
    failed: data.metrics.http_req_failed.values.rate,
  };
  const s = (ms) => `${(ms / 1000).toFixed(2)}s`;
  const line =
    `  ${String(r.requests).padStart(4)} requests | ${r.rps.toFixed(2).padStart(5)} req/s | ` +
    `avg ${s(r.avg)} | p95 ${s(r.p95)} | max ${s(r.max)} | failed ${(r.failed * 100).toFixed(0)}%\n`;
  return { stdout: line, [`/reports/${NAME}.json`]: JSON.stringify(r, null, 2) };
}
