/**
 * TeamSettings — Settings → Team ([D21] Scheibe 7).
 *
 * Mitglieder (public.users der Org) auflisten, Rollen ändern (nur Owner), neue Personen
 * einladen (Owner/Admin) und offene Einladungen verwalten. Org + eigene Rolle aus
 * useCurrentOrg; invited_by aus useAuth. Writes über lib/db (RLS-/rollen-gescoped).
 *
 * Hinweis: Der Einladungs-Mailversand braucht die Supabase Admin-API (service_role) →
 * kommt als Edge Function (deferred). Hier wird die Einladung nur persistiert; beim
 * späteren Registrieren übernimmt der Provisioning-Trigger (Migr. 043) Org + Rolle.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeamMembers,
  getInvitations,
  createInvitation,
  deleteInvitation,
  updateUserRole,
} from "@/lib/db";
import { Avatar } from "@/components";
import { useToast } from "@/components/shared/Toast";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

const INVITE_ROLES = ["admin", "member", "viewer"] as const;
const ALL_ROLES = ["owner", "admin", "member", "viewer"] as const;

export default function TeamSettings() {
  const { t } = useTranslation();
  const { organizationId, role: myRole } = useCurrentOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const canInvite = myRole === "owner" || myRole === "admin";
  const canChangeRole = myRole === "owner";

  const roleLabel = (r: string) =>
    t(`settings.team.role${r.charAt(0).toUpperCase()}${r.slice(1)}`, r);
  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString() : "—";

  const membersQuery = useQuery({
    queryKey: ["teamMembers", organizationId],
    queryFn: () => getTeamMembers(organizationId),
    staleTime: 60_000,
  });
  const invitesQuery = useQuery({
    queryKey: ["invitations", organizationId],
    queryFn: () => getInvitations(organizationId),
    staleTime: 60_000,
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");

  const inviteMutation = useMutation({
    mutationFn: () => createInvitation(organizationId, email, inviteRole, user?.id ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", organizationId] });
      toast(t("settings.team.invited"));
      setOpen(false);
      setEmail("");
      setInviteRole("member");
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => deleteInvitation(id, organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations", organizationId] });
      toast(t("settings.team.withdrawn"));
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  const roleMutation = useMutation({
    mutationFn: (v: { userId: string; role: string }) => updateUserRole(v.userId, organizationId, v.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers", organizationId] });
      toast(t("settings.team.roleChanged"));
    },
    onError: (e) => toast((e as Error).message, "error"),
  });

  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in font-sans pb-12 text-left">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-text-primary tracking-tight">{t("settings.team.title")}</h1>
          <p className="text-[12px] text-text-muted mt-0.5">{t("settings.team.subtitle")}</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setOpen(true)}
            className="sherloq-btn-primary inline-flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> {t("settings.team.invite")}
          </button>
        )}
      </div>

      {/* Mitglieder */}
      <section className="bg-app-surface rounded-[12px] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase text-text-muted">
          {t("settings.team.members")}
        </div>
        {members.length === 0 ? (
          <p className="px-5 pb-5 text-[13px] text-text-muted">{t("settings.team.noMembers")}</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-semibold uppercase text-text-muted border-b border-border">
                <th className="font-semibold px-5 py-2">{t("settings.team.colMember")}</th>
                <th className="font-semibold px-5 py-2">{t("settings.team.colEmail")}</th>
                <th className="font-semibold px-5 py-2">{t("settings.team.colRole")}</th>
                <th className="font-semibold px-5 py-2">{t("settings.team.colSince")}</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const id = m.id as string;
                const name = (m.full_name as string) || (m.email as string) || "—";
                return (
                  <tr key={id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2.5">
                        <Avatar name={name} size="sm" />
                        <span className="text-[13px] font-medium text-text-primary">{name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-text-body">{(m.email as string) || "—"}</td>
                    <td className="px-5 py-3">
                      {canChangeRole ? (
                        <Select value={m.role as string} onValueChange={(r) => roleMutation.mutate({ userId: id, role: r })}>
                          <SelectTrigger className="w-[140px] h-8 text-[13px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ALL_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-[13px]">{roleLabel(r)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-[13px] text-text-body">{roleLabel(m.role as string)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-text-muted">{fmtDate(m.created_at as string)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Offene Einladungen */}
      <section className="bg-app-surface rounded-[12px] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase text-text-muted">
          {t("settings.team.pending")}
        </div>
        {invites.length === 0 ? (
          <p className="px-5 pb-5 text-[13px] text-text-muted">{t("settings.team.noPending")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {invites.map((inv) => {
              const id = inv.id as string;
              return (
                <li key={id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-text-primary truncate">{inv.email as string}</p>
                    <p className="text-[11px] text-text-muted">
                      {roleLabel(inv.role as string)} · {t("settings.team.expires", { date: fmtDate(inv.expires_at as string) })}
                    </p>
                  </div>
                  {canInvite && (
                    <button
                      onClick={() => withdrawMutation.mutate(id)}
                      className="sherloq-btn-secondary inline-flex items-center gap-1.5 shrink-0 text-[12px]"
                    >
                      <X className="w-3.5 h-3.5" /> {t("settings.team.withdraw")}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Einladen-Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.team.modalTitle")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); if (email.trim()) inviteMutation.mutate(); }}
            className="flex flex-col gap-4"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-body">{t("settings.team.emailLabel")}</span>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("settings.team.emailPlaceholder")}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-text-body">{t("settings.team.roleLabel")}</span>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="text-[13px]">{roleLabel(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <p className="text-[11px] text-text-muted">{t("settings.team.emailHint")}</p>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="sherloq-btn-secondary"
              >
                {t("settings.team.cancel")}
              </button>
              <button
                type="submit"
                disabled={inviteMutation.isPending || !email.trim()}
                className="sherloq-btn-primary disabled:opacity-60"
              >
                {inviteMutation.isPending ? t("settings.team.sending") : t("settings.team.send")}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
