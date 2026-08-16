#!/bin/sh
# keep the static server alive regardless of what happens to any one tool call
while :; do
  node "$1" "$2" >/dev/null 2>&1
  sleep 1
done
