import { useLocation } from 'react-router-dom';
import { Bell, Wifi, WifiOff, Radio } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { api } from '../../services/api';
import { SimulationState } from '../../types';
import { useWebSocket } from '../../hooks/useWebSocket';

const routeTitles: Record<string, string> = {
  '/': 'Overview Dashboard',
  '/monitoring': 'Live Monitoring',
  '/simulator': 'Sensor Simulator',
  '/quality': 'Water Quality Analysis',
  '/treatment': 'Treatment Control',
  '/filters': 'Filter Intelligence',
  '/recovery': 'RO Recovery',
  '/alerts': 'Alerts & Events',
  '/analytics': 'Historical Analytics',
  '/settings': 'System Settings',
  '/about': 'About AQUASENSE-X',
};

export default function TopBar() {
  const location = useLocation();
  const title = routeTitles[location.pathname] || 'AQUASENSE-X';
  const { connected: wsConnected } = useWebSocket();

  const { data: simStatus } = useQuery({
    queryKey: ['simulation-status'],
    queryFn: api.getSimulationStatus,
    refetchInterval: 3000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts', { acknowledged: false, limit: 50 }],
    queryFn: () => api.getAlerts({ acknowledged: false, limit: 50 }),
    refetchInterval: 5000,
  });

  const unacknowledgedCount = alerts?.length || 0;
  const simState = simStatus?.state || SimulationState.STOPPED;

  const simDotColor =
    simState === SimulationState.RUNNING
      ? 'bg-emerald-500'
      : simState === SimulationState.PAUSED
        ? 'bg-amber-500'
        : 'bg-gray-400';

  const simLabel =
    simState === SimulationState.RUNNING
      ? 'Running'
      : simState === SimulationState.PAUSED
        ? 'Paused'
        : simState === SimulationState.STARTING
          ? 'Starting'
          : 'Stopped';

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-[#172B43]">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
          <Radio className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-xs font-medium text-amber-700">SIMULATION MODE</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
          <span className={clsx('w-2 h-2 rounded-full', simDotColor, simState === SimulationState.RUNNING && 'animate-pulse-dot')} />
          <span className="text-xs font-medium text-[#718096]">{simLabel}</span>
          {simStatus?.speed && simStatus.speed > 1 && (
            <span className="text-xs text-[#1677C8] font-medium">{simStatus.speed}x</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#718096]">
          {wsConnected ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
          )}
          <span>{wsConnected ? 'Live' : 'Offline'}</span>
        </div>

        <button className="relative p-2 text-[#718096] hover:text-[#172B43] hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          {unacknowledgedCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#D94848] text-white text-[10px] font-bold flex items-center justify-center rounded-full min-w-[18px] px-1">
              {unacknowledgedCount > 99 ? '99+' : unacknowledgedCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
