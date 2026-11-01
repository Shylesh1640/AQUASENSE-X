# AQUASENSE-X Installation Guide

## ⚠️ Important: Python Version Requirement

**You must use Python 3.12.x** (not 3.13 or 3.14)

Python 3.14 is too new and many required packages don't have pre-built wheels yet. Download Python 3.12 from:
https://www.python.org/downloads/

## Quick Installation (Windows)

### Step 1: Verify Python Version

```bash
python --version
# Should show: Python 3.12.x
```

If you have Python 3.14, download and install Python 3.12 from the link above.

### Step 2: Run Startup Script

```bash
start.bat
```

This will:
- Create Python 3.12 virtual environment
- Install all backend dependencies
- Install all frontend dependencies  
- Start backend API server (http://localhost:8000)
- Start frontend dev server (http://localhost:5173)

### Step 3: Access Application

- **Frontend Dashboard**: http://localhost:5173
- **API Documentation**: http://localhost:8000/docs
- **API Health Check**: http://localhost:8000/api/v1/system/health

## Manual Installation

### Backend

```bash
cd backend

# Create virtual environment with Python 3.12
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Run backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

## Troubleshooting

### Issue: "Python 3.14 detected"

**Solution**: Uninstall Python 3.14 or use Python 3.12 explicitly:

```bash
# Use Python 3.12 explicitly
py -3.12 -m venv venv
```

### Issue: scikit-learn installation fails

**Solution**: Install pre-built wheel:

```bash
pip install scikit-learn==1.5.2  # Use older version with wheels
```

### Issue: "Module not found"

**Solution**: Ensure virtual environment is activated:

```bash
# Windows
venv\Scripts\activate

# Verify
python -c "import sys; print(sys.prefix)"
# Should show path to venv directory
```

### Issue: Port already in use

**Solution**: Kill existing processes or change ports:

```bash
# Backend: Edit backend/app/main.py, change port
uvicorn.run(..., port=8001)

# Frontend: Edit frontend/vite.config.ts
server: { port: 5174 }
```

## Verification

After installation, verify everything works:

```bash
# Test backend
curl http://localhost:8000/api/v1/system/health

# Expected response:
# {"status":"healthy","timestamp":"...","version":"1.0.0","uptime_seconds":...}
```

Open http://localhost:5173 in your browser - you should see the AQUASENSE-X dashboard.

## Next Steps

1. **Start Simulation**: Go to "Sensor Simulator" page, click "Start Simulation"
2. **View Live Data**: Go to "Live Monitoring" to see real-time sensor readings
3. **Explore Features**: Navigate through all 11 pages
4. **Train ML Model**: Go to "Filter Intelligence", click "Train Prediction Model"

## System Requirements

- **OS**: Windows 10/11 (Linux/Mac compatible with minor script changes)
- **Python**: 3.12.x (required)
- **Node.js**: 18+ or 20+
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 2GB for dependencies and database

## Development Mode

Both servers run in development mode with:
- **Hot reload** (code changes auto-refresh)
- **Detailed logging**
- **CORS enabled** for local development

## Production Deployment

For production deployment:

1. Build frontend: `cd frontend && npm run build`
2. Serve static files from `frontend/dist`
3. Run backend with: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
4. Set environment variables in `.env`
5. Use PostgreSQL instead of SQLite
6. Enable HTTPS with proper certificates

---

**Note**: This is a development/demonstration platform. Do not use for production water treatment without extensive validation and safety certification.
