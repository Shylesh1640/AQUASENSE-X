# Getting Started with AQUASENSE-X

## 🎯 Quick Start Guide

This guide will help you get AQUASENSE-X running on your Windows machine in under 5 minutes.

---

## Step 1: Verify Prerequisites

### Check Python
```bash
python --version
```
**Required**: Python 3.11 or higher (3.11, 3.12, 3.13, 3.14 all work)

If not installed: Download from https://www.python.org/downloads/

### Check Node.js
```bash
node --version
npm --version
```
**Required**: Node.js 18 or higher

If not installed: Download from https://nodejs.org/

---

## Step 2: Setup Backend (First Time Only)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

This only needs to be done once.

---

## Step 3: Start the Backend

**Every time you want to run the backend:**

```bash
# Navigate to backend
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Run server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Keep this terminal open** - the backend will run here.

### Verify Backend is Running
Open in browser: http://localhost:8000/api/v1/system/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "...",
  "version": "1.0.0",
  "uptime_seconds": ...
}
```

---

## Step 4: Setup Frontend (First Time Only)

**Open a NEW terminal window** (keep backend running in the first one)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

This only needs to be done once.

---

## Step 5: Start the Frontend

**Every time you want to run the frontend:**

```bash
# Navigate to frontend
cd frontend

# Run development server
npm run dev
```

**Keep this terminal open** - the frontend will run here.

### Verify Frontend is Running
Open in browser: http://localhost:5173

You should see the AQUASENSE-X dashboard.

---

## Step 6: Start Your First Simulation

1. **Navigate to Sensor Simulator**
   - Click "Sensor Simulator" in the left sidebar

2. **Start Simulation**
   - Click the green **"Start Simulation"** button
   - Choose scenario: "Normal" (recommended for first run)
   - Click **"Start"**

3. **Watch Live Data**
   - Go to "Live Monitoring" page
   - See real-time sensor readings updating
   - Observe sparklines and trends

4. **Explore Features**
   - **Overview**: Command center dashboard
   - **Water Quality**: Parameter assessments
   - **Treatment Control**: 7-stage pipeline
   - **Filter Intelligence**: ML predictions
   - **Alerts & Events**: System alerts

---

## 🎮 Simulation Scenarios

### Normal Water (Recommended First Run)
- Clean municipal water supply
- TDS: ~300 ppm
- pH: ~7.2
- Turbidity: ~1 NTU
- Stable, gradual filter aging

**Use this to**: Learn the interface, see normal operation

### Poor Quality Water
- Challenging inlet conditions
- TDS: 600-900 ppm (high dissolved solids)
- pH: 5.5-6.5 (acidic)
- Turbidity: 8-15 NTU (cloudy)

**Use this to**: Test treatment effectiveness, see adaptive control

### Abnormal (Fault Injection)
- Starts normal
- At 30 seconds: Pressure drop event
- At 60 seconds: Sensor failure

**Use this to**: Test alert system, safety interlocks

---

## 🔬 Training the ML Model

1. **Navigate to Filter Intelligence**
   - Click "Filter Intelligence" in sidebar

2. **Train Model**
   - Click **"Train Prediction Model"** button
   - Wait ~30 seconds for training to complete
   - You'll see "Training Complete" notification

3. **View Predictions**
   - Click **"Generate Predictions"**
   - See predicted remaining life for all 5 filters
   - Note: Model is trained on synthetic data (experimental)

---

## 📊 API Exploration

### Interactive API Docs
Visit: http://localhost:8000/docs

Try these endpoints:
1. **GET /api/v1/sensors/current** - See live sensor readings
2. **GET /api/v1/water-quality/current** - Quality assessment
3. **GET /api/v1/treatment/status** - Treatment pipeline
4. **POST /api/v1/simulation/pause** - Pause simulation
5. **POST /api/v1/simulation/resume** - Resume simulation

### Example: Get Sensor Data
```bash
curl http://localhost:8000/api/v1/sensors/current
```

### Example: Start Simulation via API
```bash
curl -X POST http://localhost:8000/api/v1/simulation/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "normal", "speed": 1.0}'
```

---

## 🧪 Running Tests

### All Tests
```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

Expected: **60+ tests pass** ✅

### Safety Tests Only (Critical)
```bash
pytest tests/safety/ -v
```

These tests verify fail-safe behavior:
- Default state is LOCKED
- Invalid sensors lock dispensing
- Treatment failures lock dispensing
- ML cannot override safety

---

## 🎯 Demo Walkthrough for AtomQUEST

### 5-Minute Demo Script

**1. Overview (30 seconds)**
- Show main dashboard
- Point out: 6 sensors, treatment pipeline, filter health
- Highlight "SIMULATED DATA" badge

**2. Start Simulation (1 minute)**
- Go to Sensor Simulator
- Start "Normal" scenario
- Show live readings updating
- Adjust speed to 5x

**3. Live Monitoring (1 minute)**
- Real-time sensor charts
- Sparklines for each sensor
- Dispensing status (green = allowed)

**4. Treatment Control (1 minute)**
- Show 7-stage pipeline visualization
- Explain: Sediment → Carbon → UF → RO → UV → Remineralization
- Stage health indicators

**5. Predictive Maintenance (1.5 minutes)**
- Filter Intelligence page
- Train ML model (if not already trained)
- Show predictions for filter replacement
- Explain synthetic data limitation

**6. Fault Injection (30 seconds)**
- Go back to Sensor Simulator
- Select "Abnormal" scenario
- Show alert generation
- Show dispensing lock (safety feature)

---

## 🐛 Common Issues

### "Port 8000 already in use"
```bash
# Find and kill the process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### "Module not found" errors
```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt --force-reinstall
```

### Frontend won't load
```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Simulation not starting
- Check backend logs for errors
- Verify backend health: http://localhost:8000/api/v1/system/health
- Check browser console (F12) for errors

---

## 📁 Project Structure Quick Reference

```
AQUASENSE-X/
├── start-backend.bat       ← Start backend
├── start-frontend.bat      ← Start frontend
├── start.bat               ← Start both
├── README.md               ← Overview
├── GETTING_STARTED.md      ← This file
│
├── backend/
│   ├── app/
│   │   ├── main.py         ← FastAPI app entry
│   │   ├── simulation/     ← Simulation engine
│   │   ├── services/       ← Business logic
│   │   ├── api/routes/     ← API endpoints
│   │   └── ml/             ← ML pipeline
│   ├── tests/              ← Test suite
│   └── requirements.txt    ← Python dependencies
│
└── frontend/
    ├── src/
    │   ├── pages/          ← 11 application pages
    │   ├── components/     ← React components
    │   └── services/       ← API client, WebSocket
    └── package.json        ← npm dependencies
```

---

## 🎓 Learning Path

### For First-Time Users
1. ✅ Start backend
2. ✅ Start frontend
3. ✅ Run "Normal" simulation
4. ✅ Explore Overview page
5. ✅ Check Live Monitoring

### For Developers
1. ✅ Read API docs: http://localhost:8000/docs
2. ✅ Run test suite: `pytest tests/ -v`
3. ✅ Explore code structure
4. ✅ Try API endpoints with curl
5. ✅ Train ML model

### For AtomQUEST Judges
1. ✅ 5-minute demo walkthrough (above)
2. ✅ Show fault injection scenario
3. ✅ Demonstrate ML predictions
4. ✅ Explain hardware abstraction layer
5. ✅ Show test coverage

---

## 📞 Next Steps

- ✅ **Read**: `PROJECT_DELIVERY.md` for complete technical details
- ✅ **Install**: `INSTALLATION.md` for troubleshooting
- ✅ **Explore**: All 11 pages in the application
- ✅ **Test**: Run the test suite
- ✅ **Customize**: Modify scenarios, thresholds, coefficients

---

## 🎉 Success Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads in browser
- [ ] Health check returns {"status": "healthy"}
- [ ] Simulation starts and generates data
- [ ] Live charts update in real-time
- [ ] ML model trains successfully
- [ ] Tests pass (60+ tests)
- [ ] API docs accessible

If all checked: **You're ready for AtomQUEST 2026 demonstration!** 🚀

---

*For questions or issues, see INSTALLATION.md or README.md*
