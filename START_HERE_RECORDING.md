# 🎥 START HERE - Record Your AQUASENSE-X Demo

**Everything you need to record a professional demo video in 3 easy steps!**

---

## 📋 Quick Overview

You'll record an **8-10 minute video** showing the complete AQUASENSE-X system:
- ✅ Real-time sensor monitoring
- ✅ Intelligent treatment control
- ✅ Safety features (fail-safe demo)
- ✅ Alert management
- ✅ Historical analytics
- ✅ Filter maintenance

**No editing needed** - just one continuous recording with voiceover!

---

## 🚀 Step-by-Step Process

### STEP 1: Add Demo Data (2 minutes) ⭐

This populates your database with realistic sample data:

```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python seed_demo_data.py
```

**You'll get**:
- 📊 7 days of historical sensor readings
- 🚨 11 sample alerts (2 active, 9 resolved)
- 🔧 5 filters with realistic health (carbon filter at 28% - needs replacement!)

**Result**: Your app will have data to show and explain!

📖 **See**: `DEMO_DATA_SUMMARY.txt` for details on what gets added

---

### STEP 2: Start Both Servers (2 minutes)

**Terminal 1 - Backend**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - Frontend**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\frontend
npm run dev
```

**Open browser**: http://localhost:5173

**Enable Focus Assist**: Windows notifications → Focus Assist → Alarms only

---

### STEP 3: Record Your Demo (10-15 minutes)

**Setup Windows Game Bar**:
1. Press `Win + G` to open Game Bar
2. Click **Record** button (or press `Win + Alt + R`)
3. Follow the script below
4. Press `Win + Alt + R` to stop

**Video saved to**: `C:\Users\[You]\Videos\Captures`

---

## 📝 Recording Script (8-10 minutes)

### 🎬 What to Show & Say

Print or have on phone: **`RECORDING_CHEAT_SHEET.txt`**

**Quick Flow**:
1. **Overview** (30s) - Introduction
2. **Start Simulation** (1m) - Normal scenario
3. **Live Monitoring** (1m) - Real-time sensors
4. **Water Quality** (45s) - Assessment
5. **Treatment Control** (1m) - 7-stage pipeline
6. **RO Recovery** (30s) - Water conservation
7. **⭐ Fault Demo** (1.5m) - MOST IMPORTANT!
8. **Filter Intelligence** (30s) - Show carbon filter at 28%
9. **Alerts & Events** - Show 11 historical alerts
10. **Poor Quality** (1m) - Adaptive behavior
11. **Closing** (30s) - Wrap up

📖 **Full Script**: `SIMPLE_RECORDING_GUIDE.md`

---

## 🎯 Key Points to Emphasize

### The Carbon Filter Story
> "Notice the carbon filter is at only 28% health with over 18,000 litres processed. 
> The system generated an alert 2 hours ago recommending replacement within 10 days. 
> This is predictive maintenance in action."

### The Fail-Safe Demo (Most Important!)
> "Watch what happens when I inject a sensor fault... The system immediately detected 
> the invalid reading, generated an alert, and locked dispensing. No water can be 
> dispensed when critical sensors fail - this is the fail-safe behavior."

### The Historical Data
> "The system has logged 7 days of sensor data. We can see daily patterns - TDS spikes 
> during morning usage peaks, and occasional turbidity events from the inlet source."

---

## 📂 File Reference

| File | Purpose | When to Use |
|------|---------|-------------|
| **`RECORDING_CHEAT_SHEET.txt`** ⭐ | Quick reference | Print & keep while recording |
| **`SIMPLE_RECORDING_GUIDE.md`** | Full script | Read before recording |
| **`DEMO_DATA_SUMMARY.txt`** | What data you'll have | Reference for explanations |
| **`SEED_DATA_INSTRUCTIONS.md`** | Seeding details | If you need help with Step 1 |

---

## ✅ Pre-Recording Checklist

Before you press record:

**Data & Servers**:
- [ ] Demo data seeded (ran `python seed_demo_data.py`)
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:5173
- [ ] Both showing no errors in terminals

**System**:
- [ ] Focus Assist ON (no popups during recording)
- [ ] Close all other apps/tabs
- [ ] Desktop icons hidden (optional)
- [ ] Browser in full screen (F11)
- [ ] Game Bar tested (`Win + G`)

**Script**:
- [ ] Read through script once
- [ ] Understand the demo flow
- [ ] Know what to say at each step
- [ ] Have cheat sheet ready

**Audio**:
- [ ] Microphone working (test with Game Bar)
- [ ] Quiet environment
- [ ] Speak clearly at moderate pace

---

## 🎬 Recording Tips

### DO:
✅ Speak naturally - like explaining to a friend  
✅ Move cursor slowly and deliberately  
✅ Pause 2-3 seconds when switching pages  
✅ Emphasize key features (fail-safe, predictive maintenance)  
✅ Point out the carbon filter (28% - needs replacement)  
✅ Show the 11 historical alerts  

### DON'T:
❌ Rush through demonstrations  
❌ Skip the fault injection demo (most important!)  
❌ Forget to mention AtomQUEST 2026  
❌ Move cursor too fast  
❌ Talk too fast or too slow  

### If You Make a Mistake:
1. Pause for 3 seconds
2. Start that sentence again
3. Keep going!
4. (You can trim mistakes later if needed)

---

## 🎮 Game Bar Quick Reference

| Action | Keyboard Shortcut |
|--------|-------------------|
| Open Game Bar | `Win + G` |
| Start/Stop Recording | `Win + Alt + R` |
| Screenshot | `Win + Alt + PrtScn` |

Recording appears in: `C:\Users\[YourName]\Videos\Captures`

---

## 🔍 Verify Demo Data is Working

Before recording, quickly check these pages:

**Alerts & Events**:
- Should show "2 Active, 9 Resolved"
- Two unresolved alerts visible (carbon filter + UV lamp)

**Filter Intelligence**:
- Carbon filter at ~28% (red)
- UV lamp at ~45%
- All 5 filters show different health values

**Historical Analytics**:
- Charts show 7 days of data
- Trend lines visible
- Summary stats populated

**If data is missing**: Re-run `python seed_demo_data.py`

---

## 📊 Expected Timeline

Your recording should be about:
- Minimum: 7 minutes (if quick)
- Target: 8-10 minutes (recommended)
- Maximum: 12 minutes (if very detailed)

**File size**: ~1-2 GB for 10 minutes at 1080p

---

## 🆘 Common Issues

### "No demo data showing"
**Fix**: 
```bash
cd backend
venv\Scripts\activate
python seed_demo_data.py
# Restart backend server
```

### "Game Bar not working"
**Fix**: 
- Settings → Gaming → Xbox Game Bar → Turn ON
- Or use alternative: OBS Studio, ShareX

### "Simulation won't start"
**Fix**: 
- Check backend terminal for errors
- Verify: http://localhost:8000/api/v1/system/health
- Refresh browser (F5)

### "Audio too quiet"
**Fix**: 
- Get closer to microphone (6-8 inches)
- Speak louder
- Adjust mic volume in Windows settings

---

## 🎯 Success Criteria

Your demo is good if it shows:

✅ Introduction with project name  
✅ Live sensor monitoring with real-time updates  
✅ Treatment control and verification  
✅ **Fault injection with fail-safe response** ⭐  
✅ Historical alerts (11 alerts)  
✅ Filter maintenance needs (carbon at 28%)  
✅ Poor quality adaptation  
✅ Closing with AtomQUEST 2026 mention  

**Audio**: Clear voiceover throughout  
**Video**: Smooth cursor movement, no rushing  
**Length**: 7-12 minutes  

---

## 🚀 Ready to Start!

### Final Checklist:
1. ✅ Read this document
2. ✅ Seed demo data
3. ✅ Start both servers
4. ✅ Review script once
5. ✅ Press `Win + G` and record!

### Quick Command Reference:

```bash
# Step 1: Seed Data
cd backend
venv\Scripts\activate
python seed_demo_data.py

# Step 2: Start Backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Step 3: Start Frontend (new terminal)
cd frontend
npm run dev

# Step 4: Record
# Press Win+G, click Record, follow script!
```

---

## 🎉 You Got This!

Everything is prepared:
- ✅ Demo data ready to show
- ✅ Complete script written
- ✅ All features working
- ✅ Simple one-take recording

**Just follow the steps and speak naturally!**

Good luck with your recording! 🎥🌊

**Need help?** Check:
- `SIMPLE_RECORDING_GUIDE.md` - Full walkthrough
- `RECORDING_CHEAT_SHEET.txt` - Quick reference
- `DEMO_DATA_SUMMARY.txt` - What data you have
