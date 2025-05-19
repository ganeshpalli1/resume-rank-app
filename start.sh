#!/bin/bash

# Start the Python FastAPI server
echo "Starting Python API server..."
python src/services/jobDescriptionAnalyzer.py &
API_PID=$!

# Wait a moment for the API server to start
sleep 2

# Start the React frontend
echo "Starting React frontend..."
npm run dev

# Kill the API server when npm run dev exits
kill $API_PID 