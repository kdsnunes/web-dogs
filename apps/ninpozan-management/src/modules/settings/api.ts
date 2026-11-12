import { supabase } from '@/lib/supabase';
import type { MemberRole } from '@/modules/organization/useOrganization';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
}

export interface Member {
  membershipId: string;
  profileId: string;
  fullName: string;
  role: MemberRole;
  createdAt: string;
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function updateMyProfile(userId: string, fullName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName.trim() })
    .eq('id', userId);
  if (error) throw error;
}

export async function getOrgDetails(orgId: string): Promise<OrgDetails | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, invite_code')
    .eq('id', orgId)
    .maybeSingle();
  if (error) throw error;
  return (data as OrgDetails) ?? null;
}

export async function listMembers(orgId: string): Promise<Member[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('id, profile_id, role, created_at, profiles(full_name)')
    .eq('organization_id', orgId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null } | null;
    return {
      membershipId: row.id as string,
      profileId: row.profile_id as string,
      fullName: profile?.full_name?.trim() || 'Sem nome',
      role: row.role as MemberRole,
      createdAt: row.created_at as string,
    };
  });
}

export async function updateMemberRole(membershipId: string, role: MemberRole): Promise<void> {
  const { error } = await supabase.from('memberships').update({ role }).eq('id', membershipId);
  if (error) throw error;
}

export async function removeMember(membershipId: string): Promise<void> {
  const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
  if (error) throw error;
}

export async function regenerateInviteCode(orgId: string): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code', { p_org: orgId });
  if (error) throw error;
  return data as string;
}

export async function joinOrganization(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_organization', { p_code: code });
  if (error) throw error;
  return data as string;
}
