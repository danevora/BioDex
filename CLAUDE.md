# CLAUDE.md

This file provides context for Claude Code when working in this repository.

## Project Overview

BioDex is a Pokédex-style web app for discovering and collecting real-world animals. Users photograph animals, AI identifies the species, and captures are added to their personal collection.

## Tech Stack

- **Frontend**: Next.js (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Package Manager**: Yarn
- **Backend**: FastAPI (Python)

## Core Features

- **Dex Grid**: Visual grid showing captured vs undiscovered animals
- **AI Capture**: Camera capture with AI-powered species identification
- **Animal Details**: Info pages for each species with user's photo

## Design Principles

- Mobile-first, responsive design
- Simple and fun - focus on the capture-and-collect loop
- No unnecessary complexity

## Running the App

### Frontend (Next.js)
```bash
cd frontend && yarn dev
```
Runs on http://localhost:3000

### Backend (FastAPI)
The backend requires a Python virtual environment. First-time setup:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

To run the backend:
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```
Runs on http://127.0.0.1:8000

## Development Notes

- Offer to install any dev dependencies or CLI tools needed along the way
- Use `yarn` for all frontend package management
