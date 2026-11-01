import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Filter,
  Droplets,
  Activity,
  Shield,
  Zap,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { KPICard } from '../components/common/KPICard';
import { StatusBadge } from '../components/common/StatusBadge';

const filterIcons: Record<string, React.ReactNode> = {
  SEDIMENT: <Filter className="w-6 h-6" />,
  CARBON: <Droplets className="w-6 h-6" />,
  UF_MEMBRANE: <Activity className="w-6 h-6" />,
  RO_MEMBRANE: <Shield className="w-6 h-6" />,
  UV_LAMP: <Zap className="w-6 h-6" />
};

const getHealthColor = (health: number) => {
  if (health > 70) return 'text-[#16A36A]';
  if (health > 40) return 'text-[#E5A000]';
  return 'text-[#D94848]';
};

const getHealthBg = (health: number) => {
  if (health > 70) return 'bg-[#16A36A]';
  if (health > 40) return 'bg-[#E5A000]';
  return 'bg-[#D94848]';
};

const getHealthStatus = (health: number) => {
  if (health > 70) return 'Healthy';
  if (health > 40) return 'Degraded';
  if (health > 20) return 'Replace Soon';
  return 'Critical';
};

export const FilterIntelligence: React.FC = () => {
  const [showPredictions, setShowPredictions] = useState(false);

  const { data: filters, isLoading, refetch } = useQuery({
    queryKey: ['filters'],
    queryFn: () => api.get('/filters'),
    refetchInterval: 5000
  });

  const { data: predictions, isLoading: predLoading } = useQuery({
    queryKey: ['filter-predictions'],
    queryFn: () => api.get('/filters/prediction'),
    enabled: showPredictions
  });

  const { data: historyData } = useQuery({
    queryKey: ['filter-history'],
    queryFn: async () => {
      const components = ['SEDIMENT', 'CARBON', 'UF_MEMBRANE', 'RO_MEMBRANE', 'UV_LAMP'];
      const allHistory = await Promise.all(
        components.map(comp => api.get(`/filters/history/${comp}`))
      );
      return allHistory;
    }
  });

  const trainMutation = useMutation({
    mutationFn: () => api.post('/filters/train', {}),
    onSuccess: () => {
      toast.success('Model training started. This may take a moment...');
      setTimeout(() => refetch(), 2000);
    },
    onError: () => {
      toast.error('Failed to train prediction model');
    }
  });

  const handleTrain = () => {
    trainMutation.mutate();
  };

  const handleGeneratePredictions = () => {
    setShowPredictions(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filterData = filters || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#101D2D]">Filter Intelligence</h1>
        <p className="text-sm text-[#718096] mt-1">Predictive maintenance and filter health monitoring</p>
      </div>

      {/* Filter Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {filterData.map((filter: any) => (
          <div
            key={filter.component}
            className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={getHealthColor(filter.health_pct)}>
                {filterIcons[filter.component]}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                filter.health_pct > 70 ? 'bg-green-100 text-green-700' :
                filter.health_pct > 40 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {getHealthStatus(filter.health_pct)}
              </span>
            </div>

            <h3 className="font-semibold text-sm text-[#101D2D] mb-3">
              {filter.component.replace(/_/g, ' ')}
            </h3>

            {/* Health Circle */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#E2E8F0"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke={filter.health_pct > 70 ? '#16A36A' : filter.health_pct > 40 ? '#E5A000' : '#D94848'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - filter.health_pct / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-[#101D2D]">{filter.health_pct}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#718096]">Processed:</span>
                <span className="font-medium">{filter.litres_processed.toFixed(0)}L / {filter.expected_life_litres}L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Hours:</span>
                <span className="font-medium">{filter.operating_hours.toFixed(0)}h / {filter.expected_life_hours}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#718096]">Remaining:</span>
                <span className="font-medium">{filter.estimated_remaining_days} days</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Predictive Maintenance Section */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-[#1677C8]" />
          <h2 className="font-semibold text-[#101D2D]">ML-Based Filter Life Prediction</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> Model trained on synthetic data. Predictions are experimental estimates requiring calibration with real operating data.
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={handleTrain}
            disabled={trainMutation.isPending}
            className="px-4 py-2 bg-[#1677C8] text-white rounded-lg hover:bg-[#1467B8] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
          >
            {trainMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Training...</span>
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                <span>Train Prediction Model</span>
              </>
            )}
          </button>

          <button
            onClick={handleGeneratePredictions}
            disabled={predLoading}
            className="px-4 py-2 bg-[#27B8D5] text-white rounded-lg hover:bg-[#1fa8c5] disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-colors"
          >
            {predLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4" />
                <span>Generate Predictions</span>
              </>
            )}
          </button>
        </div>

        {/* Prediction Results */}
        {showPredictions && predictions && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="text-left py-2 font-semibold text-[#101D2D]">Component</th>
                  <th className="text-left py-2 font-semibold text-[#101D2D]">Predicted Remaining Days</th>
                  <th className="text-left py-2 font-semibold text-[#101D2D]">Predicted Remaining Litres</th>
                  <th className="text-left py-2 font-semibold text-[#101D2D]">Confidence</th>
                  <th className="text-left py-2 font-semibold text-[#101D2D]">Model Version</th>
                </tr>
              </thead>
              <tbody>
                {predictions.predictions?.map((pred: any) => (
                  <tr key={pred.component} className="border-b border-[#E2E8F0]">
                    <td className="py-2">{pred.component.replace(/_/g, ' ')}</td>
                    <td className="py-2">{pred.predicted_days}</td>
                    <td className="py-2">{pred.predicted_litres?.toFixed(0)} L</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pred.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        pred.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {pred.confidence}
                      </span>
                    </td>
                    <td className="py-2 text-[#718096]">{pred.model_version || 'v1.0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-[#718096] mt-3">
              Model Status: {predictions.model_available ? '✓ Trained' : '✗ Not Trained'}
              {predictions.trained_at && ` | Trained: ${format(parseISO(predictions.trained_at), 'PPp')}`}
            </p>
          </div>
        )}
      </div>

      {/* Degradation Trend Charts */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="font-semibold text-[#101D2D] mb-4">Filter Degradation Trends</h2>

        {historyData && historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historyData[0] || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(val) => format(parseISO(val), 'MM/dd HH:mm')}
                stroke="#718096"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#718096"
                style={{ fontSize: '12px' }}
                label={{ value: 'Health %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px'
                }}
                labelFormatter={(val) => format(parseISO(val), 'PPp')}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="health_pct"
                stroke="#1677C8"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Health %"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-[#718096] text-center py-8">
            No historical degradation data available yet. Run the simulation to collect data.
          </p>
        )}
      </div>

      {/* Maintenance Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#E5A000]" />
          <h2 className="font-semibold text-[#101D2D]">Maintenance Recommendations</h2>
        </div>

        <div className="space-y-3">
          {filterData
            .filter((f: any) => f.health_pct < 70)
            .map((filter: any) => (
              <div
                key={filter.component}
                className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <AlertTriangle className="w-5 h-5 text-[#E5A000] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-[#101D2D] mb-1">
                    {filter.component.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-sm text-[#718096]">
                    {filter.health_pct > 40
                      ? `Filter health is ${filter.health_pct}%. Schedule replacement within ${filter.estimated_remaining_days} days.`
                      : `Critical: Filter health is ${filter.health_pct}%. Replacement recommended immediately.`}
                  </p>
                </div>
              </div>
            ))}

          {filterData.every((f: any) => f.health_pct >= 70) && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#16A36A]" />
              <p className="text-sm text-green-700">
                All filters are in healthy condition. No immediate maintenance required.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance History Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-[#1677C8]" />
          <h2 className="font-semibold text-[#101D2D]">Maintenance History</h2>
        </div>

        <div className="space-y-3">
          {filterData.map((filter: any) => (
            <div key={filter.component} className="flex items-start gap-3 text-sm">
              <Calendar className="w-4 h-4 text-[#718096] mt-0.5" />
              <div>
                <span className="font-medium">{filter.component.replace(/_/g, ' ')}</span>
                <span className="text-[#718096] ml-2">
                  Installed: {filter.installed_date ? format(parseISO(filter.installed_date), 'PP') : 'Unknown'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
