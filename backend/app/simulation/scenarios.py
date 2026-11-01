"""Predefined and custom simulation scenarios for AQUASENSE-X."""

from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Any, Optional


class ScenarioType(str, enum.Enum):
    NORMAL = "normal"
    POOR_QUALITY = "poor_quality"
    ABNORMAL = "abnormal"
    CUSTOM = "custom"


@dataclass
class ScheduledEvent:
    """An event that fires at a specific simulation time."""
    trigger_seconds: float
    description: str
    param_overrides: dict[str, Any] = field(default_factory=dict)
    fault_injection: Optional[dict[str, Any]] = None


@dataclass
class ScenarioConfig:
    name: str
    description: str
    scenario_type: ScenarioType
    duration_seconds: int = 600
    sensor_params: dict[str, Any] = field(default_factory=dict)
    events: list[ScheduledEvent] = field(default_factory=list)
    filter_degradation_rate: float = 1.0
    fault_schedule: list[ScheduledEvent] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Predefined scenarios
# ---------------------------------------------------------------------------

def normal_scenario() -> ScenarioConfig:
    """Clean municipal water — stable readings, gradual filter aging."""
    return ScenarioConfig(
        name="Normal Municipal Water",
        description=(
            "Simulates clean municipal supply water. TDS ~250-350 ppm, "
            "neutral pH, low turbidity. Filters degrade gradually."
        ),
        scenario_type=ScenarioType.NORMAL,
        duration_seconds=600,
        sensor_params={
            "tds_base": 300.0,
            "tds_variation": 10.0,
            "tds_period_s": 7200.0,
            "ph_base": 7.2,
            "ph_oscillation": 0.08,
            "ph_period_s": 5400.0,
            "turbidity_base": 1.2,
            "temperature_base": 25.0,
            "temperature_amplitude": 1.5,
            "temperature_period_s": 14400.0,
            "flow_base": 1.5,
            "pressure_base": 2.5,
        },
        filter_degradation_rate=1.0,
        events=[],
        fault_schedule=[],
    )


def poor_quality_scenario() -> ScenarioConfig:
    """High TDS, elevated turbidity, slightly acidic — challenging inlet."""
    return ScenarioConfig(
        name="Poor-Quality Inlet Water",
        description=(
            "Simulates borewell or untreated water with high dissolved solids "
            "(600-900 ppm), elevated turbidity (8-15 NTU), and slightly acidic pH "
            "(5.5-6.5). Tests the full treatment path."
        ),
        scenario_type=ScenarioType.POOR_QUALITY,
        duration_seconds=600,
        sensor_params={
            "tds_base": 750.0,
            "tds_variation": 50.0,
            "tds_period_s": 3600.0,
            "ph_base": 6.0,
            "ph_oscillation": 0.15,
            "ph_period_s": 4800.0,
            "turbidity_base": 12.0,
            "temperature_base": 28.0,
            "temperature_amplitude": 2.0,
            "temperature_period_s": 14400.0,
            "flow_base": 1.2,
            "pressure_base": 3.0,
        },
        filter_degradation_rate=2.5,
        events=[],
        fault_schedule=[],
    )


def abnormal_scenario() -> ScenarioConfig:
    """Starts normal, then pressure drop at ~30 s, sensor failure at ~60 s."""
    return ScenarioConfig(
        name="Abnormal / Fault Conditions",
        description=(
            "Begins with normal readings. At ~30 s a pressure drop occurs "
            "(simulating a pump issue or leak). At ~60 s the turbidity sensor "
            "fails (stuck reading), and inlet turbidity actually spikes. "
            "Tests fault detection, safety lock, and alert generation."
        ),
        scenario_type=ScenarioType.ABNORMAL,
        duration_seconds=600,
        sensor_params={
            "tds_base": 320.0,
            "tds_variation": 8.0,
            "tds_period_s": 7200.0,
            "ph_base": 7.0,
            "ph_oscillation": 0.06,
            "ph_period_s": 5400.0,
            "turbidity_base": 1.5,
            "temperature_base": 25.0,
            "temperature_amplitude": 1.0,
            "temperature_period_s": 14400.0,
            "flow_base": 1.5,
            "pressure_base": 2.5,
        },
        filter_degradation_rate=1.5,
        events=[
            ScheduledEvent(
                trigger_seconds=30.0,
                description="Pressure drop — simulates pump issue or leak",
                param_overrides={
                    "pressure_target": 0.8,
                    "pressure_ramp_start_s": 30.0,
                    "pressure_ramp_duration_s": 10.0,
                    "flow_target": 0.4,
                    "flow_ramp_start_s": 30.0,
                    "flow_ramp_duration_s": 15.0,
                },
            ),
            ScheduledEvent(
                trigger_seconds=60.0,
                description="Turbidity spike with sensor stuck fault",
                param_overrides={
                    "turbidity_target": 25.0,
                    "turbidity_ramp_start_s": 60.0,
                    "turbidity_ramp_duration_s": 10.0,
                },
                fault_injection={
                    "sensor_type": "turbidity",
                    "fault_type": "stuck",
                },
            ),
        ],
        fault_schedule=[],
    )


def custom_scenario(params: dict) -> ScenarioConfig:
    """Build a ScenarioConfig from user-supplied parameters."""
    return ScenarioConfig(
        name=params.get("name", "Custom Scenario"),
        description=params.get("description", "User-defined simulation scenario."),
        scenario_type=ScenarioType.CUSTOM,
        duration_seconds=params.get("duration_seconds", 600),
        sensor_params=params.get("sensor_params", {}),
        events=[
            ScheduledEvent(**evt) for evt in params.get("events", [])
        ],
        filter_degradation_rate=params.get("filter_degradation_rate", 1.0),
        fault_schedule=[
            ScheduledEvent(**evt) for evt in params.get("fault_schedule", [])
        ],
    )


SCENARIO_BUILDERS: dict[ScenarioType, callable] = {
    ScenarioType.NORMAL: normal_scenario,
    ScenarioType.POOR_QUALITY: poor_quality_scenario,
    ScenarioType.ABNORMAL: abnormal_scenario,
}


def get_scenario(scenario_type: ScenarioType, custom_params: Optional[dict] = None) -> ScenarioConfig:
    if scenario_type == ScenarioType.CUSTOM:
        return custom_scenario(custom_params or {})
    builder = SCENARIO_BUILDERS.get(scenario_type)
    if builder is None:
        raise ValueError(f"Unknown scenario type: {scenario_type}")
    return builder()
