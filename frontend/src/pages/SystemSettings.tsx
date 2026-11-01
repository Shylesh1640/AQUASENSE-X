import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Database,
  Gauge,
  Filter,
  Activity,
  Info,
  Save,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

type Tab = 'sensors' | 'thresholds' | 'treatment' | 'simulation' | 'filters' | 'system';

export const SystemSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sensors');
  const queryClient = useQueryClient();

  const { data: systemHealth, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get('/system/health')
  });

  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => api.get('/system/status')
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'sensors' as Tab, label: 'Sensor Config', icon: <Gauge className="w-4 h-4" /> },
    { id: 'thresholds' as Tab, label: 'Thresholds', icon: <Activity className="w-4 h-4" /> },
    { id: 'treatment' as Tab, label: 'Treatment', icon: <Filter className="w-4 h-4" /> },
    { id: 'simulation' as Tab, label: 'Simulation', icon: <Settings className="w-4 h-4" /> },
    { id: 'filters' as Tab, label: 'Filters', icon: <Filter className="w-4 h-4" /> },
    { id: 'system' as Tab, label: 'System', icon: <Database className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101D2D]">System Settings</h1>
        <p className="text-sm text-[#718096] mt-1">Configure system parameters and preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0]">
        <div className="border-b border-[#E2E8F0] flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#1677C8] border-b-2 border-[#1677C8]'
                  : 'text-[#718096] hover:text-[#101D2D]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'sensors' && <SensorConfigTab />}
          {activeTab === 'thresholds' && <ThresholdsTab />}
          {activeTab === 'treatment' && <TreatmentTab />}
          {activeTab === 'simulation' && <SimulationTab />}
          {activeTab === 'filters' && <FiltersTab />}
          {activeTab === 'system' && <SystemTab systemHealth={systemHealth} systemStatus={systemStatus} />}
        </div>
      </div>
    </div>
  );
};

const SensorConfigTab: React.FC = () => {
  const sensorConfigs = [
    { type: 'TDS', unit: 'ppm', min: 0, max: 2000, samplingRate: '1s' },
    { type: 'pH', unit: '', min: 0, max: 14, samplingRate: '1s' },
    { type: 'Turbidity', unit: 'NTU', min: 0, max: 100, samplingRate: '1s' },
    { type: 'Temperature', unit: '°C', min: 0, max: 60, samplingRate: '1s' },
    { type: 'Flow', unit: 'L/min', min: 0, max: 10, samplingRate: '1s' },
    { type: 'Pressure', unit: 'bar', min: 0, max: 10, samplingRate: '1s' }
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left py-2 font-semibold text-[#101D2D]">Sensor</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Unit</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Min Range</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Max Range</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Sampling Rate</th>
            </tr>
          </thead>
          <tbody>
            {sensorConfigs.map(config => (
              <tr key={config.type} className="border-b border-[#E2E8F0]">
                <td className="py-3">{config.type}</td>
                <td className="py-3 text-[#718096]">{config.unit}</td>
                <td className="py-3">{config.min}</td>
                <td className="py-3">{config.max}</td>
                <td className="py-3 text-[#718096]">{config.samplingRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Sensor configurations are currently read-only. Physical sensor integration will allow calibration.
        </p>
      </div>
    </div>
  );
};

const ThresholdsTab: React.FC = () => {
  const thresholds = [
    {
      param: 'TDS',
      normal: '< 300 ppm',
      warning: '300-600 ppm',
      critical: '> 600 ppm'
    },
    {
      param: 'pH',
      normal: '6.5-8.5',
      warning: '5.5-6.5, 8.5-9.5',
      critical: '< 5.5, > 9.5'
    },
    {
      param: 'Turbidity',
      normal: '< 1 NTU',
      warning: '1-5 NTU',
      critical: '> 5 NTU'
    },
    {
      param: 'Temperature',
      normal: '10-35 °C',
      warning: '5-10, 35-45 °C',
      critical: '< 5, > 45 °C'
    },
    {
      param: 'Flow Rate',
      normal: '0.8-2.5 L/min',
      warning: '0.4-0.8, 2.5-4.0 L/min',
      critical: '< 0.4, > 4.0 L/min'
    },
    {
      param: 'Pressure',
      normal: '1.5-3.5 bar',
      warning: '1.0-1.5, 3.5-4.5 bar',
      critical: '< 1.0, > 4.5 bar'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left py-2 font-semibold text-[#101D2D]">Parameter</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Normal Range</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Warning Range</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Critical Threshold</th>
            </tr>
          </thead>
          <tbody>
            {thresholds.map(threshold => (
              <tr key={threshold.param} className="border-b border-[#E2E8F0]">
                <td className="py-3 font-medium">{threshold.param}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                    {threshold.normal}
                  </span>
                </td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                    {threshold.warning}
                  </span>
                </td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs">
                    {threshold.critical}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => toast.info('Threshold configuration coming soon')}
        className="px-4 py-2 bg-[#1677C8] text-white rounded-lg hover:bg-[#1467B8] flex items-center gap-2 text-sm"
      >
        <Save className="w-4 h-4" />
        Save Thresholds
      </button>
    </div>
  );
};

const TreatmentTab: React.FC = () => {
  const stages = [
    { name: 'Sediment Filtration', tdsReduction: 2, turbidityReduction: 50, enabled: true },
    { name: 'Activated Carbon', tdsReduction: 1, turbidityReduction: 20, enabled: true },
    { name: 'UF Membrane', tdsReduction: 8, turbidityReduction: 90, enabled: true },
    { name: 'RO Membrane', tdsReduction: 90, turbidityReduction: 95, enabled: true },
    { name: 'UV Treatment', tdsReduction: 0, turbidityReduction: 0, enabled: true },
    { name: 'Remineralization', tdsReduction: -3, turbidityReduction: 0, enabled: true }
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left py-2 font-semibold text-[#101D2D]">Treatment Stage</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">TDS Reduction (%)</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Turbidity Reduction (%)</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Status</th>
            </tr>
          </thead>
          <tbody>
            {stages.map(stage => (
              <tr key={stage.name} className="border-b border-[#E2E8F0]">
                <td className="py-3">{stage.name}</td>
                <td className="py-3 text-[#718096]">{stage.tdsReduction}%</td>
                <td className="py-3 text-[#718096]">{stage.turbidityReduction}%</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    stage.enabled ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                  }`}>
                    {stage.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Treatment coefficients are configured for simulation. Actual performance depends on membrane specifications and operating conditions.
        </p>
      </div>
    </div>
  );
};

const SimulationTab: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-[#101D2D] mb-2 block">Default Speed</label>
          <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm">
            <option value="1">1x (Real-time)</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#101D2D] mb-2 block">Sampling Frequency</label>
          <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm">
            <option value="1000">1 second</option>
            <option value="2000">2 seconds</option>
            <option value="5000">5 seconds</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#101D2D] mb-2 block">Persistence Interval</label>
          <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm">
            <option value="5">Every 5 ticks</option>
            <option value="10">Every 10 ticks</option>
            <option value="30">Every 30 ticks</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#101D2D] mb-2 block">Default Scenario</label>
          <select className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm">
            <option value="NORMAL">Normal Water</option>
            <option value="POOR_QUALITY">Poor Quality Water</option>
            <option value="ABNORMAL">Abnormal Conditions</option>
          </select>
        </div>
      </div>

      <button
        onClick={() => toast.info('Simulation settings saved (feature preview)')}
        className="px-4 py-2 bg-[#1677C8] text-white rounded-lg hover:bg-[#1467B8] flex items-center gap-2 text-sm"
      >
        <Save className="w-4 h-4" />
        Save Settings
      </button>
    </div>
  );
};

const FiltersTab: React.FC = () => {
  const filters = [
    { name: 'Sediment Filter', expectedLife: '6000 L or 6 months', alertThreshold: '30%' },
    { name: 'Carbon Filter', expectedLife: '6000 L or 6 months', alertThreshold: '30%' },
    { name: 'UF Membrane', expectedLife: '8000 L or 12 months', alertThreshold: '30%' },
    { name: 'RO Membrane', expectedLife: '6000 L or 24 months', alertThreshold: '30%' },
    { name: 'UV Lamp', expectedLife: '8000 hours', alertThreshold: '20%' }
  ];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="text-left py-2 font-semibold text-[#101D2D]">Filter Component</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Expected Life</th>
              <th className="text-left py-2 font-semibold text-[#101D2D]">Alert Threshold</th>
            </tr>
          </thead>
          <tbody>
            {filters.map(filter => (
              <tr key={filter.name} className="border-b border-[#E2E8F0]">
                <td className="py-3">{filter.name}</td>
                <td className="py-3 text-[#718096]">{filter.expectedLife}</td>
                <td className="py-3 text-[#718096]">{filter.alertThreshold}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Filter life estimates are based on manufacturer specifications and will be refined through actual usage data.
        </p>
      </div>
    </div>
  );
};

const SystemTab: React.FC<{ systemHealth: any; systemStatus: any }> = ({ systemHealth, systemStatus }) => {
  return (
    <div className="space-y-6">
      {/* System Info */}
      <div>
        <h3 className="font-semibold text-[#101D2D] mb-3">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#718096]">Version:</span>
            <span className="ml-2 font-medium">{systemHealth?.version || '1.0.0'}</span>
          </div>
          <div>
            <span className="text-[#718096]">Status:</span>
            <span className="ml-2 font-medium text-green-600">{systemHealth?.status || 'healthy'}</span>
          </div>
          <div>
            <span className="text-[#718096]">Uptime:</span>
            <span className="ml-2 font-medium">{systemHealth?.uptime || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[#718096]">API Version:</span>
            <span className="ml-2 font-medium">v1</span>
          </div>
        </div>
      </div>

      {/* Database Status */}
      <div>
        <h3 className="font-semibold text-[#101D2D] mb-3">Database Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#718096]">Database Type:</span>
            <span className="ml-2 font-medium">SQLite</span>
          </div>
          <div>
            <span className="text-[#718096]">Connection:</span>
            <span className="ml-2 font-medium text-green-600">Connected</span>
          </div>
          <div>
            <span className="text-[#718096]">Tables:</span>
            <span className="ml-2 font-medium">{systemStatus?.db_tables || 15}</span>
          </div>
          <div>
            <span className="text-[#718096]">Size (estimated):</span>
            <span className="ml-2 font-medium">{systemStatus?.db_size || '< 10 MB'}</span>
          </div>
        </div>
      </div>

      {/* Operating Mode */}
      <div>
        <h3 className="font-semibold text-[#101D2D] mb-3">Operating Mode</h3>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Simulation Mode</span>
          </div>
          <p className="text-sm text-blue-800">
            The system is currently running in simulation mode. All sensor readings are simulated. To switch to hardware mode, physical sensors and controllers must be connected and configured.
          </p>
        </div>
      </div>

      {/* Theme */}
      <div>
        <h3 className="font-semibold text-[#101D2D] mb-3">Appearance</h3>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-[#1677C8] text-white rounded-lg text-sm">
            Light Theme (Current)
          </button>
          <button
            onClick={() => toast.info('Dark theme coming soon')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
          >
            Dark Theme
          </button>
        </div>
      </div>

      {/* Actions */}
      <div>
        <h3 className="font-semibold text-[#101D2D] mb-3">System Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (confirm('Reset all settings to factory defaults?')) {
                toast.info('Settings reset feature preview');
              }
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};
