import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type MemberRole = 'owner' | 'manager' | 'staff';

export interface CurrentOrganization {
  role: MemberRole;
  organizationId: string;
  organizationName: string;
}

/**
 * Retorna a organização (e papel) do usuário autenticado.
 * Hoje há uma única organização por usuário; o modelo já suporta várias.
 */
export function useOrganization() {
  return useQuery<CurrentOrganization | null>({
    queryKey: ['organization'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memberships')
        .select('role, organization_id, organizations(name)')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const org = data.organizations as unknown as { name: string } | null;
      return {
        role: data.role as MemberRole,
        organizationId: data.organization_id as string,
        organizationName: org?.name ?? 'Organização',
      };
    },
  });
}
