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
export { default as FunnelAnalysis } from './features/hunter/FunnelAnalysis';
export { default as HunterSidepanel } from './features/hunter/HunterSidepanel';
export { default as NoTaskDrawer } from './features/hunter/NoTaskDrawer';
export * from './features/hunter/NoTaskDrawer';
export { default as PipelineStagnatedDrawer } from './features/hunter/PipelineStagnatedDrawer';
export { default as SignalActionDrawer } from './features/hunter/SignalActionDrawer';
export * from './features/hunter/SignalActionDrawer';
export { default as TaskDrawer } from './features/hunter/TaskDrawer';

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
export * from './shared/ICPDonut';
export { default as LinkedinIcon } from './shared/LinkedinIcon';
export * from './shared/Toast';
export { default as TooltipLayer } from './shared/TooltipLayer';
