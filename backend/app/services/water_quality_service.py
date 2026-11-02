"""Water quality assessment service."""
from typing import List, Dict
from datetime import datetime
from ..domain.schemas import WaterQualityAssessment, ParameterAssessment, SensorReading
from ..domain.enums import QualityLevel, SensorType
from ..core.config import get_settings

class WaterQualityService:
    """Service for water quality analysis."""

    def __init__(self):
        self.settings = get_settings()
        self.thresholds = self._load_thresholds()

    def _load_thresholds(self) -> dict:
        """Load configurable thresholds."""
        return {
            SensorType.TDS: {
                'normal': (0, 300),
                'warning': (300, 600),
                'critical': 600,
                'unit': 'ppm',
            },
            SensorType.PH: {
                'normal': (6.5, 8.5),
                'warning_low': (5.5, 6.5),
                'warning_high': (8.5, 9.5),
                'critical_low': 5.5,
                'critical_high': 9.5,
                'unit': '',
            },
            SensorType.TURBIDITY: {
                'normal': (0, 1),
                'warning': (1, 5),
                'critical': 5,
                'unit': 'NTU',
            },
            SensorType.TEMPERATURE: {
                'normal': (10, 35),
                'warning_low': (5, 10),
                'warning_high': (35, 45),
                'critical_low': 5,
                'critical_high': 45,
                'unit': '°C',
            },
            SensorType.FLOW: {
                'normal': (0.5, 3.0),
                'warning_low': (0.2, 0.5),
                'warning_high': (3.0, 5.0),
                'critical_low': 0.2,
                'critical_high': 5.0,
                'unit': 'L/min',
            },
            SensorType.PRESSURE: {
                'normal': (1.0, 4.0),
                'warning_low': (0.5, 1.0),
                'warning_high': (4.0, 6.0),
                'critical_low': 0.5,
                'critical_high': 6.0,
                'unit': 'bar',
            },
        }

    def assess_quality(self, readings: List[SensorReading]) -> WaterQualityAssessment:
        """Assess overall water quality from sensor readings."""
        parameter_assessments = []
        overall_level = QualityLevel.NORMAL

        readings_dict = {r.sensor_type: r for r in readings}

        for sensor_type in SensorType:
            reading = readings_dict.get(sensor_type)
            if not reading:
                continue

            assessment = self._assess_parameter(sensor_type, reading.value, reading.unit)
            parameter_assessments.append(assessment)

            # Escalate overall level if needed
            if assessment.level == QualityLevel.CRITICAL:
                overall_level = QualityLevel.CRITICAL
            elif assessment.level == QualityLevel.WARNING and overall_level != QualityLevel.CRITICAL:
                overall_level = QualityLevel.WARNING

        # Generate overall message
        overall_message = self._generate_overall_message(parameter_assessments, overall_level)

        return WaterQualityAssessment(
            timestamp=datetime.utcnow(),
            overall_level=overall_level,
            parameters=parameter_assessments,
            summary=overall_message
        )

    def _assess_parameter(self, sensor_type: SensorType, value: float, unit: str) -> ParameterAssessment:
        """Assess a single parameter."""
        thresholds = self.thresholds.get(sensor_type, {})
        level = QualityLevel.NORMAL
        message = ""
        explanation = ""

        if sensor_type == SensorType.TDS:
            normal = thresholds['normal']
            warning = thresholds['warning']
            critical = thresholds['critical']

            if value < normal[1]:
                level = QualityLevel.NORMAL
                message = f"TDS is {value:.0f} ppm - within normal range"
                explanation = "Low TDS indicates good purity. Water is suitable for treatment."
            elif value < critical:
                level = QualityLevel.WARNING
                message = f"TDS is {value:.0f} ppm - elevated but acceptable"
                explanation = "Moderate TDS. RO treatment will be effective."
            else:
                level = QualityLevel.CRITICAL
                message = f"TDS is {value:.0f} ppm - very high"
                explanation = "High TDS requires intensive treatment. Monitor RO performance."

        elif sensor_type == SensorType.PH:
            normal = thresholds['normal']
            crit_low = thresholds['critical_low']
            crit_high = thresholds['critical_high']

            if normal[0] <= value <= normal[1]:
                level = QualityLevel.NORMAL
                message = f"pH is {value:.1f} - neutral and safe"
                explanation = "pH is in the ideal range for drinking water (6.5-8.5)."
            elif crit_low < value < normal[0] or normal[1] < value < crit_high:
                level = QualityLevel.WARNING
                message = f"pH is {value:.1f} - slightly out of range"
                explanation = "pH is acceptable but not ideal. May affect taste."
            else:
                level = QualityLevel.CRITICAL
                message = f"pH is {value:.1f} - critical"
                explanation = "pH is outside safe range. Water is too acidic or alkaline."

        elif sensor_type == SensorType.TURBIDITY:
            normal = thresholds['normal']
            warning = thresholds['warning']
            critical = thresholds['critical']

            if value < normal[1]:
                level = QualityLevel.NORMAL
                message = f"Turbidity is {value:.1f} NTU - clear water"
                explanation = "Water is clear with minimal suspended particles."
            elif value < critical:
                level = QualityLevel.WARNING
                message = f"Turbidity is {value:.1f} NTU - slightly cloudy"
                explanation = "Water has some cloudiness. Pre-filtration is working."
            else:
                level = QualityLevel.CRITICAL
                message = f"Turbidity is {value:.1f} NTU - very cloudy"
                explanation = "High turbidity indicates heavy particulates. Check sediment filters."

        elif sensor_type == SensorType.TEMPERATURE:
            normal = thresholds['normal']
            crit_low = thresholds['critical_low']
            crit_high = thresholds['critical_high']

            if normal[0] <= value <= normal[1]:
                level = QualityLevel.NORMAL
                message = f"Temperature is {value:.1f}°C - normal"
                explanation = "Temperature is within optimal range for treatment."
            elif crit_low < value < normal[0] or normal[1] < value < crit_high:
                level = QualityLevel.WARNING
                message = f"Temperature is {value:.1f}°C - outside ideal range"
                explanation = "Temperature may affect treatment efficiency."
            else:
                level = QualityLevel.CRITICAL
                message = f"Temperature is {value:.1f}°C - extreme"
                explanation = "Temperature is outside safe operating range."

        elif sensor_type == SensorType.FLOW:
            normal = thresholds['normal']
            crit_low = thresholds['critical_low']

            if normal[0] <= value <= normal[1]:
                level = QualityLevel.NORMAL
                message = f"Flow rate is {value:.2f} L/min - normal"
                explanation = "Flow rate is stable and within specification."
            elif crit_low < value < normal[0]:
                level = QualityLevel.WARNING
                message = f"Flow rate is {value:.2f} L/min - low"
                explanation = "Reduced flow may indicate filter clogging or low inlet pressure."
            else:
                level = QualityLevel.CRITICAL
                message = f"Flow rate is {value:.2f} L/min - critical"
                explanation = "Flow rate is abnormal. Check for blockages or pump issues."

        elif sensor_type == SensorType.PRESSURE:
            normal = thresholds['normal']
            crit_low = thresholds['critical_low']
            crit_high = thresholds['critical_high']

            if normal[0] <= value <= normal[1]:
                level = QualityLevel.NORMAL
                message = f"Pressure is {value:.2f} bar - normal"
                explanation = "System pressure is stable and optimal."
            elif crit_low < value < normal[0]:
                level = QualityLevel.WARNING
                message = f"Pressure is {value:.2f} bar - low"
                explanation = "Low pressure may reduce treatment effectiveness."
            elif normal[1] < value < crit_high:
                level = QualityLevel.WARNING
                message = f"Pressure is {value:.2f} bar - high"
                explanation = "Elevated pressure may indicate filter clogging."
            else:
                level = QualityLevel.CRITICAL
                message = f"Pressure is {value:.2f} bar - critical"
                explanation = "Pressure is outside safe operating range."

        return ParameterAssessment(
            sensor_type=sensor_type,
            value=value,
            unit=unit,
            level=level,
            description=f"{message}. {explanation}",
            threshold_low=thresholds.get('normal', (None, None))[0],
            threshold_high=thresholds.get('normal', (None, None))[1]
        )

    def _generate_overall_message(self, assessments: List[ParameterAssessment], level: QualityLevel) -> str:
        """Generate overall assessment message."""
        critical_params = [a.sensor_type.value.upper() for a in assessments if a.level == QualityLevel.CRITICAL]
        warning_params = [a.sensor_type.value.upper() for a in assessments if a.level == QualityLevel.WARNING]

        if level == QualityLevel.CRITICAL:
            return f"CRITICAL: {', '.join(critical_params)} require immediate attention. Treatment may not be effective."
        elif level == QualityLevel.WARNING:
            return f"WARNING: {', '.join(warning_params)} are outside optimal range. Monitor closely."
        else:
            return "All parameters are within normal operating range. Water quality is acceptable for treatment."

    def get_parameter_explanation(self, sensor_type: SensorType, value: float, level: QualityLevel) -> str:
        """Get human-readable explanation for a parameter."""
        explanations = {
            SensorType.TDS: "TDS (Total Dissolved Solids) estimates the concentration of dissolved minerals and salts in water. Lower values generally indicate purer water.",
            SensorType.PH: "pH measures how acidic or alkaline water is. A pH of 7 is neutral. Drinking water should be between 6.5 and 8.5.",
            SensorType.TURBIDITY: "Turbidity measures water cloudiness caused by suspended particles. Clearer water has lower turbidity.",
            SensorType.TEMPERATURE: "Water temperature affects treatment efficiency and can indicate system issues.",
            SensorType.FLOW: "Flow rate indicates how much water is moving through the system per minute.",
            SensorType.PRESSURE: "Pressure indicates the hydraulic force in the system. Changes can indicate filter clogging or pump issues.",
        }
        return explanations.get(sensor_type, "")
