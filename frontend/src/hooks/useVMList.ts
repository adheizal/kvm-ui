import { useQuery } from '@tanstack/react-query';
import { vmApi } from '@/lib/api';
import { POLLING_INTERVAL } from '@/config/constants';
import { useEffect } from 'react';

export function useVMList(liveMode: boolean = false) {
  const query = useQuery({
    queryKey: ['vms', liveMode ? 'live' : 'db'],
    queryFn: liveMode ? vmApi.listLive : vmApi.list,
    refetchInterval: POLLING_INTERVAL, // Auto-refresh every 10s
    staleTime: 5000,
  });

  useEffect(() => {
    // Refetch VM list when WebSocket events indicate changes
    const handleVMListUpdate = () => {
      query.refetch();
    };

    // Listen for WebSocket events that should trigger a refetch
    window.addEventListener('vm:created', handleVMListUpdate);
    window.addEventListener('vm:deleted', handleVMListUpdate);
    window.addEventListener('vm:list:updated', handleVMListUpdate);
    window.addEventListener('vm:status', handleVMListUpdate);
    window.addEventListener('vm:operation:complete', handleVMListUpdate);

    return () => {
      window.removeEventListener('vm:created', handleVMListUpdate);
      window.removeEventListener('vm:deleted', handleVMListUpdate);
      window.removeEventListener('vm:list:updated', handleVMListUpdate);
      window.removeEventListener('vm:status', handleVMListUpdate);
      window.removeEventListener('vm:operation:complete', handleVMListUpdate);
    };
  }, [query]);

  return query;
}
