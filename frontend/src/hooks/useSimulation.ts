import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useSimulationStatus() {
  return useQuery({
    queryKey: ['simulation-status'],
    queryFn: api.getSimulationStatus,
    refetchInterval: 2000,
  });
}

export function useStartSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.startSimulation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulation-status'] });
      qc.invalidateQueries({ queryKey: ['sensor-readings'] });
    },
  });
}

export function usePauseSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.pauseSimulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulation-status'] }),
  });
}

export function useResumeSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.resumeSimulation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['simulation-status'] }),
  });
}

export function useStopSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.stopSimulation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulation-status'] });
      qc.invalidateQueries({ queryKey: ['sensor-readings'] });
    },
  });
}

export function useResetSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.resetSimulation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['simulation-status'] });
      qc.invalidateQueries({ queryKey: ['sensor-readings'] });
    },
  });
}
