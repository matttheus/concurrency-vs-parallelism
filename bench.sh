#!/usr/bin/env bash
# Fire N requests at the same instant, print each response + its latency, then the total.
# usage: ./bench.sh <url> [n=4]
url=$1
n=${2:-4}

start=$(date +%s%N)
for _ in $(seq "$n"); do
  echo "$(curl -s -w '  -> %{time_total}s' "$url")" &
done
wait
echo "total: $(( ($(date +%s%N) - start) / 1000000 ))ms for $n requests"
