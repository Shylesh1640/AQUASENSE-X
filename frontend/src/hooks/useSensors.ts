import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export function useCurrentReadings() {
  return useQuery({
    queryKey: ['sensor-readings'],
    queryFn: api.getCurrentReadings,
    refetchInterval: 2000,
  });
}

export function useSensorHistory(sensorType?: string, limit = 100) {
  return useQuery({
    queryKey: ['sensor-history', sensorType, limit],
    queryFn: () => api.getSensorHistory({ sensor_type: sensorType, limit }),
    refetchInterval: 5000,
  });
}
