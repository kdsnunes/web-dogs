import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  clearDay,
  getMonthLock,
  getRestPref,
  listDayEntries,
  listMonthEntries,
  listOrgMembers,
  setDayStatus,
  setMonthLock,
  setRestPref,
} from './api';
import type { DayStatus, MonthLockState } from './types';

export function useDayEntries(
  profileId: string | undefined,
  monthStartISO: string,
  nextMonthStartISO: string,
) {
  return useQuery({
    queryKey: ['day-entries', profileId, monthStartISO],
    queryFn: () => listDayEntries(profileId!, monthStartISO, nextMonthStartISO),
    enabled: !!profileId,
  });
}

export function useMonthEntries(
  organizationId: string | undefined,
  monthStartISO: string,
  nextMonthStartISO: string,
) {
  return useQuery({
    queryKey: ['month-entries', organizationId, monthStartISO],
    queryFn: () => listMonthEntries(organizationId!, monthStartISO, nextMonthStartISO),
    enabled: !!organizationId,
  });
}

export function useRestPref(profileId: string | undefined, referenceMonth: string) {
  return useQuery({
    queryKey: ['rest-pref', profileId, referenceMonth],
    queryFn: () => getRestPref(profileId!, referenceMonth),
    enabled: !!profileId,
  });
}

export function useMonthLock(organizationId: string | undefined, referenceMonth: string) {
  return useQuery({
    queryKey: ['month-lock', organizationId, referenceMonth],
    queryFn: () => getMonthLock(organizationId!, referenceMonth),
    enabled: !!organizationId,
  });
}

export function useOrgMembers(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['org-members', organizationId],
    queryFn: () => listOrgMembers(organizationId!),
    enabled: !!organizationId,
  });
}

export function useSetDayStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      organizationId: string;
      profileId: string;
      entryDate: string;
      status: DayStatus;
    }) => setDayStatus(p),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['day-entries', v.profileId] }),
  });
}

export function useClearDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { profileId: string; entryDate: string }) =>
      clearDay(p.profileId, p.entryDate),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['day-entries', v.profileId] }),
  });
}

export function useSetRestPref() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      organizationId: string;
      profileId: string;
      referenceMonth: string;
      weekday: number;
    }) => setRestPref(p),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['rest-pref', v.profileId, v.referenceMonth] });
    },
  });
}

export function useSetMonthLock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: {
      organizationId: string;
      referenceMonth: string;
      state: MonthLockState | null;
    }) => setMonthLock(p),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ['month-lock', v.organizationId, v.referenceMonth] }),
  });
}
