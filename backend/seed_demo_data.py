"""
Seed demo data for AQUASENSE-X demonstration.
Run this script to populate the database with realistic sample data.

Usage:
    python seed_demo_data.py
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import Base, SensorReadingModel, AlertModel, FilterInventoryModel
from app.domain.enums import SensorType, AlertSeverity, AlertCategory

# Database setup
DATABASE_URL = "sqlite:///./aquasense.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def clear_existing_data(session):
    """Clear existing demo data."""
    print("Clearing existing data...")
    session.query(SensorReadingModel).delete()
    session.query(AlertModel).delete()
    session.query(FilterInventoryModel).delete()
    session.commit()
    print("[OK] Data cleared")

def seed_historical_sensor_readings(session, days=7):
    """Generate historical sensor readings for the past N days."""
    print(f"Generating sensor readings for past {days} days...")

    now = datetime.utcnow()
    readings_count = 0

    # Generate readings every 5 minutes for the past week
    current_time = now - timedelta(days=days)

    while current_time < now:
        # Simulate daily patterns
        hour = current_time.hour

        # TDS: varies between 280-350 ppm (higher in morning)
        base_tds = 300 + (20 if 6 <= hour <= 10 else 0)
        tds = base_tds + random.uniform(-20, 20)

        # pH: stable around 7.0-7.5
        ph = 7.2 + random.uniform(-0.3, 0.3)

        # Turbidity: low, occasional spikes
        turbidity = 1.0 + random.uniform(-0.5, 0.5)
        if random.random() < 0.05:  # 5% chance of spike
            turbidity += random.uniform(2, 5)

        # Temperature: varies with time of day
        base_temp = 22 + (3 if 12 <= hour <= 17 else 0)
        temperature = base_temp + random.uniform(-1, 1)

        # Flow rate: varies with usage patterns
        base_flow = 2.0
        if 6 <= hour <= 9 or 18 <= hour <= 22:  # Peak usage
            base_flow = 2.2
        elif 0 <= hour <= 5:  # Night - lower usage
            base_flow = 1.5
        flow_rate = base_flow + random.uniform(-0.2, 0.2)

        # Pressure: stable with slight variations
        pressure = 40 + random.uniform(-2, 2)

        # Add readings with units
        for sensor_type, value, unit in [
            (SensorType.TDS, tds, "ppm"),
            (SensorType.PH, ph, "pH"),
            (SensorType.TURBIDITY, turbidity, "NTU"),
            (SensorType.TEMPERATURE, temperature, "C"),
            (SensorType.FLOW, flow_rate, "LPM"),
            (SensorType.PRESSURE, pressure, "PSI"),
        ]:
            reading = SensorReadingModel(
                sensor_type=sensor_type.value,
                value=value,
                unit=unit,
                timestamp=current_time,
                is_valid=True,
                is_simulated=True
            )
            session.add(reading)
            readings_count += 1

        current_time += timedelta(minutes=5)

    session.commit()
    print(f"[OK] Generated {readings_count} sensor readings")

def seed_alerts(session):
    """Generate sample alerts with various severities and categories."""
    print("Generating sample alerts...")

    now = datetime.utcnow()
    alerts_data = [
        # Recent alerts (last 24 hours)
        {
            "timestamp": now - timedelta(hours=2),
            "severity": AlertSeverity.WARNING.value,
            "category": AlertCategory.FILTER_REPLACEMENT.value,
            "source": "Filter: Carbon",
            "description": "Carbon filter health below 30% - replacement recommended soon",
            "recommended_action": "Schedule carbon filter replacement within 7 days",
            "acknowledged": False,
            "resolved": False,
        },
        {
            "timestamp": now - timedelta(hours=5),
            "severity": AlertSeverity.INFO.value,
            "category": AlertCategory.UV_FAULT.value,
            "source": "System",
            "description": "UV lamp usage exceeded 8000 hours - performance monitoring active",
            "recommended_action": "Monitor UV effectiveness, plan replacement at 9000 hours",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(hours=4, minutes=30),
            "resolved": False,
        },
        {
            "timestamp": now - timedelta(hours=12),
            "severity": AlertSeverity.WARNING.value,
            "category": AlertCategory.WATER_QUALITY.value,
            "source": "Inlet Water",
            "description": "Turbidity spike detected: 8.5 NTU (threshold: 5.0 NTU)",
            "recommended_action": "Check inlet water source, verify sediment filter",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(hours=11),
            "resolved": True,
            "resolved_at": now - timedelta(hours=10),
        },

        # Yesterday's alerts
        {
            "timestamp": now - timedelta(days=1, hours=8),
            "severity": AlertSeverity.CRITICAL.value,
            "category": AlertCategory.SENSOR_FAILURE.value,
            "source": "Sensor: TDS",
            "description": "TDS sensor reading out of valid range - calibration required",
            "recommended_action": "Calibrate TDS sensor immediately, check sensor connections",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=1, hours=7),
            "resolved": True,
            "resolved_at": now - timedelta(days=1, hours=6),
        },
        {
            "timestamp": now - timedelta(days=1, hours=15),
            "severity": AlertSeverity.INFO.value,
            "category": AlertCategory.LOW_FLOW.value,
            "source": "RO System",
            "description": "RO recovery rate dropped to 45% - membrane efficiency declining",
            "recommended_action": "Monitor RO membrane performance, consider cleaning cycle",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=1, hours=14),
            "resolved": False,
        },

        # Older alerts (2-7 days ago)
        {
            "timestamp": now - timedelta(days=2, hours=10),
            "severity": AlertSeverity.WARNING.value,
            "category": AlertCategory.FILTER_REPLACEMENT.value,
            "source": "Filter: Sediment",
            "description": "Sediment filter pressure drop indicates clogging",
            "recommended_action": "Replace sediment filter cartridge",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=2, hours=9),
            "resolved": True,
            "resolved_at": now - timedelta(days=2, hours=8),
        },
        {
            "timestamp": now - timedelta(days=3, hours=14),
            "severity": AlertSeverity.INFO.value,
            "category": AlertCategory.TREATMENT_FAILURE.value,
            "source": "Treatment System",
            "description": "UF membrane backwash cycle completed successfully",
            "recommended_action": "No action required - routine maintenance complete",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=3, hours=13),
            "resolved": True,
            "resolved_at": now - timedelta(days=3, hours=13),
        },
        {
            "timestamp": now - timedelta(days=4, hours=9),
            "severity": AlertSeverity.WARNING.value,
            "category": AlertCategory.WATER_QUALITY.value,
            "source": "Inlet Water",
            "description": "Inlet TDS elevated: 650 ppm (normal range: 200-400 ppm)",
            "recommended_action": "Verify water source, check for seasonal variations",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=4, hours=8),
            "resolved": True,
            "resolved_at": now - timedelta(days=4, hours=7),
        },
        {
            "timestamp": now - timedelta(days=5, hours=16),
            "severity": AlertSeverity.CRITICAL.value,
            "category": AlertCategory.DISPENSING_LOCK.value,
            "source": "Safety Controller",
            "description": "Output verification failed - dispensing locked automatically",
            "recommended_action": "Check treatment system, verify all sensors, reset after fixing",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=5, hours=15),
            "resolved": True,
            "resolved_at": now - timedelta(days=5, hours=14),
        },
        {
            "timestamp": now - timedelta(days=6, hours=11),
            "severity": AlertSeverity.INFO.value,
            "category": AlertCategory.SENSOR_WARNING.value,
            "source": "System",
            "description": "System startup completed - all sensors initialized",
            "recommended_action": "No action required",
            "acknowledged": True,
            "acknowledged_at": now - timedelta(days=6, hours=11),
            "resolved": True,
            "resolved_at": now - timedelta(days=6, hours=11),
        },
    ]

    for alert_data in alerts_data:
        alert = AlertModel(**alert_data)
        session.add(alert)

    session.commit()
    print(f"[OK] Generated {len(alerts_data)} alerts")

def seed_filter_health(session):
    """Generate filter health data with realistic usage."""
    print("Generating filter health data...")

    now = datetime.utcnow()

    filters_data = [
        {
            "component": "sediment",
            "health_pct": 65.0,
            "litres_processed": 4500.0,
            "operating_hours": 1200.0,
            "installed_date": now - timedelta(days=45),
            "expected_life_hours": 2000.0,
            "pressure_differential": 5.2,
            "flow_degradation": 0.15,
            "cycles": 450,
            "status": "normal",
        },
        {
            "component": "carbon",
            "health_pct": 28.0,  # Low - needs replacement soon
            "litres_processed": 18500.0,
            "operating_hours": 4800.0,
            "installed_date": now - timedelta(days=180),
            "expected_life_hours": 5000.0,
            "pressure_differential": 12.8,
            "flow_degradation": 0.35,
            "cycles": 1850,
            "status": "warning",
        },
        {
            "component": "uf_membrane",
            "health_pct": 82.0,
            "litres_processed": 8200.0,
            "operating_hours": 2100.0,
            "installed_date": now - timedelta(days=90),
            "expected_life_hours": 8000.0,
            "pressure_differential": 3.5,
            "flow_degradation": 0.08,
            "cycles": 820,
            "status": "normal",
        },
        {
            "component": "ro_membrane",
            "health_pct": 55.0,
            "litres_processed": 12000.0,
            "operating_hours": 3200.0,
            "installed_date": now - timedelta(days=150),
            "expected_life_hours": 6000.0,
            "pressure_differential": 8.4,
            "flow_degradation": 0.22,
            "cycles": 1200,
            "status": "normal",
        },
        {
            "component": "uv_lamp",
            "health_pct": 45.0,
            "litres_processed": 15000.0,
            "operating_hours": 8200.0,  # High usage
            "installed_date": now - timedelta(days=280),
            "expected_life_hours": 9000.0,
            "pressure_differential": 0.0,
            "flow_degradation": 0.18,
            "cycles": 1500,
            "status": "warning",
        },
    ]

    for filter_data in filters_data:
        filter_health = FilterInventoryModel(**filter_data)
        session.add(filter_health)

    session.commit()
    print(f"[OK] Generated {len(filters_data)} filter health records")

def main():
    """Main seeding function."""
    print("\n" + "="*60)
    print("  AQUASENSE-X Demo Data Seeder")
    print("="*60 + "\n")

    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

    # Create session
    session = SessionLocal()

    try:
        # Clear existing data
        clear_existing_data(session)

        # Seed data
        seed_historical_sensor_readings(session, days=7)
        seed_alerts(session)
        seed_filter_health(session)

        print("\n" + "="*60)
        print("  [OK] Demo data seeded successfully!")
        print("="*60)
        print("\nYou now have:")
        print("  • 7 days of historical sensor readings")
        print("  • 11 sample alerts (various types and statuses)")
        print("  • 5 filter health records with realistic usage")
        print("\nStart your servers and record your demo!")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n[ERROR] Error seeding data: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    main()
