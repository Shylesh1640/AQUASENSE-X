import {
  Waves,
  Droplets,
  Shield,
  Brain,
  Recycle,
  Activity,
  Cpu,
  ExternalLink,
  Github,
  ChevronRight,
} from 'lucide-react';

const features = [
  {
    icon: Droplets,
    title: 'Multi-Parameter Sensing',
    description:
      'Six independent sensors (TDS, pH, turbidity, temperature, flow, pressure) provide comprehensive water characterization beyond traditional TDS-only approaches.',
  },
  {
    icon: Brain,
    title: 'Intelligent Treatment Decisions',
    description:
      'A rule-based decision engine evaluates inlet water conditions and selects the appropriate treatment path, considering sensor validity and stage availability.',
  },
  {
    icon: Shield,
    title: 'Output Verification & Safety',
    description:
      'Independent post-treatment quality verification with fail-safe dispensing lock. The system prevents dispensing when critical conditions are invalid.',
  },
  {
    icon: Activity,
    title: 'Predictive Filter Maintenance',
    description:
      'Machine learning models trained on operational data estimate filter degradation and predict replacement windows, moving beyond calendar-based maintenance.',
  },
  {
    icon: Recycle,
    title: 'RO Reject Recovery',
    description:
      'Mass-balance tracking of RO reject water with controlled routing to non-potable reuse storage, targeting ≥50% reject stream recovery.',
  },
  {
    icon: Cpu,
    title: 'Hardware-Ready Architecture',
    description:
      'Clean hardware abstraction layer designed for future integration with ESP32/STM32 controllers, real sensors, solenoid valves, and RO pumps.',
  },
];

const techStack = [
  { category: 'Frontend', items: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Recharts', 'TanStack Query'] },
  { category: 'Backend', items: ['Python 3.12+', 'FastAPI', 'SQLAlchemy', 'Pydantic', 'SQLite'] },
  { category: 'ML / Analytics', items: ['scikit-learn', 'NumPy', 'Pandas', 'Joblib'] },
  { category: 'Communication', items: ['REST API', 'WebSocket', 'JSON'] },
];

const designTargets = [
  { metric: 'Water-quality decision', baseline: 'Primarily TDS-based', target: '≥5 measurable parameters in control logic' },
  { metric: 'Output verification', baseline: 'Treatment-stage monitoring', target: 'Independent post-treatment quality check' },
  { metric: 'Filter maintenance', baseline: 'Time / usage based', target: 'Predictive estimate (±10% target after calibration)' },
  { metric: 'RO reject handling', baseline: 'Conventional discharge', target: '≥50% of reject routed to non-potable reuse' },
  { metric: 'Safety response', baseline: 'Fault alert / service action', target: 'Fail-safe dispense lock on invalid conditions' },
];

export default function About() {
  return (
    <div className="space-y-8 max-w-5xl">
      <div className="bg-gradient-to-br from-[#101D2D] to-[#1a3050] rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1677C8] to-[#27B8D5] flex items-center justify-center">
            <Waves className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AQUASENSE-X</h1>
            <p className="text-white/60 text-sm">Intelligent Water. Predictive Care. Trusted Purification.</p>
          </div>
        </div>
        <p className="text-white/80 text-sm leading-relaxed max-w-3xl">
          AQUASENSE-X is an intelligent closed-loop water purification monitoring and control platform
          developed for AtomQUEST 2026 (Track 2 — Water Purifier). The system extends conventional
          purification architecture by integrating multi-parameter water-quality sensing, intelligent
          treatment decisions, post-treatment verification, predictive filter maintenance, and RO
          reject-water recovery.
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-[#27B8D5]">
          <span className="font-medium">Core Principle:</span>
          <span className="text-white/70">SENSE → DECIDE → PURIFY → VERIFY → LEARN</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#172B43] mb-1">Competition</h2>
        <p className="text-sm text-[#718096] mb-4">
          AtomQUEST 2026 · Track 2 — Water Purifier
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Important:</strong> This is a software simulation platform. Sensor readings are
            simulated and do not represent actual water measurements. Never use simulated data to make
            real drinking-water safety decisions. TDS, pH, and turbidity sensors alone cannot identify
            specific contaminants such as lead, arsenic, or PFAS — laboratory verification is required
            for contaminant-specific claims.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#172B43] mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white rounded-lg border border-[#E2E8F0] p-5">
              <feature.icon className="w-6 h-6 text-[#1677C8] mb-3" />
              <h3 className="text-sm font-semibold text-[#172B43] mb-1.5">{feature.title}</h3>
              <p className="text-xs text-[#718096] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#172B43] mb-4">
          Design Targets
          <span className="text-xs font-normal text-[#718096] ml-2">
            (prototype targets — to be validated experimentally)
          </span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="text-left py-2.5 text-[#718096] font-medium">Metric</th>
                <th className="text-left py-2.5 text-[#718096] font-medium">Current Baseline</th>
                <th className="text-left py-2.5 text-[#718096] font-medium">AQUASENSE-X Target</th>
              </tr>
            </thead>
            <tbody>
              {designTargets.map((row) => (
                <tr key={row.metric} className="border-b border-[#E2E8F0] last:border-0">
                  <td className="py-2.5 font-medium text-[#172B43]">{row.metric}</td>
                  <td className="py-2.5 text-[#718096]">{row.baseline}</td>
                  <td className="py-2.5 text-[#1677C8]">{row.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[#172B43] mb-4">Technology Stack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {techStack.map((group) => (
            <div key={group.category} className="bg-white rounded-lg border border-[#E2E8F0] p-4">
              <h3 className="text-sm font-semibold text-[#172B43] mb-2">{group.category}</h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#718096]">
                    <ChevronRight className="w-3 h-3 text-[#27B8D5]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#172B43] mb-3">Future Hardware Integration</h2>
        <p className="text-sm text-[#718096] mb-4">
          The software platform is designed with a hardware abstraction layer that allows seamless
          transition from simulated sensors to physical hardware:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'ESP32 / STM32 MCU',
            'TDS/EC Sensor',
            'pH Sensor',
            'Turbidity Sensor',
            'Temperature Sensor',
            'Flow Meter',
            'Pressure Sensor',
            'Solenoid Valves',
            'RO Pump',
            'UV Module',
            'Raspberry Pi Gateway',
            'MQTT / Serial',
          ].map((item) => (
            <div key={item} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#718096] text-center">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center text-xs text-[#A0AEC0] pb-4">
        <p>AQUASENSE-X v1.0.0 · Built for AtomQUEST 2026</p>
        <p className="mt-1">
          Intelligent Water Purification Monitoring & Predictive Maintenance Platform
        </p>
      </div>
    </div>
  );
}
