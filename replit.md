# Architecture Pattern Library

## Overview
A web-based viewer for an enterprise architecture pattern library and vendor registry. Browsable UI served via Node.js + Express.

## Tech Stack
- **Runtime:** Node.js 20
- **Web Framework:** Express 5
- **Frontend:** Vanilla HTML/CSS/JS (served as static files from `public/`)
- **Data:** JSON files in `patterns/` and `vendors/`

## Project Structure
```
server.js          — Express server (port 5000, host 0.0.0.0)
public/index.html  — Frontend SPA (vanilla JS)
patterns/          — Architecture pattern JSON + SVG files
vendors/           — Vendor registry JSON
```

## Running
```bash
npm start
```
Starts Express on `http://0.0.0.0:5000`

## API Endpoints
- `GET /api/patterns` — All patterns as JSON array
- `GET /api/patterns/:file` — Single pattern file (JSON or SVG)
- `GET /api/vendors` — Full vendor registry

## Deployment
Configured for Replit Autoscale deployment using `node server.js`.
