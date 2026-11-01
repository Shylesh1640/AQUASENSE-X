# 🎬 AQUASENSE-X Demo Quick Reference

**Print this or keep on second monitor while recording!**

---

## ✅ Pre-Recording Checklist

- [ ] Both servers running (backend: 8000, frontend: 5173)
- [ ] Browser: http://localhost:5173 open
- [ ] Close unnecessary tabs/apps
- [ ] Windows "Do Not Disturb" mode ON
- [ ] Desktop icons hidden
- [ ] Test demo flow once
- [ ] Screen recorder ready (OBS/Game Bar/ShareX)
- [ ] Resolution: 1920x1080, 30fps

---

## 📋 Shot-by-Shot Flow (6-7 min total)

### 1. Overview Page - Introduction (30s)
- Show dashboard
- Highlight 6 sensor cards
- Show treatment pipeline
- Show tagline

### 2. Overview - Architecture (45s)
- Point to sensors
- Explain SENSE → DECIDE → PURIFY → VERIFY → LEARN
- Show filter health
- Show dispensing status

### 3. Sensor Simulator - Start Demo (40s)
**Actions**: Sidebar → Sensor Simulator → Start Simulation → Normal → Start
- Show 3 scenario cards
- Start "Normal" scenario
- Show simulation running
- Show speed controls

### 4. Live Monitoring (50s)
**Actions**: Sidebar → Live Monitoring
- Show 6 sensor cards updating
- Point to sparklines
- Show real-time updates (wait 5-10s)
- Show values: TDS ~300, pH ~7.2, Turbidity ~1

### 5. Water Quality (45s)
**Actions**: Sidebar → Water Quality
- Show overall quality badge (GOOD/EXCELLENT)
- Scroll through 6 assessments
- Show color coding (green = optimal)
- Hover to show explanations

### 6. Treatment Control (50s)
**Actions**: Sidebar → Treatment Control
- Show 7-stage pipeline diagram
- Show active treatment path
- Show stage health %
- Show decision reason

### 7. Verification (30s)
**Actions**: Scroll down on Treatment Control page
- Show "Output Verification" section
- Show PASSED status
- Show verified parameters
- Show "Dispensing Allowed" (green)

### 8. RO Recovery (40s)
**Actions**: Sidebar → RO Recovery
- Show recovery rate gauge (~50%)
- Show water saved metric
- Show recovery trend chart
- Show flow indicators

### 9. Alerts & Events (45s)
**Actions**: Sidebar → Alerts & Events
- Show alert count badges
- Show severity filters
- Show sample alerts (if any)
- Show timeline view

### 10. Fault Injection Demo (1m 10s)
**Actions**: 
1. Sidebar → Sensor Simulator
2. Scroll to "Fault Injection"
3. Select: TDS → Stuck → Inject Fault
4. Sidebar → Live Monitoring (show TDS red/invalid)
5. Sidebar → Alerts & Events (show new alert)
6. Sidebar → Treatment Control (show dispensing LOCKED)

**Key Point**: Demonstrate fail-safe behavior

### 11. Filter Intelligence (40s)
**Actions**: Sidebar → Filter Intelligence
- Show 5 filter health cards
- Show health percentages
- Show usage metrics
- Note: ML may be unavailable (explain limitation)

### 12. Historical Analytics (35s)
**Actions**: Sidebar → Historical Analytics
- Show summary stats
- Show sensor trend charts
- Show time range selector
- Show "Export to CSV" button

### 13. Poor Quality Scenario (50s)
**Actions**:
1. Sidebar → Sensor Simulator
2. Stop Simulation → wait
3. Start Simulation → Poor Quality → Start
4. Sidebar → Live Monitoring (show TDS ~800, Turbidity ~10)
5. Sidebar → Water Quality (show POOR rating, yellow/orange)
6. Sidebar → Treatment Control (show system adaptation)

**Key Point**: Demonstrate adaptive treatment

### 14. API Documentation (30s)
**Actions**: Open new tab → http://localhost:8000/docs
- Scroll through endpoint categories
- Expand one endpoint (GET /api/v1/sensors/current)
- Show schema documentation
- Close tab

### 15. Technology Stack (25s)
**Actions**: Open README.md in editor
- Scroll to "Technology Stack" section
- Show backend stack
- Show frontend stack
- Close editor

### 16. Closing (35s)
**Actions**: Return to Overview page (http://localhost:5173)
- Show full dashboard
- Show "SIMULATED DATA" badge
- Pan slowly across interface
- End recording

---

## 🎯 Key Messages to Emphasize

1. **Intelligence**: Data-driven treatment decisions
2. **Safety**: Fail-safe dispensing lock, independent verification
3. **Predictive**: ML-based filter maintenance (future)
4. **Conservation**: RO reject water recovery
5. **Real-time**: Continuous monitoring and alerts
6. **Adaptability**: Responds to different water quality conditions
7. **Integration Ready**: Hardware abstraction layer for real sensors

---

## 💡 Tips During Recording

- **Move cursor slowly** - easier to follow
- **Pause 2-3 seconds** when changing pages
- **Hover over items** to highlight them
- **If mistake**: Pause, then continue (edit later)
- **Keep steady pace** - don't rush
- **Show don't tell** - let actions speak

---

## 🔄 If Something Goes Wrong

### Simulation Not Starting
- Check backend is running: http://localhost:8000/api/v1/system/health
- Refresh browser (F5)
- Try again

### Data Not Updating
- Check WebSocket connection (browser console F12)
- Stop and restart simulation
- Refresh page

### Page Not Loading
- Clear browser cache (Ctrl+Shift+Del)
- Check both servers running
- Restart frontend dev server

---

## 📊 Expected Values (Normal Scenario)

| Parameter | Normal Range |
|-----------|--------------|
| TDS | 250-350 ppm |
| pH | 6.8-7.5 |
| Turbidity | 0.5-2 NTU |
| Temperature | 20-25°C |
| Flow Rate | 1.8-2.2 LPM |
| Pressure | 38-42 PSI |

## 📊 Expected Values (Poor Quality Scenario)

| Parameter | Poor Range |
|-----------|------------|
| TDS | 600-900 ppm |
| pH | 5.5-6.5 |
| Turbidity | 8-15 NTU |
| Temperature | 20-25°C |
| Flow Rate | 1.5-2.5 LPM |
| Pressure | 35-45 PSI |

---

## 🎬 Recording Commands

**Start Backend** (Terminal 1):
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Frontend** (Terminal 2):
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\frontend
npm run dev
```

**Open in Browser**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/docs

---

## ⏱️ Timing Breakdown

| Section | Duration | Cumulative |
|---------|----------|------------|
| Intro | 30s | 0:30 |
| Architecture | 45s | 1:15 |
| Start Sim | 40s | 1:55 |
| Live Monitor | 50s | 2:45 |
| Water Quality | 45s | 3:30 |
| Treatment | 50s | 4:20 |
| Verification | 30s | 4:50 |
| RO Recovery | 40s | 5:30 |
| Alerts | 45s | 6:15 |
| Fault Demo | 1m10s | 7:25 |
| Filters | 40s | 8:05 |
| Analytics | 35s | 8:40 |
| Poor Quality | 50s | 9:30 |
| API Docs | 30s | 10:00 |
| Tech Stack | 25s | 10:25 |
| Closing | 35s | 11:00 |

**Target**: ~7-8 minutes (you can cut sections if needed)

---

## ✂️ Suggested Cuts for Shorter Version (5 min)

If you need to trim to 5 minutes, **keep these essential shots**:
1. ✅ Intro (30s)
2. ✅ Architecture (30s) - trim to key points
3. ✅ Start Simulation (30s)
4. ✅ Live Monitoring (40s)
5. ✅ Treatment Control (40s)
6. ❌ Skip Verification (covered in treatment)
7. ❌ Skip RO Recovery
8. ❌ Skip Alerts (show during fault)
9. ✅ Fault Injection Demo (1m) - KEY FEATURE
10. ❌ Skip Filters
11. ❌ Skip Analytics
12. ✅ Poor Quality Demo (40s)
13. ❌ Skip API Docs
14. ❌ Skip Tech Stack
15. ✅ Closing (30s)

**Total: ~5 minutes**

---

Good luck! 🎥🌊
