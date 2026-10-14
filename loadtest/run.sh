#!/bin/sh
set -e

SCENARIOS="
node-io               http://node:3000/io               await sleep(1s) on the event loop
node-cpu              http://node:3000/cpu              fib() on the only JS thread
node-cpu-parallel     http://node:3000/cpu-parallel     fib() on a new worker thread per request
python-io             http://python:8000/io             await asyncio.sleep(1) on the event loop
python-cpu            http://python:8000/cpu            fib() inside async def, on the event loop
python-cpu-thread     http://python:8000/cpu-thread     fib() inside def, on FastAPI's threadpool
python-cpu-parallel   http://python:8000/cpu-parallel   fib() on a process pool
"

echo "Each scenario: $VUS virtual users calling one endpoint in a loop for $DURATION (servers capped at $CPUS CPUs)"
echo "$SCENARIOS" | while read -r name url what; do
  [ -n "$name" ] || continue
  echo "→ $name: GET $url"
  K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_PERIOD=2s K6_WEB_DASHBOARD_EXPORT="/reports/$name.html" \
    k6 run --quiet -e NAME="$name" -e URL="$url" -e WHAT="$what" /loadtest/test.js </dev/null
done

k6 run --quiet -e NAMES="$(echo "$SCENARIOS" | awk 'NF { printf "%s ", $1 }')" /loadtest/report.js </dev/null
chown -R "$(stat -c %u:%g /reports)" /reports 2>/dev/null || true
echo "Done. Open reports/index.html (Ctrl+C stops the servers)."
