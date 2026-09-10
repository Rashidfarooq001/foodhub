#!/bin/bash
# =====================================================================
# ZaykaFood Redis Capacity Benchmark
# Run this ON the staging server where Redis is accessible.
# =====================================================================

set -euo pipefail

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_AUTH="${REDIS_AUTH:-}"

echo "=== ZaykaFood Redis Capacity Benchmark ==="
echo "Host: $REDIS_HOST:$REDIS_PORT"
echo ""

AUTH_FLAG=""
if [ -n "$REDIS_AUTH" ]; then
  AUTH_FLAG="-a $REDIS_AUTH"
fi

run_bench() {
  local ops=$1
  local pipeline=$2
  echo -n "Test: $ops ops, pipeline=$pipeline ... "
  redis-benchmark \
    -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_FLAG \
    -n "$ops" \
    -P "$pipeline" \
    -c 50 \
    -t set,get,hset,lpush,ping \
    --quiet 2>/dev/null | tail -5
  echo ""
}

# Baseline
run_bench 100000 1
# With pipelining (simulates batched GPS writes)
run_bench 100000 10
# Stress
run_bench 500000 10
# Pub/Sub throughput
echo "=== Pub/Sub Throughput ==="
redis-benchmark \
  -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_FLAG \
  -n 200000 \
  -P 10 \
  -c 100 \
  -t subscribe,publish \
  --quiet 2>/dev/null | tail -5

echo ""
echo "=== Redis Info ==="
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_FLAG INFO stats | grep -E "total_commands_processed|instantaneous_ops_per_sec|connected_clients|used_memory_human|mem_fragmentation_ratio"
redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" $AUTH_FLAG INFO latencystats 2>/dev/null || true
