# 🎥 Simple Screen Recording Guide - Microsoft Game Bar

**Record your AQUASENSE-X demo in one take using Windows built-in recorder!**

---

## 🎮 Setup Windows Game Bar (2 minutes)

### Step 1: Enable Game Bar
1. Press `Win + I` to open Settings
2. Go to **Gaming** → **Xbox Game Bar**
3. Turn ON "Record game clips, screenshots, and broadcast using Game Bar"
4. Close Settings

### Step 2: Test Recording
1. Press `Win + G` to open Game Bar
2. Click the **Record button** (red circle) or press `Win + Alt + R`
3. Recording starts - you'll see a small recording widget
4. Press `Win + Alt + R` again to stop
5. Video saved to: `C:\Users\[YourName]\Videos\Captures`

---

## 🎬 Recording Your Demo (One Take)

### Before You Start - Add Demo Data! (2 minutes) ⭐

**Important**: First, populate the database with sample data so you have alerts and history to show!

1. **Stop backend if running** (Ctrl+C in terminal)
2. **Run seed script**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python seed_demo_data.py
```
3. **You'll now have**:
   - 7 days of historical sensor data
   - 11 sample alerts (2 active, 9 resolved)
   - 5 filters with realistic health levels

✅ **See `SEED_DATA_INSTRUCTIONS.md` for details**

---

### Before You Start
- [ ] Demo data seeded (see above)
- [ ] Close all unnecessary apps and browser tabs
- [ ] Turn on Windows **Focus Assist** (quiet notifications)
  - Click system tray → Focus assist → **Alarms only**
- [ ] Hide desktop icons (right-click desktop → View → uncheck Show desktop icons)
- [ ] Have this guide open on a second monitor or phone
- [ ] Start both servers:

**Terminal 1**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\frontend
npm run dev
```

- [ ] Open browser to: http://localhost:5173
- [ ] Maximize browser window (F11 for full screen)

---

## 📋 Recording Steps (Follow Along - 7-10 minutes)

### ▶️ Start Recording
1. Press `Win + G` 
2. Click **Record** button or press `Win + Alt + R`
3. Wait 3 seconds (gives you time to compose yourself)

---

### 1️⃣ Introduction (30 seconds)
**Say while showing Overview page**:
> "Hello, this is AQUASENSE-X - an AI-powered water purification monitoring system for AtomQUEST 2026. 
> It provides real-time multi-parameter sensing, intelligent treatment decisions, and predictive maintenance.
> Let me show you how it works."

**Actions**:
- Slowly scroll through the Overview page
- Show the 6 sensor cards at top
- Show the treatment pipeline diagram
- Show filter health indicators

---

### 2️⃣ Start Simulation (1 minute)
**Say**:
> "First, I'll start a simulation with normal water quality conditions."

**Actions**:
1. Click **"Sensor Simulator"** in left sidebar
2. Say: "We can choose from three scenarios - Normal, Poor Quality, or Abnormal with fault injection"
3. Click **"Start Simulation"**
4. Select **"Normal"** scenario
5. Click **"Start"**
6. Say: "The simulation is now running with 6 sensors generating realistic data"

---

### 3️⃣ Live Monitoring (1 minute)
**Say**:
> "Let's check the live sensor readings."

**Actions**:
1. Click **"Live Monitoring"** in sidebar
2. Say: "Here we see real-time data from all six sensors:"
3. Point to each card with cursor:
   - "TDS around 300 parts per million"
   - "pH is neutral at 7.2"
   - "Turbidity is very low"
   - "Temperature, flow rate, and pressure all normal"
4. Say: "Notice the sparkline charts showing recent trends"
5. Wait 5-10 seconds to show real-time updates

---

### 4️⃣ Water Quality Assessment (45 seconds)
**Say**:
> "The system automatically assesses water quality against WHO standards."

**Actions**:
1. Click **"Water Quality"** in sidebar
2. Show the overall quality badge (GOOD/EXCELLENT)
3. Scroll through the 6 parameter assessments
4. Say: "Green means optimal, yellow is acceptable, red would be critical"
5. Say: "Each parameter has a detailed explanation"

---

### 5️⃣ Treatment Control (1 minute)
**Say**:
> "Here's the seven-stage treatment system. The intelligent engine automatically 
> selects which stages to activate based on inlet water quality."

**Actions**:
1. Click **"Treatment Control"** in sidebar
2. Show the treatment pipeline diagram
3. Say: "For normal water, we're using: Sediment filter, Carbon, Ultrafiltration, 
   Reverse Osmosis, UV sterilization, and Remineralization"
4. Scroll to show stage details and health percentages
5. Scroll to "Output Verification" section
6. Say: "Before dispensing, the system independently verifies the output quality. 
   Only when all checks pass is dispensing allowed."

---

### 6️⃣ RO Recovery (30 seconds)
**Say**:
> "Water conservation is built in. The RO recovery system tracks reject water 
> and routes it to non-potable reuse."

**Actions**:
1. Click **"RO Recovery"** in sidebar
2. Show the recovery rate gauge (~50%)
3. Show water saved metrics
4. Say: "We're targeting 50% or better recovery rates"

---

### 7️⃣ Fault Injection Demo ⭐ (1.5 minutes - IMPORTANT)
**Say**:
> "Now let me demonstrate the safety features. I'll inject a fault to simulate 
> a sensor failure."

**Actions**:
1. Click **"Sensor Simulator"** in sidebar
2. Scroll down to "Fault Injection" section
3. Say: "I'll inject a 'stuck' fault into the TDS sensor"
4. Select **TDS** from dropdown
5. Select **"Stuck"** fault type
6. Click **"Inject Fault"**
7. Quickly click **"Live Monitoring"**
8. Say: "Notice the TDS sensor is now showing invalid - marked in red"
9. Click **"Alerts & Events"**
10. Say: "An alert was automatically generated for the sensor fault"
11. Click **"Treatment Control"**
12. Say: "Most importantly, the system has locked dispensing as a safety measure. 
    No water will be dispensed when critical sensors fail. This is the fail-safe behavior."

---

### 8️⃣ Filter Intelligence (30 seconds)
**Say**:
> "The system also tracks filter health for predictive maintenance."

**Actions**:
1. Click **"Filter Intelligence"** in sidebar
2. Show the 5 filter health cards
3. Say: "Each filter shows its health percentage, usage hours, and operating hours"
4. If ML unavailable: "Machine learning predictions would provide maintenance forecasts 
   in a production deployment"

---

### 9️⃣ Poor Quality Scenario (1 minute)
**Say**:
> "Let me show how the system adapts to challenging water. I'll switch to the 
> poor quality scenario."

**Actions**:
1. Click **"Sensor Simulator"** in sidebar
2. Click **"Stop Simulation"**
3. Wait for it to stop
4. Click **"Start Simulation"**
5. Select **"Poor Quality"**
6. Click **"Start"**
7. Click **"Live Monitoring"**
8. Say: "Now we see much higher TDS - around 800 ppm - and elevated turbidity"
9. Click **"Water Quality"**
10. Say: "The system has classified this as poor quality water"
11. Click **"Treatment Control"**
12. Say: "The treatment system is working harder to purify this water, 
    but the same stages are active"

---

### 🔟 Closing (30 seconds)
**Say**:
> "This demonstrates AQUASENSE-X - a complete water purification monitoring platform 
> with intelligent treatment, safety verification, and predictive maintenance.
> 
> The system is designed for real-world deployment. When connected to physical sensors 
> like ESP32 or Raspberry Pi, it seamlessly switches from simulation to actual monitoring.
> 
> Thank you for watching. This is AQUASENSE-X for AtomQUEST 2026."

**Actions**:
1. Click **"Overview"** to return to main dashboard
2. Slowly pan across the interface
3. Let it settle for 2 seconds

---

### ⏹️ Stop Recording
1. Press `Win + Alt + R` to stop recording
2. Or press `Win + G` and click **Stop**

---

## 📂 Finding Your Video

1. Your video is automatically saved to:
   ```
   C:\Users\[YourName]\Videos\Captures
   ```
2. Look for: `AQUASENSE-X [Date] [Time].mp4`
3. File will be **1-2 GB** for 7-10 minutes

---

## ✅ Quick Checklist

Before recording:
- [ ] Both servers running
- [ ] Browser at http://localhost:5173
- [ ] Focus Assist ON (no popups)
- [ ] Desktop clean (no icons)
- [ ] Read through script once

During recording:
- [ ] Speak clearly and at moderate pace
- [ ] Move cursor slowly
- [ ] Pause 1-2 seconds between pages
- [ ] Don't rush through demonstrations

After recording:
- [ ] Watch the video once
- [ ] Check audio is clear
- [ ] Verify all features shown
- [ ] If unhappy, delete and re-record!

---

## 🎙️ Speaking Tips

**Good pace**: Not too fast, not too slow - like explaining to a friend

**Clear pronunciation**: Emphasize key terms:
- "AQUASENSE-X"
- "Multi-parameter sensing"
- "Fail-safe"
- "Predictive maintenance"

**Natural pauses**: Pause briefly when:
- Switching pages
- After making a point
- Before introducing new features

**If you make a mistake**:
- Just pause for 3 seconds
- Start that sentence again
- You can trim it later (optional)

---

## 🔄 If You Need to Re-record

**Common reasons to re-record**:
- Audio too quiet or unclear
- Made several mistakes
- Forgot to show important features
- Recording too long (over 12 minutes)
- Forgot to demonstrate fault injection

**It's okay to record 2-3 times** - each time will be better!

---

## 📊 Expected Timeline

| Section | Time | Total |
|---------|------|-------|
| Introduction | 30s | 0:30 |
| Start Simulation | 1m | 1:30 |
| Live Monitoring | 1m | 2:30 |
| Water Quality | 45s | 3:15 |
| Treatment Control | 1m | 4:15 |
| RO Recovery | 30s | 4:45 |
| **Fault Demo** ⭐ | 1m30s | 6:15 |
| Filter Intelligence | 30s | 6:45 |
| Poor Quality | 1m | 7:45 |
| Closing | 30s | 8:15 |

**Target**: 8-10 minutes total

---

## 🎬 Alternative: Record in Segments

If one long recording is too difficult:

**Record 3 short videos**:
1. **Part 1** (3 min): Introduction → Live Monitoring → Water Quality
2. **Part 2** (3 min): Treatment → RO Recovery → Fault Demo ⭐
3. **Part 3** (2 min): Filter Intelligence → Poor Quality → Closing

Then you can:
- Use Windows Video Editor to merge them
- Or submit 3 separate videos with labels: "Part 1 of 3", etc.

---

## ✨ You're Ready!

**Simple Recording Command**:
1. `Win + G` (Open Game Bar)
2. Click Record
3. Follow the script
4. `Win + Alt + R` (Stop recording)

**No editing needed** - just one continuous demonstration of the working system!

Good luck! 🎥🌊
