# 📊 Add Demo Data to AQUASENSE-X

This will populate your database with realistic sample data so you have something to show during your demo recording!

---

## 🎯 What Demo Data Gets Added

### ✅ 7 Days of Historical Sensor Data
- **2,016 sensor readings** (6 sensors × 336 time points)
- Readings every 5 minutes for the past week
- Realistic daily patterns (morning spikes, usage peaks)
- Occasional turbidity spikes (simulated)

### ✅ 11 Sample Alerts
- **2 unresolved alerts** (currently active)
  - Carbon filter health low (warning)
  - UV lamp high usage (info)
  
- **9 resolved historical alerts**
  - Sensor faults (fixed)
  - Water quality warnings (resolved)
  - Filter maintenance (completed)
  - Safety incidents (cleared)

**Mix of severities**: Critical, Warning, Info

### ✅ 5 Filter Health Records
- **Sediment**: 65% health, replaced 45 days ago
- **Carbon**: 28% health (⚠️ needs replacement soon)
- **UF Membrane**: 82% health, good condition
- **RO Membrane**: 55% health, moderate use
- **UV Lamp**: 45% health, 8200 hours (high usage)

---

## 🚀 How to Add Demo Data

### Step 1: Stop Backend Server (if running)
If your backend is running, stop it:
- Press `Ctrl + C` in the backend terminal

### Step 2: Run the Seed Script

```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\backend
venv\Scripts\activate
python seed_demo_data.py
```

**Expected Output**:
```
============================================================
  AQUASENSE-X Demo Data Seeder
============================================================

Clearing existing data...
✓ Data cleared
Generating sensor readings for past 7 days...
✓ Generated 2016 sensor readings
Generating sample alerts...
✓ Generated 11 alerts
Generating filter health data...
✓ Generated 5 filter health records

============================================================
  ✓ Demo data seeded successfully!
============================================================

You now have:
  • 7 days of historical sensor readings
  • 11 sample alerts (various types and statuses)
  • 5 filter health records with realistic usage

Start your servers and record your demo!
============================================================
```

### Step 3: Restart Backend Server

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 4: Start Frontend (if not running)

Open **new terminal**:
```bash
cd C:\Users\shyle\OneDrive\Documents\Github\AQUASENSE-X\frontend
npm run dev
```

---

## 📺 What You Can Now Show in Your Demo

### 1. **Alerts & Events Page** 🎉
Before: Empty  
After: **11 alerts** showing:
- 2 active alerts (not resolved)
- 9 historical alerts (resolved)
- Different severity levels
- Timeline view populated

**What to say**:
> "Here you can see the alert history. Currently we have two active alerts - 
> the carbon filter needs replacement soon, and the UV lamp has high usage hours. 
> The system tracks all alerts with timestamps, severity levels, and recommended actions."

### 2. **Historical Analytics Page** 📊
Before: No data  
After: **7 days of sensor trends** with charts

**What to say**:
> "The system logs all sensor data for trend analysis. Here we can see 7 days 
> of historical readings showing daily patterns - notice the TDS spikes during 
> morning hours when usage is highest."

### 3. **Filter Intelligence Page** 🔧
Before: Generic values  
After: **Realistic filter health** with:
- Carbon filter at 28% (red - needs replacement)
- UV lamp at 45% with 8200 hours
- Other filters at various stages

**What to say**:
> "Each filter shows its current health and usage. Notice the carbon filter is 
> at 28% - the system is alerting us to schedule replacement soon. The UV lamp 
> has over 8000 operating hours and is due for replacement in about 20 days."

### 4. **Overview Dashboard** 🎯
Before: All at 100%  
After: **Realistic values** showing some filters need attention

**What to say**:
> "The overview shows system health at a glance. We can see most components 
> are healthy, but the carbon filter and UV lamp need attention soon."

---

## 🔄 Resetting Demo Data

If you want to re-seed with fresh data:

```bash
# Stop backend server (Ctrl+C)
cd backend
venv\Scripts\activate
python seed_demo_data.py
# Restart backend server
```

This will:
1. Clear all existing data
2. Generate fresh demo data
3. Ready for new recording

---

## 💡 Tips for Recording with Demo Data

### Show the Timeline
In **Alerts & Events** page:
- Filter by severity (show Critical, Warning, Info)
- Show resolved vs unresolved
- Point out the timeline view

### Explain the Patterns
In **Historical Analytics**:
- Point to daily usage patterns
- Show the turbidity spike events
- Explain seasonal variations (if asked)

### Highlight Maintenance
In **Filter Intelligence**:
- Focus on the carbon filter (28% - needs action)
- Show the replacement due dates
- Explain how usage hours accumulate

### Compare Before/After
Show alert generation:
1. Show existing alerts (seeded data)
2. Inject fault during demo (new alert)
3. Show how new alert appears in the list

---

## ✅ Quick Check - Data Was Added Successfully

After running seed script, check these pages:

**Alerts & Events**:
- [ ] Shows 11 alerts
- [ ] 2 are unresolved (no checkmark)
- [ ] Different severity colors (red, yellow, blue)

**Historical Analytics**:
- [ ] Charts show 7 days of data
- [ ] Sensor trends visible
- [ ] Summary stats populated

**Filter Intelligence**:
- [ ] 5 filters show different health percentages
- [ ] Carbon at ~28% (red)
- [ ] UV lamp at ~45%
- [ ] Usage hours and litres populated

**Overview Dashboard**:
- [ ] Filter health bars show realistic values (not all 100%)
- [ ] Some filters show warning colors

---

## 🎬 Updated Recording Flow

Your demo flow stays the same, but now you can:

1. **Start with Overview** - Show filter health isn't perfect (realistic)
2. **Show Alerts** - Point out existing alerts before injecting new fault
3. **Show Analytics** - Demonstrate historical data exists
4. **Run Simulation** - New data adds to existing history
5. **Inject Fault** - New alert adds to existing alerts list
6. **Show Filters** - Explain maintenance scheduling based on health

---

## 🆘 Troubleshooting

### "No module named 'app'"
**Solution**: Make sure you're in the `backend` directory and venv is activated:
```bash
cd backend
venv\Scripts\activate
python seed_demo_data.py
```

### Database locked error
**Solution**: Make sure backend server is stopped (Ctrl+C) before running seed script

### Data doesn't show in frontend
**Solution**: 
1. Restart backend server
2. Refresh browser (F5)
3. Check backend health: http://localhost:8000/api/v1/system/health

---

## 🎯 Ready to Record!

Now you have:
✅ Realistic demo data  
✅ Populated alerts and history  
✅ Filter maintenance scenarios  
✅ Something to show and explain  

**Run the seed script now, then start recording your demo!** 🎥
