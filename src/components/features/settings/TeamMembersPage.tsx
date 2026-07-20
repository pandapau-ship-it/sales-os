/**
 * TeamMembersPage — Settings → Organisation → Team & Rechte (SET-3).
 *
 * Echte Daten: getTeamMembers/getInvitations; Schreiben ausschließlich über die server-erzwungenen
 * RPCs (set_user_role · deactivate/reactivate/remove_member · create_invitation mit Dedup).
 * JEDE ändernde Aktion (Rollenwechsel, Deaktivieren, Reaktivieren, Entfernen) läuft über einen
 * AlertDialog — die Referenz hatte keine Bestätigung. Nach Erfolg: invalidateQueries (kein Reload).
 * „Offene Anfragen" ist bewusst eine leere „Folgt"-Karte (approval_requests kommt mit Chat-C6).
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, X, Copy, MoreHorizontal, Inbox, ShieldCheck } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useEffectivePermissions } from "@/hooks/usePermissions";
import { useHoverPrefetch } from "@/hooks/useHoverPrefetch";
import { prefetchMemberPanel } from "@/lib/prefetch";
import {
  getTeamMembers, getInvitations, createInvitation, deleteInvitation,
  updateUserRole, deactivateMember, reactivateMember, removeMember,
} from "@/lib/db";
import { ROLES } from "@/lib/permissions";
import { Avatar, SettingsCard, StatusBadge } from "@/components";
import { useToast } from "@/components/shared/toastContext";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MemberDetailPanel from "./MemberDetailPanel";

type Member = {
  id: string; full_name: string | null; email: string; role: string;
  created_at: string; status: string; last_seen_at: string | null;
};
type Invite = { id: string; email: string; role: string; expires_at: string; token: string };
type Confirm =
  | { kind: "role"; member: Member; nextRole: string }
  | { kind: "deactivate" | "reactivate" | "remove"; member: Member }
  | null;

const INVITE_ROLES = ["admin", "member", "viewer"] as const;

/** „zuletzt aktiv" — echte Angabe aus last_seen_at; nie geraten (null → „nie"). */
function lastActive(iso: string | null, t: (k: string, o?: Record<string, unknown>) => string): string {
  if (!iso) return t("settings.members.neverActive");
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return t("notifications.time.justNow");
  if (min < 60) return t("notifications.time.minutesAgo", { count: min });
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return t("notifications.time.hoursAgo", { count: hrs });
  return t("notifications.time.daysAgo", { count: Math.floor(hrs / 24) });
}

export default function TeamMembersPage() {
  const { t } = useTranslation();
  const { organizationId, role: myRole } = useCurrentOrg();
  const { user } = useAuth();
  const { has } = useEffectivePermissions();
  const { toast } = useToast();
  const qc = useQueryClient();
  // REGEL C: Hover-Intent-Prefetch — das Detail-Panel lädt Rechte + Historie per Query.
  const prefetch = useHoverPrefetch();

  const canInvite = has("team.invite");
  const canChangeRole = myRole === "owner"; // Spiegel set_user_role (Owner-only, strukturell)

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
  const members = (membersQuery.data ?? []) as unknown as Member[];
  const invites = (invitesQuery.data ?? []) as unknown as Invite[];

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["teamMembers", organizationId] });
    void qc.invalidateQueries({ queryKey: ["invitations", organizationId] });
  };

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("member");
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const fail = (e: unknown) => toast(e instanceof Error ? e.message : t("login.errorGeneric"));

  const invite = useMutation({
    mutationFn: () => createInvitation(organizationId, email, inviteRole),
    onSuccess: (result) => {
      invalidate();
      setInviteOpen(false);
      setEmail("");
      toast(t(`settings.members.invite.${result}`)); // created | renewed | already_member
    },
    onError: fail,
  });

  const act = useMutation({
    mutationFn: async (c: NonNullable<Confirm>) => {
      if (c.kind === "role") return updateUserRole(c.member.id, organizationId, c.nextRole);
      if (c.kind === "deactivate") return deactivateMember(c.member.id);
      if (c.kind === "reactivate") return reactivateMember(c.member.id);
      return removeMember(c.member.id);
    },
    onSuccess: (_d, c) => {
      invalidate();
      setConfirm(null);
      toast(t(`settings.members.done.${c.kind}`));
    },
    onError: (e) => { setConfirm(null); fail(e); },
  });

  const revoke = useMutation({
    mutationFn: (id: string) => deleteInvitation(id, organizationId),
    onSuccess: () => { invalidate(); toast(t("settings.members.invite.revoked")); },
    onError: fail,
  });

  const copyInviteLink = async (token: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/invite/${token}`);
    toast(t("settings.members.invite.linkCopied"));
  };

  const roleLabel = (r: string) => t(`settings.team.role${r.charAt(0).toUpperCase()}${r.slice(1)}`, r);

  return (
    <div className="max-w-4xl">
      {/* ── Mitglieder ── */}
      <SettingsCard title={t("settings.members.title")} description={t("settings.members.desc")}>
        <div className="flex justify-end -mt-2">
          {canInvite && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="sherloq-btn-primary inline-flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" /> {t("settings.members.inviteCta")}
            </button>
          )}
        </div>

        <div className="border border-border rounded-[12px] overflow-hidden divide-y divide-[var(--border-card)]">
          {members.map((m) => {
            const isSelf = m.id === user?.id;
            const deactivated = m.status === "deactivated";
            return (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 bg-app-surface hover:bg-app-bg transition-colors"
                {...prefetch(organizationId ? () => prefetchMemberPanel(qc, organizationId, m.id) : undefined)}
              >
                <Avatar name={m.full_name || m.email} size={32} />
                <button
                  type="button"
                  onClick={() => setDetailId(m.id)}
                  className="flex-1 min-w-0 text-left cursor-pointer group"
                >
                  <div className="typo-card-title text-text-primary truncate group-hover:text-sherloq-primary transition-colors">
                    {m.full_name || m.email}
                    {isSelf && <span className="ml-2 typo-chip text-text-muted">{t("settings.members.you")}</span>}
                  </div>
                  <div className="typo-subline text-text-muted truncate">{m.email}</div>
                </button>

                {/* Rolle — VOR dem Status. Nur „Owner" bekommt einen dezenten farbigen Hintergrund
                    (seltene, besondere Rolle), alle anderen bleiben neutral/grau. Reuse: StatusBadge
                    (kanonisches Badge, Token-Farben) — kein eigenes Farb-Muster erfunden. Keine
                    „Rolle"/„Status"-Überschriften (eine Zeile pro Person ist selbsterklärend). */}
                {canChangeRole && !isSelf ? (
                  <div className="w-[130px] shrink-0">
                    <Select value={m.role} onValueChange={(next) => setConfirm({ kind: "role", member: m, nextRole: next })}>
                      <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => <SelectItem key={r} value={r} className="text-[13px]">{roleLabel(r)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="shrink-0">
                    <StatusBadge tone={m.role === "owner" ? "info" : "muted"} label={roleLabel(m.role)} />
                  </div>
                )}

                {/* Status */}
                <StatusBadge
                  tone={deactivated ? "muted" : "success"}
                  label={t(deactivated ? "settings.members.status.deactivated" : "settings.members.status.active")}
                />

                {/* Zuletzt aktiv (echte Daten) */}
                <span className="typo-subline text-text-muted w-32 shrink-0 hidden sm:block">
                  {lastActive(m.last_seen_at, t)}
                </span>

                {/* Expliziter Knopf — macht die Klickbarkeit sichtbar (öffnet das Rechte-Panel). */}
                <button
                  type="button"
                  onClick={() => setDetailId(m.id)}
                  aria-label={t("settings.members.viewPermissions")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium text-text-body bg-app-surface hover:bg-app-bg border border-border transition-colors cursor-pointer shrink-0"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> {t("settings.members.viewPermissions")}
                </button>

                {/* Aktionen */}
                {canInvite && !isSelf && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={t("settings.members.actions")}
                        data-tip={t("settings.members.actions")}
                        className="w-8 h-8 rounded-[8px] text-text-muted hover:bg-app-bg hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setDetailId(m.id)}>
                        {t("settings.members.openDetail")}
                      </DropdownMenuItem>
                      {deactivated ? (
                        <DropdownMenuItem onSelect={() => setConfirm({ kind: "reactivate", member: m })}>
                          {t("settings.members.reactivate")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => setConfirm({ kind: "deactivate", member: m })}>
                          {t("settings.members.deactivate")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => setConfirm({ kind: "remove", member: m })}>
                        {t("settings.members.remove")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      </SettingsCard>

      {/* ── Offene Einladungen ── */}
      {invites.length > 0 && (
        <SettingsCard title={t("settings.members.invitesTitle")} description={t("settings.members.invitesDesc")}>
          <div className="border border-border rounded-[12px] overflow-hidden divide-y divide-[var(--border-card)]">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 p-3 bg-app-surface">
                <div className="flex-1 min-w-0">
                  <div className="typo-card-title text-text-primary truncate">{inv.email}</div>
                  <div className="typo-subline text-text-muted">
                    {roleLabel(inv.role)} · {t("settings.members.expires", { date: new Date(inv.expires_at).toLocaleDateString() })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void copyInviteLink(inv.token)}
                  aria-label={t("settings.members.invite.copyLink")}
                  data-tip={t("settings.members.invite.copyLink")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] text-[12px] font-medium text-text-body bg-app-bg hover:bg-app-surface border border-border transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {t("settings.members.invite.copyLink")}
                </button>
                {canInvite && (
                  <button
                    type="button"
                    onClick={() => revoke.mutate(inv.id)}
                    aria-label={t("settings.members.invite.revoke")}
                    data-tip={t("settings.members.invite.revoke")}
                    className="w-8 h-8 rounded-[8px] text-text-muted hover:bg-app-bg hover:text-signal-urgent flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="typo-subline text-text-muted">{t("settings.members.invite.noMailHint")}</p>
        </SettingsCard>
      )}

      {/* ── Offene Anfragen — bewusst leer („Folgt", approval_requests kommt mit Chat-C6) ── */}
      <SettingsCard title={t("settings.members.requestsTitle")} description={t("settings.members.requestsDesc")}>
        <div className="flex items-center gap-3 p-4 rounded-[12px] border border-dashed border-border text-text-muted">
          <Inbox className="w-5 h-5 shrink-0" />
          <span className="text-[13px]">{t("settings.members.requestsSoon")}</span>
        </div>
      </SettingsCard>

      {/* ── Einladen-Dialog ── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("settings.members.inviteTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="typo-field-label text-text-muted mb-1.5 block">{t("login.email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("login.emailPlaceholder")} />
            </div>
            <div>
              <label className="typo-field-label text-text-muted mb-1.5 block">{t("settings.team.roleLabel")}</label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INVITE_ROLES.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setInviteOpen(false)} className="sherloq-btn-secondary">
              {t("common.cancel")}
            </button>
            <button
              type="button"
              disabled={!email.trim() || invite.isPending}
              onClick={() => invite.mutate()}
              className="sherloq-btn-primary disabled:opacity-60"
            >
              {t("settings.members.inviteCta")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── EINE Bestätigung für alle ändernden Aktionen ── */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm && t(`settings.members.confirm.${confirm.kind}.title`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && t(`settings.members.confirm.${confirm.kind}.body`, {
                name: confirm.member.full_name || confirm.member.email,
                role: confirm.kind === "role" ? roleLabel(confirm.nextRole) : "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirm && act.mutate(confirm)}>
              {t("common.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Personen-Detail ── */}
      {detailId && (
        <MemberDetailPanel
          member={members.find((m) => m.id === detailId)!}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}
