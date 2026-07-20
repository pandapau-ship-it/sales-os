/**
 * panel-blocks — Barrel-Export aller wiederverwendbaren Inhalts-Blöcke.
 * Import gebündelt: `import { HeatBadge, DetailField } from '@/components/panel-blocks'`.
 * Neuer panel-block → hier eintragen (Default- bzw. Named-Export beachten).
 */

// ── Default-Exports ────────────────────────────────────────────────────────
export { default as ActionComposer } from './ActionComposer';
export { default as ActionFooter } from './ActionFooter';
export { default as ActiveSequenceChain } from './ActiveSequenceChain';
export { default as AktiveSignale } from './AktiveSignale';
export { default as AktivitaetsVerlauf } from './AktivitaetsVerlauf';
export { default as DealSetup } from './DealSetup';
export { default as DetailField } from './DetailField';
export { default as DetailPhoneList } from './DetailPhoneList';
export { default as DetailSection } from './DetailSection';
export { default as ExpandedCardContent } from './ExpandedCardContent';
export { default as FarmerExpandedCardContent } from './FarmerExpandedCardContent';
export { default as EditableInline } from './EditableInline';
export { default as ErledigtAction } from './ErledigtAction';
export { default as HeatBadge } from './HeatBadge';
export { default as HunterCard } from './HunterCard';
export { default as KiKurzakte } from './KiKurzakte';
export { default as KiKurzaktePlaceholder } from './KiKurzaktePlaceholder';
export { default as KommunikationKompakt } from './KommunikationKompakt';
export { default as KommunikationPreview } from './KommunikationPreview';
export { default as KommunikationVerlauf } from './KommunikationVerlauf';
export { default as KnowledgeField } from './KnowledgeField';
export { default as KpiCard } from './KpiCard';
export { default as LeadListRow } from './LeadListRow';
export { default as MfaBanner } from './MfaBanner';
export { default as TaskAnlegenForm } from './TaskAnlegenForm';
export { default as TaskEntwurfForm } from './TaskEntwurfForm';
export { default as TaskFormular } from './TaskFormular';
export type { TaskFormInitial } from './TaskFormular';
export { default as DealsListe } from './DealsListe';
export { default as DealKurzinfo } from './DealKurzinfo';
export type { DealCardAction } from './DealKurzinfo';
export { default as MailComposer } from './MailComposer';
export { default as KontaktZeile } from './KontaktZeile';
export { default as NewDealCard } from './NewDealCard';
export { default as NewInPipelineCards } from './NewInPipelineCards';
export { default as NotizenListe } from './NotizenListe';
export { default as OffeneTasks } from './OffeneTasks';
export { default as PanelField } from './PanelField';
export { default as PanelFooter } from './PanelFooter';
export { default as PanelHeader } from './PanelHeader';
export { default as PanelSkeleton } from './PanelSkeleton';
export { default as PanelTabs } from './PanelTabs';
export { default as SettingsCard } from './SettingsCard';
export type { SaveState } from './SettingsCard';
export { default as PhoneField } from './PhoneField';
export { default as PhoneNumbersField } from './PhoneNumbersField';
export { default as SignalRow } from './SignalRow';
export { default as StageBadge } from './StageBadge';
export { default as StagnationHint } from './StagnationHint';
export { default as StatusBadge } from './StatusBadge';
export { default as SubscriptionBox } from './SubscriptionBox';
export { default as TasksListe } from './TasksListe';
export { default as UsageBox } from './UsageBox';

// ── Named-Exports ──────────────────────────────────────────────────────────
export { FollowUpKaltCard } from './FollowUpKaltCard';
export { LinkedinSignalCard } from './LinkedinSignalCard';
export { PersonalityBadge } from './PersonalityBadge';
export { PipelineKeineTaskCard } from './PipelineKeineTaskCard';
export { PipelineStagniertCard } from './PipelineStagniertCard';
export { SequenceLeadCards } from './SequenceLeadCards';

// ── Typen ──────────────────────────────────────────────────────────────────
export type { DetailFieldProps } from './DetailField';
export type { DetailSectionProps } from './DetailSection';
export type { PhoneEntry } from './DetailPhoneList';
export type { Phone } from './PhoneField';
export type { PhoneRow } from './PhoneNumbersField';
export type { DealDraft } from './NewDealCard';
export type { HunterCardData } from './HunterCard';
export type { SubscriptionData } from './SubscriptionBox';
export type { UsageData } from './UsageBox';
export type { SignalRowData } from './SignalRow';
export { default as LeadSourceBadge } from './LeadSourceBadge';
export { default as RoutingChip } from './RoutingChip';
export { default as CompactContactRow } from './CompactContactRow';
export type { CompactContactRowProps } from './CompactContactRow';
