# AQUASENSE-X

**Intelligent Water. Predictive Care. Trusted Purification.**

An AI-powered intelligent water purification monitoring and predictive maintenance platform for AtomQUEST 2026 - Track 2: Water Purifier.

---

## 🌊 Project Overview

AQUASENSE-X extends conventional water purification architecture by integrating multi-parameter water-quality sensing, intelligent treatment decisions, independent post-treatment verification, and data-driven predictive maintenance.

### Core Principle

**SENSE → DECIDE → PURIFY → VERIFY → LEARN**

### Key Features

- **Multi-Parameter Water Sensing**: TDS, pH, turbidity, temperature, flow rate, and pressure monitoring
- **Intelligent Treatment Engine**: Data-driven treatment path selection based on inlet conditions
- **Independent Output Verification**: Post-treatment quality checking before dispensing
- **Predictive Filter Maintenance**: ML-based filter life prediction with ±10% accuracy target
- **RO Reject Recovery**: ≥50% of reject water routed to controlled non-potable reuse
- **Safety-Critical Dispensing Control**: Fail-safe lock when critical conditions are violated

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+** (3.12, 3.13, or 3.14 work)
- **Node.js 18+**
- **Git** (for cloning)

### Installation & Running

**Step 1: Clone Repository**
```bash
git clone <repository-url>
cd AQUASENSE-X
```

**Step 2: Start Backend (Terminal 1)**
```bash
# Navigate to backend
cd backend

# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Run backend server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Backend will be available at:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/v1/system/health

**Step 3: Start Frontend (Terminal 2 - New Terminal)**
```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Run development server
npm run dev
```

**Frontend will be available at:**
- Dashboard: http://localhost:5173

---

## 🎮 Using the Application

### First Time Setup (One-time)

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Daily Development (After Setup)

**Start Backend:**
```bash
cd backend
venv\Scripts\activate  # Windows
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Start Frontend (separate terminal):**
```bash
cd frontend
npm run dev
```

---

## 🎮 Start Your First Simulation

### 1. Access the Dashboard
Open http://localhost:5173 in your browser

### 2. Start Simulation
- Navigate to **"Sensor Simulator"** page
- Click **"Start Simulation"**
- Choose a scenario:
  - **Normal**: Clean municipal water
  - **Poor Quality**: High TDS, elevated turbidity
  - **Abnormal**: Includes fault injection events
  - **Custom**: Configure your own parameters

### 3. Monitor Live Data
- **Live Monitoring** page: Real-time sensor readings with sparklines
- **Overview** page: Command center with KPIs and system status
- **Water Quality** page: Parameter assessments with explanations

### 4. Explore Features
- **Treatment Control**: View 7-stage treatment pipeline
- **Filter Intelligence**: Train ML model and view predictions
- **RO Recovery**: Track reject water reuse
- **Alerts & Events**: Manage system alerts
- **Historical Analytics**: View trends and export data

---

## 🔬 Simulation Engine

The simulation engine generates realistic sensor data with physics-based behavior:

### Scenarios

**Normal Water** (Clean municipal supply):
- TDS: ~300 ppm
- pH: ~7.2
- Turbidity: ~1 NTU
- Stable conditions, gradual filter aging

**Poor Quality** (Challenging inlet):
- TDS: 600-900 ppm
- pH: 5.5-6.5 (slightly acidic)
- Turbidity: 8-15 NTU
- Tests treatment effectiveness

**Abnormal** (Fault injection):
- Starts normal
- t=30s: Pressure drop event
- t=60s: Sensor failure
- Tests alert and safety systems

### Simulation Controls

- **Speed**: 1x, 2x, 5x, 10x
- **Manual Overrides**: Adjust any sensor value
- **Fault Injection**: Stuck, spike, drift, dead sensor
- **Pause/Resume**: Control simulation flow
- **Reset**: Start fresh simulation

### Sensor Physics

- **Realistic Correlations**: TDS↔temperature, pressure↔flow, filter-health↔pressure
- **Natural Variation**: Noise, drift, diurnal patterns
- **Filter Degradation**: Performance degrades with usage
- **Treatment Effects**: Each stage has realistic reduction coefficients

---

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **TanStack Query** - Data fetching
- **WebSocket** - Real-time updates

### Backend
- **Python 3.11+** with FastAPI
- **SQLAlchemy** - ORM with SQLite
- **Pydantic** - Data validation
- **NumPy & Pandas** - Data processing
- **Scikit-learn** - Machine learning
- **Uvicorn** - ASGI server

### Architecture
- **RESTful API** - 40+ endpoints
- **WebSocket** - Real-time sensor broadcasts
- **Async/Await** - High-performance async I/O
- **Modular Design** - Clean separation of concerns

---

## 📱 Application Pages

| Page | Description |
|------|-------------|
| **Overview** | Command center with KPIs, treatment pipeline, filter health |
| **Live Monitoring** | Real-time sensor readings with sparklines and trends |
| **Sensor Simulator** | Full simulation control (scenarios, speed, faults) |
| **Water Quality** | 6-parameter assessment with explanations |
| **Treatment Control** | 7-stage treatment pipeline visualization |
| **Filter Intelligence** | Filter health tracking + ML predictions |
| **RO Recovery** | Reject water recovery statistics and flow |
| **Alerts & Events** | Alert management with filtering and timeline |
| **Historical Analytics** | Data analysis, trends, and CSV export |
| **System Settings** | Configure sensors, thresholds, filters |
| **About** | Project information and disclaimers |

---

## 📊 API Endpoints

### Core Endpoints

**System**
- `GET /api/v1/system/health` - Health check
- `GET /api/v1/system/status` - System status

**Sensors**
- `GET /api/v1/sensors/current` - Current readings (all 6 sensors)
- `GET /api/v1/sensors/history` - Historical data
- `GET /api/v1/sensors/config` - Configuration

**Simulation**
- `POST /api/v1/simulation/start` - Start simulation
- `POST /api/v1/simulation/pause` - Pause
- `POST /api/v1/simulation/resume` - Resume
- `POST /api/v1/simulation/stop` - Stop
- `POST /api/v1/simulation/speed` - Set speed (1x-10x)
- `POST /api/v1/simulation/fault` - Inject fault
- `POST /api/v1/simulation/adjust` - Manual sensor override

**Treatment & Safety**
- `GET /api/v1/water-quality/current` - Quality assessment
- `GET /api/v1/treatment/status` - Treatment stages
- `GET /api/v1/verification/latest` - Output verification
- `GET /api/v1/safety/status` - Dispensing permission

**Predictive Maintenance**
- `GET /api/v1/filters` - All filter health
- `GET /api/v1/filters/prediction` - ML predictions
- `POST /api/v1/filters/train` - Train ML models

**Full API docs:** http://localhost:8000/docs (interactive Swagger UI)

---

## 🧪 Testing

### Run All Tests
```bash
cd backend
venv\Scripts\activate
pytest tests/ -v
```

### Run Specific Test Categories
```bash
# Unit tests only
pytest tests/unit/ -v

# Safety tests (critical)
pytest tests/safety/ -v

# Simulation tests
pytest tests/simulation/ -v

# Integration tests
pytest tests/integration/ -v
```

### Test Coverage
- **60+ test functions**
- Unit tests for all services
- Safety controller tests (10 critical scenarios)
- Simulation engine tests
- ML pipeline tests

---

## ⚠️ Important Disclaimers

### Safety & Limitations

1. **This is a simulation platform** - No physical sensors are connected
2. **Sensor readings are simulated** - Do not represent actual water quality
3. **Not for safety decisions** - Cannot determine if water is safe to drink
4. **TDS/pH/turbidity sensors alone cannot identify specific contaminants** like lead, arsenic, PFAS, or microplastics
5. **ML predictions use synthetic data** - Real accuracy requires calibration with actual operating data
6. **Not production-ready** - Requires extensive real-world validation and safety certification

### Responsible Use

- **Laboratory testing required** for drinking water safety
- **Specialized tests needed** for heavy metals, PFAS, pesticides
- **UV effectiveness** requires validation of lamp intensity and exposure time
- **This system is for demonstration and development only**

---

## 🔮 Future Hardware Integration

The software uses a **Hardware Abstraction Layer** for easy integration with physical sensors:

### Ready for ESP32/STM32/Raspberry Pi

```python
# Current: Simulated sensors
from app.hardware.simulated_provider import SimulatedSensorProvider

# Future: Physical sensors
from app.hardware.esp32_provider import ESP32SensorProvider
```

### Integration Steps
1. Replace `SimulatedSensorProvider` with `ESP32SensorProvider`
2. Configure I2C/SPI/UART interfaces
3. Calibrate physical sensors
4. Validate treatment coefficients
5. Train ML models on real data
6. Commission safety interlocks

---

## 🐛 Troubleshooting

### Backend won't start

**Check Python version:**
```bash
python --version  # Should be 3.11+
```

**Reinstall dependencies:**
```bash
cd backend
pip install -r requirements.txt --force-reinstall
```

### Frontend build errors

**Clear cache and reinstall:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use

**Change backend port** in `backend/app/main.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)  # Changed from 8000
```

**Change frontend port** in `frontend/vite.config.ts`:
```typescript
server: { port: 5174 }  // Changed from 5173
```

### Database locked error

**Delete old database:**
```bash
cd backend
rm aquasense.db
```
The database will be recreated on next startup.

---

## 📧 Project Information

**Project Name**: AQUASENSE-X  
**Tagline**: Intelligent Water. Predictive Care. Trusted Purification.  
**Competition**: AtomQUEST 2026 - Track 2: Water Purifier  
**Category**: AI + IoT + Smart Water Purification + Predictive Maintenance

### Team
- Developer: [Your Name]
- Institution: [Your Institution]

### Documentation
- `README.md` - This file (quick start)
- `INSTALLATION.md` - Detailed installation guide
- `PROJECT_DELIVERY.md` - Complete technical documentation
- API Docs: http://localhost:8000/docs

---

## 📄 License

[Specify License Here]

---

**Built with ❤️ for AtomQUEST 2026**

*Intelligent Water. Predictive Care. Trusted Purification.*