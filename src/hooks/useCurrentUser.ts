import type { CurrentUser } from '../types/navigation'

/**
 * Returns the current authenticated user with their role.
 *
 * Phase 3 replacement: swap this mock with Supabase auth:
 *   const { data: { user } } = await supabase.auth.getUser()
 *   const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
 *
 * Role controls which nav items are visible — see navConfig.tsx for access map.
 * Valid roles: 'solo' | 'hunter' | 'farmer' | 'admin'
 *   solo   → all sections visible
 *   hunter → mein-tag + hunting + jira
 *   farmer → mein-tag + farming + jira
 *   admin  → all sections + admin controls
 */
export function useCurrentUser(): CurrentUser {
  return {
    id: 'mock-user-1',
    name: 'Oliver Sand',
    email: 'oliver@sherloq.io',
    role: 'solo', // ← change to 'hunter' or 'farmer' to test role-based nav
  }
}
