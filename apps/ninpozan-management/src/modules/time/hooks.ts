import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clock, deleteTimeEntry, listTimeEntries } from './api';
import type { TimeEntryKind } from './types';

const TIME_KEY = ['time-entries'] as const;

export function useTimeEntries() {
  return useQuery({ queryKey: TIME_KEY, queryFn: listTimeEntries });
}

export function useClock(organizationId: string, profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, note }: { kind: TimeEntryKind; note?: string }) =>
      clock(organizationId, profileId, kind, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: TIME_KEY }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TIME_KEY }),
  });
}
