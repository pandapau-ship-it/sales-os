/**
 * components — zentrale Library. Import IMMER über `@/components` (nie tiefer als nötig):
 *   import { HunterCard, DetailField, HunterSidepanel } from '@/components';
 *
 * Re-exportiert: panel-blocks/ (Inhalts-Blöcke, via eigenem Barrel) · panels/ (Shells) ·
 * features/hunter/ (Kompositionen) · shared/ (Atome). `ui/` (shadcn) bleibt bewusst außen
 * vor — wird weiterhin direkt aus `@/components/ui/*` importiert.
 */

// ── panel-blocks (eigenes Barrel kuratiert Default- + Named-Exports) ─────────
export * from './panel-blocks';

// ── panels/ (Panel-Shells) ──────────────────────────────────────────────────
export { default as ActionPanel } from './panels/ActionPanel';
export { default as InfoPanel } from './panels/InfoPanel';

// ── features/hunter/ (Modul-Kompositionen) ──────────────────────────────────
export { default as AddSdrLeadPanel } from './features/hunter/AddSdrLeadPanel';
export { default as ChatActionPanel } from './features/hunter/ChatActionPanel';
export * from './features/hunter/ChatActionPanel';
export { default as ContactColdDrawer } from './features/hunter/ContactColdDrawer';
export * from './features/hunter/ContactColdDrawer';
export { default as DealCloseModal } from './features/hunter/DealCloseModal';
export { default as DealLostModal } from './features/hunter/DealLostModal';
export { default as DealWonModal } from './features/hunter/DealWonModal';
export { default as FunnelAnalysis } from './features/hunter/FunnelAnalysis';
export { default as HunterSidepanel } from './features/hunter/HunterSidepanel';
export { default as KommunikationLogModal } from './features/hunter/KommunikationLogModal';
export { default as NoTaskDrawer } from './features/hunter/NoTaskDrawer';
export * from './features/hunter/NoTaskDrawer';
export { default as PipelineStagnatedDrawer } from './features/hunter/PipelineStagnatedDrawer';
export type { StagnatedPerson } from './features/hunter/PipelineStagnatedDrawer';
export { default as SignalActionDrawer } from './features/hunter/SignalActionDrawer';
export * from './features/hunter/SignalActionDrawer';
export { default as TaskDrawer } from './features/hunter/TaskDrawer';

// ── features/farmer/ ────────────────────────────────────────────────────────
export { default as FarmerSidepanel } from './features/farmer/FarmerSidepanel';
export type { FarmerTab } from './features/farmer/FarmerSidepanel';
export { default as FarmerActionDrawer } from './features/farmer/FarmerActionDrawer';
export type { FarmerActionData, FarmerSignalKind, FarmerActionType } from './features/farmer/FarmerActionDrawer';

// ── features/companies/ ─────────────────────────────────────────────────────
export { default as CompanyAnlegenPanel } from './features/companies/CompanyAnlegenPanel';

// ── features/kontakte/ ──────────────────────────────────────────────────────
export { default as KontaktAnlegenPanel } from './features/kontakte/KontaktAnlegenPanel';
export { default as ZuListeDialog } from './features/kontakte/ZuListeDialog';
export { default as NeueListeDialog } from './features/kontakte/NeueListeDialog';

// ── features/settings/ ──────────────────────────────────────────────────────
export { default as TeamSettings } from './features/settings/TeamSettings';

// ── farming/ (Farmer-Screen-Hilfskomponenten, analog shared/) ────────────────
export { default as FarmerKpiCards } from './farming/FarmerKpiCards';
export { default as FarmerHealthOverview } from './farming/FarmerHealthOverview';
export { default as FarmerKundenKachel } from './farming/FarmerKundenKachel';
export { default as FarmerRetentionKachel } from './farming/FarmerRetentionKachel';
export type { RetentionItem } from './farming/FarmerRetentionKachel';
export { default as FarmerUpsellKachel } from './farming/FarmerUpsellKachel';
export type { UpsellItem } from './farming/FarmerUpsellKachel';
export { default as SubscriptionBadge } from './farming/SubscriptionBadge';

// ── shared/ (Atome) ─────────────────────────────────────────────────────────
export { default as Avatar } from './shared/Avatar';
export { default as Badge } from './shared/Badge';
export * from './shared/Badge';
export * from './shared/BrandIcons';
export { default as BrandLogo } from './shared/BrandLogo';
export * from './shared/BrandLogo';
export { default as CommandPalette } from './shared/CommandPalette';
export { default as CommunicationChain } from './shared/CommunicationChain';
export { default as CustomerDrawer } from './shared/CustomerDrawer';
export { default as EmptyState } from './shared/EmptyState';
export { default as DataTableCard } from './shared/DataTableCard';
export type { DataTableCardProps } from './shared/DataTableCard';
export { default as ColumnConfigPopover } from './shared/ColumnConfigPopover';
export * from './shared/ICPDonut';
export { default as LinkedinIcon } from './shared/LinkedinIcon';
export * from './shared/Toast';
export { default as TooltipLayer } from './shared/TooltipLayer';
