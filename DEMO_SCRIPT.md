# AQUASENSE-X Video Demo Script

**Target Duration**: 5-7 minutes  
**Competition**: AtomQUEST 2026 - Track 2: Water Purifier  
**Format**: Screen recording + voiceover

---

## 🎬 Recording Setup

### Recommended Tools
**Windows Screen Recording Options**:
1. **OBS Studio** (Free, Professional) - https://obsproject.com/
   - Best quality, full control
2. **Windows Game Bar** (Built-in)
   - Press `Win + G` to start
3. **ShareX** (Free) - https://getsharex.com/
   - Easy to use, good quality

### Recording Settings
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30 fps minimum
- **Audio**: Record system audio OFF (voiceover added later)
- **Cursor**: Show cursor highlights for clarity

---

## 📝 Demo Flow & Script

### SHOT 1: Title & Introduction (30 seconds)
**Screen**: Overview page (http://localhost:5173)

**Voiceover Script**:
```
"Welcome to AQUASENSE-X - an AI-powered intelligent water purification 
monitoring and predictive maintenance platform. Developed for AtomQUEST 
2026, AQUASENSE-X extends conventional water purification by integrating 
multi-parameter sensing, intelligent treatment decisions, independent 
verification, and data-driven predictive maintenance."
```

**Actions**:
- Show the dashboard overview
- Highlight the tagline: "Intelligent Water. Predictive Care. Trusted Purification"
- Show the 6 sensor KPI cards at top
- Show the treatment pipeline visualization

---

### SHOT 2: Architecture Overview (45 seconds)
**Screen**: Scroll through Overview page showing architecture

**Voiceover Script**:
```
"The system follows a five-stage intelligent pipeline: SENSE, DECIDE, 
PURIFY, VERIFY, and LEARN. Six sensors continuously monitor water quality 
- measuring TDS, pH, turbidity, temperature, flow rate, and pressure. 
This data feeds into an intelligent treatment engine that selects the 
optimal purification path through our seven-stage treatment system."
```

**Actions**:
- Point to the 6 sensor cards (TDS, pH, Turbidity, Temperature, Flow, Pressure)
- Show the treatment pipeline diagram
- Show the filter health indicators
- Scroll to show "Dispensing Status" safety indicator

---

### SHOT 3: Starting Simulation (40 seconds)
**Screen**: Navigate to Sensor Simulator page

**Voiceover Script**:
```
"Let me demonstrate the system with a live simulation. I'm navigating to 
the Sensor Simulator where we can test different water quality scenarios. 
We'll start with the 'Normal' scenario - simulating clean municipal water 
supply."
```

**Actions**:
1. Click "Sensor Simulator" in left sidebar
2. Hover over the three scenario cards
3. Click "Start Simulation" button
4. Select "Normal" scenario
5. Click "Start" in the modal
6. Show the simulation status change to "RUNNING"
7. Show the speed controls (1x, 2x, 5x, 10x)

---

### SHOT 4: Live Monitoring (50 seconds)
**Screen**: Navigate to Live Monitoring page

**Voiceover Script**:
```
"Now the simulation is running. Let's check the Live Monitoring page where 
we can see real-time sensor data. Each parameter updates continuously with 
realistic physics-based behavior. Notice the sparkline charts showing 
recent trends, and the color-coded status indicators. The TDS is around 
300 parts per million, pH is neutral at 7.2, and turbidity is low - all 
indicating good quality inlet water."
```

**Actions**:
1. Click "Live Monitoring" in sidebar
2. Show the 6 large sensor cards
3. Hover over individual cards to show details
4. Point to the sparkline charts
5. Show the "Last Updated" timestamps
6. Let data update for 5-10 seconds to show real-time updates

---

### SHOT 5: Water Quality Assessment (45 seconds)
**Screen**: Navigate to Water Quality page

**Voiceover Script**:
```
"The Water Quality page provides intelligent assessment of all six 
parameters. Each reading is evaluated against WHO drinking water standards 
with clear color-coded indicators. Green means optimal, yellow is acceptable, 
and red indicates critical levels requiring immediate attention. The system 
also provides detailed explanations for each assessment."
```

**Actions**:
1. Click "Water Quality" in sidebar
2. Show the overall quality badge (should be "GOOD" or "EXCELLENT")
3. Scroll through the 6 parameter assessments
4. Hover over one parameter to show the detailed explanation
5. Show the timestamp

---

### SHOT 6: Treatment Control (50 seconds)
**Screen**: Navigate to Treatment Control page

**Voiceover Script**:
```
"Here's the heart of the purification system - our seven-stage treatment 
pipeline. The intelligent engine automatically selects which stages to 
activate based on inlet water quality. For this normal water, we're using 
the standard path: Sediment filter, Carbon filter, Ultrafiltration, 
Reverse Osmosis, UV sterilization, and Remineralization. Each stage shows 
its current status, health percentage, and effectiveness."
```

**Actions**:
1. Click "Treatment Control" in sidebar
2. Show the treatment pipeline flow diagram
3. Hover over individual stages to highlight them
4. Show the "Active Treatment Path" list
5. Show stage health percentages
6. Show the "Decision Reason" explanation

---

### SHOT 7: Independent Verification (30 seconds)
**Screen**: Stay on Treatment Control, scroll to verification section

**Voiceover Script**:
```
"Critical to safety is our independent output verification system. Before 
any water is dispensed, post-treatment sensors verify that TDS, pH, and 
turbidity meet strict safety standards. Only when all parameters pass 
verification is dispensing allowed."
```

**Actions**:
1. Scroll down to "Output Verification" section
2. Show the verification status (should be "PASSED")
3. Show the verified parameters
4. Show the "Dispensing Allowed" status (green checkmark)

---

### SHOT 8: RO Recovery System (40 seconds)
**Screen**: Navigate to RO Recovery page

**Voiceover Script**:
```
"Water conservation is built into the design. Our RO Recovery system tracks 
and routes reject water to controlled non-potable reuse - for irrigation, 
cleaning, or cooling. We're targeting 50% or better recovery rates. The 
system monitors recovery percentage, total saved water, and potential 
environmental impact over time."
```

**Actions**:
1. Click "RO Recovery" in sidebar
2. Show the "Recovery Rate" gauge (should show ~50%)
3. Show "Water Saved Today" metric
4. Show the recovery trend chart
5. Scroll to show the flowrate indicators

---

### SHOT 9: Alert System (45 seconds)
**Screen**: Navigate to Alerts & Events page

**Voiceover Script**:
```
"The intelligent alert system monitors all aspects of operation. Alerts are 
categorized by severity - critical, warning, or informational - and by type 
such as sensor faults, water quality issues, or filter maintenance needs. 
Each alert includes a clear description and recommended action. Since we're 
running a normal scenario, there shouldn't be many alerts."
```

**Actions**:
1. Click "Alerts & Events" in sidebar
2. Show the alert count badges at top
3. Show the filter options (severity, category)
4. Show a few sample alerts if any exist
5. Show the timeline view

---

### SHOT 10: Fault Injection Demo (1 minute 10 seconds)
**Screen**: Navigate back to Sensor Simulator

**Voiceover Script**:
```
"Let me demonstrate the system's response to problems. I'll inject a fault 
into the TDS sensor - simulating a sensor failure. Watch what happens to 
the system."
```

**Actions**:
1. Click "Sensor Simulator" in sidebar
2. Scroll down to "Fault Injection" section
3. Select "TDS" from sensor dropdown
4. Select "Stuck" fault type
5. Click "Inject Fault"
6. Quickly switch to "Live Monitoring" page
7. Show the TDS sensor status change to invalid (red)
8. Switch to "Alerts & Events"
9. Show new alert generated: "TDS sensor reading is invalid"
10. Switch to "Treatment Control"
11. Show "Dispensing" status changed to "LOCKED" (red X)

**Voiceover continues**:
```
"Notice how the system immediately detected the invalid sensor reading, 
generated an alert, and most importantly - locked dispensing as a safety 
precaution. This fail-safe behavior ensures no water is dispensed when 
critical sensors fail."
```

---

### SHOT 11: Filter Intelligence & ML (40 seconds)
**Screen**: Navigate to Filter Intelligence page

**Voiceover Script**:
```
"AQUASENSE-X includes machine learning for predictive maintenance. The 
Filter Intelligence page shows the health of all five filter types. In a 
full deployment, trained ML models would predict remaining filter life 
based on usage patterns, inlet water quality, and operating conditions. 
This helps schedule maintenance before failures occur, not after."
```

**Actions**:
1. Click "Filter Intelligence" in sidebar
2. Show the 5 filter health cards (Sediment, Carbon, UF, RO, UV)
3. Show health percentages
4. Show "Usage" and "Operating Hours" metrics
5. If ML is available, show predictions
6. If not, show the "ML unavailable" message and explain it's a known limitation

---

### SHOT 12: Historical Analytics (35 seconds)
**Screen**: Navigate to Historical Analytics page

**Voiceover Script**:
```
"All sensor data is logged for analysis. The Historical Analytics page 
provides trend visualization and data export capabilities. You can view 
sensor trends over time, analyze patterns, and export data to CSV for 
further analysis or reporting."
```

**Actions**:
1. Click "Historical Analytics" in sidebar
2. Show the summary statistics
3. Show the sensor trend charts
4. Scroll through different time ranges
5. Show the "Export to CSV" button

---

### SHOT 13: Poor Quality Scenario (50 seconds)
**Screen**: Navigate back to Sensor Simulator

**Voiceover Script**:
```
"Let me show you how the system adapts to challenging water conditions. 
I'll stop the current simulation and start the 'Poor Quality' scenario - 
simulating water with high dissolved solids and elevated turbidity."
```

**Actions**:
1. Click "Sensor Simulator"
2. Click "Stop Simulation"
3. Wait for status to show "STOPPED"
4. Click "Start Simulation"
5. Select "Poor Quality" scenario
6. Click "Start"
7. Immediately switch to "Live Monitoring"
8. Show elevated TDS (~800 ppm) and turbidity (~10 NTU)
9. Switch to "Water Quality"
10. Show "POOR" quality level (yellow/orange)
11. Show warnings on parameters
12. Switch to "Treatment Control"
13. Show treatment system working harder (same stages but different decision reason)

---

### SHOT 14: API Documentation (30 seconds)
**Screen**: Open http://localhost:8000/docs in browser

**Voiceover Script**:
```
"AQUASENSE-X is built on a robust FastAPI backend with over 40 REST 
endpoints. The interactive API documentation provides complete access to 
all system functions - from sensor readings to simulation control to 
predictive maintenance. This makes integration with existing systems or 
custom interfaces straightforward."
```

**Actions**:
1. Switch to backend URL: http://localhost:8000/docs
2. Scroll through the endpoint categories:
   - System
   - Sensors
   - Simulation
   - Water Quality
   - Treatment
   - Verification
   - Safety
   - Filters
   - Recovery
   - Alerts
   - Analytics
3. Expand one endpoint (e.g., GET /api/v1/sensors/current)
4. Show the schema documentation

---

### SHOT 15: Technology Stack (25 seconds)
**Screen**: Briefly show README.md or PROJECT_DELIVERY.md in editor

**Voiceover Script**:
```
"The platform is built with modern, production-ready technologies. The 
backend uses Python with FastAPI, SQLAlchemy for data persistence, and 
scikit-learn for machine learning. The frontend is React with TypeScript, 
Tailwind CSS for styling, and TanStack Query for data management. Real-time 
updates use WebSocket communication."
```

**Actions**:
1. Open README.md in a text editor
2. Scroll to "Technology Stack" section
3. Briefly show the tech stack lists

---

### SHOT 16: Closing & Future Integration (35 seconds)
**Screen**: Return to Overview page dashboard

**Voiceover Script**:
```
"What you've seen is a fully functional simulation platform. The system 
is designed for real-world deployment through a hardware abstraction layer. 
When connected to physical sensors - ESP32, STM32, or Raspberry Pi - the 
software seamlessly switches from simulation to actual monitoring. The 
same intelligent algorithms, safety checks, and predictive maintenance 
apply to real water purification systems.

Thank you for watching this demonstration of AQUASENSE-X - Intelligent 
Water, Predictive Care, Trusted Purification."
```

**Actions**:
1. Show the full overview dashboard
2. Show the "SIMULATED DATA" badge at top
3. Slowly pan across the interface
4. Fade out or end recording

---

## 🎥 Post-Recording Checklist

### Editing Steps
1. **Trim** - Remove any mistakes or long pauses
2. **Add Voiceover** - Record your voice following the script
3. **Add Intro Slide** (5 seconds):
   ```
   AQUASENSE-X
   AI-Powered Water Purification Platform
   AtomQUEST 2026 - Track 2
   ```

4. **Add Closing Slide** (5 seconds):
   ```
   AQUASENSE-X
   Intelligent Water. Predictive Care. Trusted Purification.
   
   GitHub: [Your Repository]
   Developed by: [Your Name/Team]
   AtomQUEST 2026
   ```

5. **Add Annotations** (Optional):
   - Arrows pointing to key features
   - Text overlays for important metrics
   - Highlight boxes around critical UI elements

6. **Add Background Music** (Optional):
   - Use royalty-free music from YouTube Audio Library
   - Keep volume low (don't overpower voiceover)
   - Suggested: "Technology" or "Corporate" category

### Video Specifications
- **Format**: MP4 (H.264)
- **Resolution**: 1920x1080 (1080p)
- **Frame Rate**: 30 fps
- **Length**: 5-7 minutes
- **File Size**: Under 500MB (for easy upload)

---

## 📌 Quick Demo Tips

### Before Recording
- ✅ Close unnecessary browser tabs and apps
- ✅ Clear browser notifications
- ✅ Set Windows to "Do Not Disturb" mode
- ✅ Hide desktop icons (right-click desktop → View → Show desktop icons)
- ✅ Use a clean browser profile or incognito mode
- ✅ Have both backend and frontend running
- ✅ Test the demo flow once before recording

### During Recording
- ✅ Move cursor slowly and deliberately
- ✅ Pause 2-3 seconds when switching pages
- ✅ Hover over important elements to highlight them
- ✅ Don't rush - smooth, professional movements
- ✅ If you make a mistake, pause, then continue (edit later)

### Alternative: Quick Demo (3 minutes)
If you need a shorter version, focus on:
1. Introduction (30s)
2. Start Normal Simulation (30s)
3. Live Monitoring (30s)
4. Treatment Control (30s)
5. Fault Injection Demo (45s)
6. Closing (15s)

---

## 🎬 Ready to Record!

**Commands to start both servers**:

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

Then open http://localhost:5173 and start recording!

---

## 📞 Need Help?

If you encounter any issues during demo:
- Backend health check: http://localhost:8000/api/v1/system/health
- Clear browser cache and refresh
- Restart simulation if it gets stuck
- Check console logs (F12) for errors

**Good luck with your recording! 🎥🌊**
