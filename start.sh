#!/bin/bash
# CoderIQ startup script
# Starts the API server and the React dev server

echo "Starting CoderIQ API server on http://localhost:4000"
python3 api_server/server.py &
API_PID=$!

echo "Starting CoderIQ React app on http://localhost:5173"
cd react_app && npm run dev &
REACT_PID=$!

echo ""
echo "CoderIQ is running."
echo "  API server: http://localhost:4000"
echo "  Report UI:  http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $API_PID $REACT_PID" EXIT
wait
