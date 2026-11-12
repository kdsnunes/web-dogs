import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MemberRole } from '@/modules/organization/useOrganization';
import {
  getMyProfile,
  getOrgDetails,
  listMembers,
  regenerateInviteCode,
  removeMember,
  updateMemberRole,
  updateMyProfile,
} from './api';

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-profile', userId],
    queryFn: () => getMyProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateMyProfile(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fullName: string) => updateMyProfile(userId, fullName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile', userId] });
      qc.invalidateQueries({ queryKey: ['members'] });
      qc.invalidateQueries({ queryKey: ['org-members'] });
    },
  });
}

export function useOrgDetails(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-details', orgId],
    queryFn: () => getOrgDetails(orgId!),
    enabled: !!orgId,
  });
}

export function useMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['members', orgId],
    queryFn: () => listMembers(orgId!),
    enabled: !!orgId,
  });
}

export function useUpdateMemberRole(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: MemberRole }) =>
      updateMemberRole(membershipId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}

export function useRemoveMember(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => removeMember(membershipId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
}

export function useRegenerateInviteCode(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateInviteCode(orgId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-details', orgId] }),
  });
}
