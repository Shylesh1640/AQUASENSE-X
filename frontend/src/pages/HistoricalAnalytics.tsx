import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Download,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';
import { KPICard } from '../components/common/KPICard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const SENSOR_COLORS = {
  TDS: '#1677C8',
  PH: '#27B8D5',
  TURBIDITY: '#E5A000',
  TEMPERATURE: '#D94848',
  FLOW: '#16A36A',
  PRESSURE: '#9333EA'
};

export const HistoricalAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd\'T\'HH:mm'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'));
  const [selectedParams, setSelectedParams] = useState<string[]>(['TDS', 'PH', 'TURBIDITY']);
  const [chartType, setChartType] = useState<'line' | 'area'>('line');

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary'),
    refetchInterval: 5000
  });

  const { data: sensorHistory } = useQuery({
    queryKey: ['sensor-history', startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append('start', startDate);
      params.append('end', endDate);
      params.append('limit', '500');
      return api.get(`/sensors/history?${params.toString()}`);
    }
  });

  const { data: consumptionData } = useQuery({
    queryKey: ['water-consumption'],
    queryFn: () => api.get('/analytics/consumption')
  });

  const toggleParam = (param: string) => {
    if (selectedParams.includes(param)) {
      setSelectedParams(selectedParams.filter(p => p !== param));
    } else {
      setSelectedParams([...selectedParams, param]);
    }
  };

  const handleExportSensorData = async () => {
    try {
      const params = new URLSearchParams();
      params.append('start', startDate);
      params.append('end', endDate);
      const response = await fetch(`${api.baseURL}/analytics/export?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'text/csv' }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sensor_data_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Sensor data exported successfully');
    } catch (error) {
      toast.error('Failed to export sensor data');
    }
  };

  const handleExportReport = async () => {
    try {
      toast.info('Generating analytics report...');
      // In a real implementation, this would generate a comprehensive PDF report
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Report generation feature coming soon');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const summary = analyticsData || {};
  const historyData = sensorHistory || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101D2D]">Historical Analytics</h1>
          <p className="text-sm text-[#718096] mt-1">Analyze historical sensor data and system performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportSensorData}
            className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-[#1677C8] text-white rounded-lg hover:bg-[#1467B8] text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Litres Processed"
          value={`${(summary.total_litres_processed || 0).toFixed(1)} L`}
          icon={<TrendingUp className="w-5 h-5" />}
          status="info"
        />
        <KPICard
          title="Operating Hours"
          value={`${(summary.total_operating_hours || 0).toFixed(1)} hrs`}
          icon={<Activity className="w-5 h-5" />}
          status="info"
        />
        <KPICard
          title="Avg TDS Reduction"
          value={`${(summary.avg_tds_reduction || 0).toFixed(1)}%`}
          icon={<BarChart3 className="w-5 h-5" />}
          status="success"
        />
        <KPICard
          title="Total Faults"
          value={(summary.total_faults || 0).toString()}
          icon={<Activity className="w-5 h-5" />}
          status="warning"
        />
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="text-xs font-medium text-[#718096] mb-1 block">Start Date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#718096] mb-1 block">End Date</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>

          {/* Chart Type */}
          <div>
            <label className="text-xs font-medium text-[#718096] mb-1 block">Chart Type</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'line' | 'area')}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
            </select>
          </div>

          {/* Parameter Selection */}
          <div>
            <label className="text-xs font-medium text-[#718096] mb-1 block">Parameters</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(SENSOR_COLORS).map(param => (
                <button
                  key={param}
                  onClick={() => toggleParam(param)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedParams.includes(param)
                      ? 'bg-[#1677C8] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {param}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Historical Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="font-semibold text-[#101D2D] mb-4">Historical Sensor Trends</h2>

        {historyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={historyData}>
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
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="#1677C8"
                  tickFormatter={(val) => format(parseISO(val), 'HH:mm')}
                />
                {selectedParams.map(param => (
                  <Line
                    key={param}
                    type="monotone"
                    dataKey={param.toLowerCase()}
                    stroke={SENSOR_COLORS[param as keyof typeof SENSOR_COLORS]}
                    strokeWidth={2}
                    dot={false}
                    name={param}
                  />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={historyData}>
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
                <Brush
                  dataKey="timestamp"
                  height={30}
                  stroke="#1677C8"
                  tickFormatter={(val) => format(parseISO(val), 'HH:mm')}
                />
                {selectedParams.map(param => (
                  <Area
                    key={param}
                    type="monotone"
                    dataKey={param.toLowerCase()}
                    stroke={SENSOR_COLORS[param as keyof typeof SENSOR_COLORS]}
                    fill={SENSOR_COLORS[param as keyof typeof SENSOR_COLORS]}
                    fillOpacity={0.3}
                    name={param}
                  />
                ))}
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-[#718096] mx-auto mb-3" />
            <p className="text-sm text-[#718096]">
              No data available for the selected time range. Run the simulation to collect data.
            </p>
          </div>
        )}
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inlet vs Outlet TDS */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[#101D2D] mb-4">Inlet vs Outlet TDS</h3>
          {historyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(val) => format(parseISO(val), 'HH:mm')}
                  stroke="#718096"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  stroke="#718096"
                  style={{ fontSize: '11px' }}
                  label={{ value: 'TDS (ppm)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="inlet_tds"
                  stroke="#E5A000"
                  strokeWidth={2}
                  dot={false}
                  name="Inlet TDS"
                />
                <Line
                  type="monotone"
                  dataKey="outlet_tds"
                  stroke="#16A36A"
                  strokeWidth={2}
                  dot={false}
                  name="Outlet TDS"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#718096] text-center py-12">No data available</p>
          )}
        </div>

        {/* Water Consumption */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[#101D2D] mb-4">Daily Water Consumption</h3>
          {consumptionData && consumptionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={consumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => format(parseISO(val), 'MM/dd')}
                  stroke="#718096"
                  style={{ fontSize: '11px' }}
                />
                <YAxis
                  stroke="#718096"
                  style={{ fontSize: '11px' }}
                  label={{ value: 'Litres', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="litres" fill="#1677C8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-[#718096] text-center py-12">No consumption data available</p>
          )}
        </div>

        {/* Filter Degradation */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[#101D2D] mb-4">Filter Degradation History</h3>
          <div className="text-sm text-[#718096] text-center py-12">
            <Activity className="w-10 h-10 text-[#718096] mx-auto mb-2" />
            Filter degradation trends available in Filter Intelligence page
          </div>
        </div>

        {/* Fault Frequency */}
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h3 className="font-semibold text-[#101D2D] mb-4">Fault Frequency by Category</h3>
          <div className="space-y-3">
            {summary.fault_frequency && Object.keys(summary.fault_frequency).length > 0 ? (
              Object.entries(summary.fault_frequency).map(([category, count]: [string, any]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[#718096]">{category}</span>
                    <span className="text-sm font-semibold text-[#101D2D]">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#E5A000] h-2 rounded-full"
                      style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#718096] text-center py-8">No fault data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Data Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h3 className="font-semibold text-[#101D2D] mb-4">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[#718096]">Data Points:</span>
            <span className="ml-2 font-semibold">{historyData.length}</span>
          </div>
          <div>
            <span className="text-[#718096]">Time Range:</span>
            <span className="ml-2 font-semibold">
              {historyData.length > 0
                ? `${format(parseISO(historyData[0].timestamp), 'MM/dd HH:mm')} - ${format(parseISO(historyData[historyData.length - 1].timestamp), 'MM/dd HH:mm')}`
                : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-[#718096]">Parameters:</span>
            <span className="ml-2 font-semibold">{selectedParams.length}</span>
          </div>
          <div>
            <span className="text-[#718096]">Chart Type:</span>
            <span className="ml-2 font-semibold capitalize">{chartType}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
