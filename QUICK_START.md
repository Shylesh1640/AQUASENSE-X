# AQUASENSE-X Quick Start

## 🚀 3-Minute Setup Guide

### Prerequisites
- Python 3.11+ installed
- Node.js 18+ installed
- Two terminal windows

---

## First Time Setup

### Terminal 1 - Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
pip install -r requirements.txt
```

### Terminal 2 - Frontend Setup  
```bash
cd frontend
npm install
```

---

## Running the Application

### Terminal 1 - Start Backend
```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/Mac
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend running on: http://localhost:8000

### Terminal 2 - Start Frontend
```bash
cd frontend
npm run dev
```

✅ Frontend running on: http://localhost:5173

---

## Verify Installation

**1. Test Backend Health:**
```bash
curl http://localhost:8000/api/v1/system/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0"
}
```

**2. Test Frontend:**
Open browser: http://localhost:5173
You should see the AQUASENSE-X dashboard.

---

## Start Simulation

1. Go to http://localhost:5173
2. Click **"Sensor Simulator"** in left sidebar
3. Click **"Start Simulation"** button
4. Select **"Normal"** scenario
5. Click **"Start"**

✅ You should see live sensor data updating!

---

## Quick Commands Reference

### Backend Commands
```bash
# First time setup
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Every time after that
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Commands
```bash
# First time setup
cd frontend
npm install

# Every time after that
cd frontend
npm run dev
```

### Testing
```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

---

## Troubleshooting

### "Python not found"
Install Python from: https://www.python.org/downloads/

### "Node not found"  
Install Node.js from: https://nodejs.org/

### "Port 8000 already in use"
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

### "Module not found"
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt --force-reinstall
```

---

## API Endpoints

**System:**
- Health: `GET http://localhost:8000/api/v1/system/health`
- Status: `GET http://localhost:8000/api/v1/system/status`

**Sensors:**
- Current: `GET http://localhost:8000/api/v1/sensors/current`
- History: `GET http://localhost:8000/api/v1/sensors/history`

**Simulation:**
- Start: `POST http://localhost:8000/api/v1/simulation/start`
- Pause: `POST http://localhost:8000/api/v1/simulation/pause`
- Stop: `POST http://localhost:8000/api/v1/simulation/stop`

**Full API Docs:** http://localhost:8000/docs

---

## Next Steps

✅ **Explore**: All 11 pages in the dashboard  
✅ **Train ML**: Go to "Filter Intelligence" → "Train Model"  
✅ **Test Faults**: Try "Abnormal" scenario in Simulator  
✅ **Run Tests**: `pytest tests/ -v`  
✅ **Read Docs**: `GETTING_STARTED.md`, `README.md`

---

## Daily Workflow

**Starting work:**
```bash
# Terminal 1
cd backend && venv\Scripts\activate && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2  
cd frontend && npm run dev
```

**Stopping:**
- Press `Ctrl+C` in both terminals

---

## Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Health check returns `{"status": "healthy"}`
- [ ] Dashboard displays correctly
- [ ] Simulation starts and generates data
- [ ] Live charts update in real-time
- [ ] All 11 pages accessible

✅ **All checked?** You're ready for development!

---

**Need help?** See `GETTING_STARTED.md` for detailed guide or `INSTALLATION.md` for troubleshooting.
