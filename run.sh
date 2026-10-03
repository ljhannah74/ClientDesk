#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/MyApp.Api"
CLIENT_DIR="$ROOT_DIR/myapp.client"

cleanup() {
    echo
    echo "Stopping application..."

    if [[ -n "${API_PID:-}" ]]; then
        kill "$API_PID" 2>/dev/null || true
    fi

    if [[ -n "${CLIENT_PID:-}" ]]; then
        kill "$CLIENT_PID" 2>/dev/null || true
    fi

    wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting ASP.NET Core API..."
(
    cd "$API_DIR"
    dotnet run
) &
API_PID=$!

echo "Starting React frontend..."
(
    cd "$CLIENT_DIR"
    npm run dev
) &
CLIENT_PID=$!

echo
echo "Application started."
echo "API PID:      $API_PID"
echo "Frontend PID: $CLIENT_PID"
echo
echo "Press Ctrl+C to stop both."
echo

wait