import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Droplets,
  Filter,
  Activity,
  Zap,
  Shield,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Minus
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';

interface TreatmentStage {
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'WARNING' | 'FAILED' | 'BYPASSED';
  inputTDS: number;
  outputTDS: number;
  flowRate: number;
  health: number;
  icon: React.ReactNode;
  details?: {
    inputParams: Record<string, any>;
    outputParams: Record<string, any>;
    coefficients: Record<string, number>;
    faultState: string | null;
  };
}

const stageIcons: Record<string, React.ReactNode> = {
  SEDIMENT: <Filter className="w-6 h-6" />,
  CARBON: <Droplets className="w-6 h-6" />,
  UF: <Activity className="w-6 h-6" />,
  RO: <Shield className="w-6 h-6" />,
  UV: <Zap className="w-6 h-6" />,
  SELECTIVE_MEDIA: <Sparkles className="w-6 h-6" />,
  REMINERALIZATION: <Droplets className="w-6 h-6" />
};

const statusColors = {
  ACTIVE: 'bg-green-100 border-green-500 text-green-700',
  INACTIVE: 'bg-gray-100 border-gray-300 text-gray-600',
  WARNING: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  FAILED: 'bg-red-100 border-red-500 text-red-700',
  BYPASSED: 'bg-blue-100 border-blue-500 text-blue-600'
};

const statusIcons = {
  ACTIVE: <CheckCircle className="w-4 h-4" />,
  INACTIVE: <Minus className="w-4 h-4" />,
  WARNING: <AlertCircle className="w-4 h-4" />,
  FAILED: <XCircle className="w-4 h-4" />,
  BYPASSED: <ArrowRight className="w-4 h-4" />
};

export const TreatmentControl: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const { data: treatmentData, isLoading, error } = useQuery({
    queryKey: ['treatment-status'],
    queryFn: () => api.get('/treatment/status'),
    refetchInterval: 2000
  });

  const { data: waterQuality } = useQuery({
    queryKey: ['water-quality'],
    queryFn: () => api.get('/water-quality/current'),
    refetchInterval: 2000
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-red-500" />}
        title="Failed to load treatment data"
        description="Unable to fetch treatment status"
      />
    );
  }

  const stages: TreatmentStage[] = treatmentData?.stages || [];
  const decisionReason = treatmentData?.decision_reason || 'No active treatment path';
  const activePath = treatmentData?.active_path || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101D2D]">Treatment Control</h1>
          <p className="text-sm text-[#718096] mt-1">Intelligent water treatment simulation</p>
        </div>
      </div>

      {/* Treatment Decision Reason */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-[#1677C8]" />
          <h3 className="font-semibold text-[#101D2D]">Treatment Decision</h3>
        </div>
        <p className="text-sm text-[#718096]">{decisionReason}</p>
        {waterQuality && (
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
              Inlet TDS: {waterQuality.inlet_tds?.toFixed(0)} ppm
            </span>
            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
              Inlet pH: {waterQuality.inlet_ph?.toFixed(1)}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
              Turbidity: {waterQuality.inlet_turbidity?.toFixed(1)} NTU
            </span>
          </div>
        )}
      </div>

      {/* Treatment Pipeline Visualization */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#101D2D] mb-4">Treatment Pipeline</h3>

        <div className="flex items-center gap-2 overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.name}>
              {/* Stage Card */}
              <button
                onClick={() => setSelectedStage(stage.name)}
                className={`flex-shrink-0 w-48 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                  statusColors[stage.status]
                } ${selectedStage === stage.name ? 'ring-2 ring-[#1677C8] ring-offset-2' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {stageIcons[stage.name]}
                    {statusIcons[stage.status]}
                  </div>
                  <span className="text-xs font-medium">{stage.status}</span>
                </div>

                <h4 className="font-semibold text-sm mb-3">{stage.name.replace(/_/g, ' ')}</h4>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">In:</span>
                    <span className="font-medium">{stage.inputTDS.toFixed(0)} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Out:</span>
                    <span className="font-medium">{stage.outputTDS.toFixed(0)} ppm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Flow:</span>
                    <span className="font-medium">{stage.flowRate.toFixed(2)} L/min</span>
                  </div>
                </div>

                {/* Health Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">Health</span>
                    <span className="font-medium">{stage.health}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        stage.health > 70 ? 'bg-[#16A36A]' :
                        stage.health > 40 ? 'bg-[#E5A000]' :
                        'bg-[#D94848]'
                      }`}
                      style={{ width: `${stage.health}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* Arrow */}
              {index < stages.length - 1 && (
                <div className="flex-shrink-0 flex items-center">
                  <ArrowRight className="w-6 h-6 text-[#718096] animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Active Treatment Path */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-4">
        <h3 className="font-semibold text-[#101D2D] mb-3">Active Treatment Path</h3>
        <div className="flex gap-2 flex-wrap">
          {activePath.length > 0 ? (
            activePath.map((stageName: string) => (
              <span key={stageName} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                {stageName.replace(/_/g, ' ')}
              </span>
            ))
          ) : (
            <span className="text-sm text-[#718096]">No active treatment stages</span>
          )}
        </div>
      </div>

      {/* Stage Detail Panel */}
      {selectedStage && (
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[#101D2D]">
              {selectedStage.replace(/_/g, ' ')} Details
            </h3>
            <button
              onClick={() => setSelectedStage(null)}
              className="text-sm text-[#1677C8] hover:underline"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Parameters */}
            <div>
              <h4 className="text-sm font-semibold text-[#101D2D] mb-2">Input Parameters</h4>
              <div className="space-y-2 text-sm">
                {stages.find(s => s.name === selectedStage)?.details?.inputParams ? (
                  Object.entries(stages.find(s => s.name === selectedStage)!.details!.inputParams).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#718096]">{key}:</span>
                      <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#718096]">No input parameters available</p>
                )}
              </div>
            </div>

            {/* Output Parameters */}
            <div>
              <h4 className="text-sm font-semibold text-[#101D2D] mb-2">Output Parameters</h4>
              <div className="space-y-2 text-sm">
                {stages.find(s => s.name === selectedStage)?.details?.outputParams ? (
                  Object.entries(stages.find(s => s.name === selectedStage)!.details!.outputParams).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#718096]">{key}:</span>
                      <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#718096]">No output parameters available</p>
                )}
              </div>
            </div>

            {/* Operating Coefficients */}
            <div>
              <h4 className="text-sm font-semibold text-[#101D2D] mb-2">Operating Coefficients</h4>
              <div className="space-y-2 text-sm">
                {stages.find(s => s.name === selectedStage)?.details?.coefficients ? (
                  Object.entries(stages.find(s => s.name === selectedStage)!.details!.coefficients).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#718096]">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-[#718096]">No coefficients configured</p>
                )}
              </div>
            </div>

            {/* Fault State */}
            <div>
              <h4 className="text-sm font-semibold text-[#101D2D] mb-2">Fault State</h4>
              <div className="text-sm">
                {stages.find(s => s.name === selectedStage)?.details?.faultState ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>{stages.find(s => s.name === selectedStage)!.details!.faultState}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>No faults detected</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Control Panel (disabled for safety) */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-[#718096] mb-3">
              Stage controls are disabled for safety. Treatment decisions are made automatically based on water quality.
            </p>
            <div className="flex gap-2">
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed"
              >
                Bypass Stage
              </button>
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm cursor-not-allowed"
              >
                Force Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configured Limits */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#101D2D] mb-4">Configured Treatment Limits</h3>
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
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 text-[#718096]">Outlet TDS</td>
                <td className="py-2">&lt; 50 ppm</td>
                <td className="py-2">50-100 ppm</td>
                <td className="py-2">&gt; 100 ppm</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 text-[#718096]">Outlet pH</td>
                <td className="py-2">6.5-8.5</td>
                <td className="py-2">6.0-6.5, 8.5-9.0</td>
                <td className="py-2">&lt; 6.0, &gt; 9.0</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 text-[#718096]">Outlet Turbidity</td>
                <td className="py-2">&lt; 0.5 NTU</td>
                <td className="py-2">0.5-1.0 NTU</td>
                <td className="py-2">&gt; 1.0 NTU</td>
              </tr>
              <tr className="border-b border-[#E2E8F0]">
                <td className="py-2 text-[#718096]">Pressure</td>
                <td className="py-2">1.5-3.5 bar</td>
                <td className="py-2">1.0-1.5, 3.5-4.5 bar</td>
                <td className="py-2">&lt; 1.0, &gt; 4.5 bar</td>
              </tr>
              <tr>
                <td className="py-2 text-[#718096]">Flow Rate</td>
                <td className="py-2">0.8-2.5 L/min</td>
                <td className="py-2">0.4-0.8, 2.5-4.0 L/min</td>
                <td className="py-2">&lt; 0.4, &gt; 4.0 L/min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
