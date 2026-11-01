import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { api } from '../services/api';
import { KPICard } from '../components/common/KPICard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/StatusBadge';

const severityConfig = {
  CRITICAL: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-[#D94848]',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-500'
  },
  WARNING: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-[#E5A000]',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-500'
  },
  INFO: {
    icon: <Info className="w-5 h-5" />,
    color: 'text-[#1677C8]',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500'
  },
  EMERGENCY: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-[#D94848]',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-600'
  }
};

export const AlertsEvents: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [showTimeline, setShowTimeline] = useState(false);

  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', severityFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter === 'unacknowledged') params.append('acknowledged', 'false');
      if (statusFilter === 'acknowledged') params.append('acknowledged', 'true');
      if (statusFilter === 'resolved') params.append('resolved', 'true');
      return api.get(`/alerts?${params.toString()}`);
    },
    refetchInterval: 3000
  });

  const { data: timeline } = useQuery({
    queryKey: ['alerts-timeline'],
    queryFn: () => api.get('/alerts/timeline'),
    enabled: showTimeline,
    refetchInterval: 5000
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: number) => api.post(`/alerts/${alertId}/acknowledge`, {}),
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast.error('Failed to acknowledge alert');
    }
  });

  const resolveMutation = useMutation({
    mutationFn: (alertId: number) => api.post(`/alerts/${alertId}/resolve`, {}),
    onSuccess: () => {
      toast.success('Alert resolved');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: () => {
      toast.error('Failed to resolve alert');
    }
  });

  const handleExport = async () => {
    try {
      const response = await fetch(`${api.baseURL}/alerts/export`, {
        method: 'GET',
        headers: { 'Content-Type': 'text/csv' }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Alerts exported successfully');
    } catch (error) {
      toast.error('Failed to export alerts');
    }
  };

  const toggleExpand = (alertId: number) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const alertList = alerts || [];
  const filteredAlerts = alertList.filter((alert: any) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        alert.description.toLowerCase().includes(term) ||
        alert.source.toLowerCase().includes(term) ||
        alert.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalActive = alertList.filter((a: any) => !a.resolved).length;
  const criticalCount = alertList.filter((a: any) => a.severity === 'CRITICAL' && !a.resolved).length;
  const warningCount = alertList.filter((a: any) => a.severity === 'WARNING' && !a.resolved).length;
  const resolvedToday = alertList.filter((a: any) => {
    if (!a.resolved_at) return false;
    const resolvedDate = parseISO(a.resolved_at);
    const today = new Date();
    return resolvedDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101D2D]">Alerts & Events</h1>
          <p className="text-sm text-[#718096] mt-1">System alerts and event timeline</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="px-4 py-2 bg-white border border-[#E2E8F0] rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            {showTimeline ? 'Hide Timeline' : 'Show Timeline'}
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-[#1677C8] text-white rounded-lg hover:bg-[#1467B8] text-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Active Alerts"
          value={totalActive.toString()}
          icon={<AlertCircle className="w-5 h-5" />}
          status="info"
        />
        <KPICard
          title="Critical Alerts"
          value={criticalCount.toString()}
          icon={<XCircle className="w-5 h-5" />}
          status="error"
        />
        <KPICard
          title="Warnings"
          value={warningCount.toString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          status="warning"
        />
        <KPICard
          title="Resolved Today"
          value={resolvedToday.toString()}
          icon={<CheckCircle className="w-5 h-5" />}
          status="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-4">
        <div className="flex flex-wrap gap-3">
          {/* Severity Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-[#718096] mb-1 block">Severity</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-[#718096] mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            >
              <option value="all">All Statuses</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-[#718096] mb-1 block">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search alerts..."
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1677C8]"
            />
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0]">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h2 className="font-semibold text-[#101D2D]">
            Alerts ({filteredAlerts.length})
          </h2>
        </div>

        <div className="divide-y divide-[#E2E8F0]">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert: any) => {
              const config = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.INFO;
              const isExpanded = expandedAlerts.has(alert.id);

              return (
                <div key={alert.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
                              {alert.severity}
                            </span>
                            <span className="text-xs text-[#718096]">{alert.source}</span>
                            {alert.acknowledged && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                Acknowledged
                              </span>
                            )}
                            {alert.resolved && (
                              <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#101D2D] mb-1">
                            {alert.description}
                          </p>
                          <p className="text-xs text-[#718096]">
                            {format(parseISO(alert.timestamp), 'PPp')}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleExpand(alert.id)}
                          className="flex-shrink-0 text-[#1677C8] hover:text-[#1467B8]"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                          <div>
                            <span className="text-xs font-medium text-[#718096]">Recommended Action:</span>
                            <p className="text-sm text-[#101D2D] mt-1">{alert.recommended_action}</p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-[#718096]">Category:</span>
                            <span className="text-sm text-[#101D2D] ml-2">{alert.category}</span>
                          </div>
                          {alert.acknowledged_at && (
                            <div>
                              <span className="text-xs font-medium text-[#718096]">Acknowledged:</span>
                              <span className="text-sm text-[#101D2D] ml-2">
                                {format(parseISO(alert.acknowledged_at), 'PPp')}
                              </span>
                            </div>
                          )}
                          {alert.resolved_at && (
                            <div>
                              <span className="text-xs font-medium text-[#718096]">Resolved:</span>
                              <span className="text-sm text-[#101D2D] ml-2">
                                {format(parseISO(alert.resolved_at), 'PPp')}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2 mt-3">
                            {!alert.acknowledged && (
                              <button
                                onClick={() => acknowledgeMutation.mutate(alert.id)}
                                disabled={acknowledgeMutation.isPending}
                                className="px-3 py-1.5 bg-[#1677C8] text-white rounded text-xs hover:bg-[#1467B8] disabled:bg-gray-300"
                              >
                                Acknowledge
                              </button>
                            )}
                            {!alert.resolved && (
                              <button
                                onClick={() => resolveMutation.mutate(alert.id)}
                                disabled={resolveMutation.isPending}
                                className="px-3 py-1.5 bg-[#16A36A] text-white rounded text-xs hover:bg-[#0f8d58] disabled:bg-gray-300"
                              >
                                Resolve
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-[#718096] mx-auto mb-3" />
              <p className="text-sm text-[#718096]">No alerts match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Timeline */}
      {showTimeline && (
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
          <h2 className="font-semibold text-[#101D2D] mb-4">Event Timeline</h2>

          <div className="space-y-3">
            {timeline && timeline.length > 0 ? (
              timeline.map((event: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-[#1677C8]" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-[#101D2D]">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-[#718096]">
                            {format(parseISO(event.timestamp), 'PPp')}
                          </span>
                          <span className="text-xs text-[#718096]">•</span>
                          <span className="text-xs text-[#718096]">{event.source}</span>
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {event.event_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#718096] text-center py-8">No recent events</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
