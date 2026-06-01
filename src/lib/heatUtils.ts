/**
 * Shared heat status color utility.
 * Single source of truth for all Heat badge styles — used by
 * ScreenHunting, ScreenFarming, CustomerDrawer, and any future component.
 *
 * All color values reference CSS tokens from index.css :root.
 * To change a color: update the token in index.css — never here.
 */

export interface HeatColorResult {
  bg:     string; // Tailwind bg class
  text:   string; // Tailwind text class
  border: string; // Tailwind border class
  dot:    string; // CSS color value for the ● dot (use in style={{ color }})
  label:  string; // German display label
}

export function getHeatColor(status: string): HeatColorResult {
  switch (status) {
    case 'HOT':
      return {
        bg:     'bg-[var(--signal-success-bg)]',
        text:   'text-signal-success',
        border: 'border-[var(--signal-success-text)]/15',
        dot:    'var(--signal-success-text)',
        label:  'Aktiv',
      };
    case 'WARM':
      return {
        bg:     'bg-[var(--signal-warm-bg)]',
        text:   'text-[var(--signal-warm-text)]',
        border: 'border-[var(--signal-warm-text)]/20',
        dot:    'var(--signal-warm-text)',
        label:  'Stabil',
      };
    case 'LUKEWARM':
      return {
        bg:     'bg-[var(--signal-warn-bg)]',
        text:   'text-signal-warn',
        border: 'border-[var(--signal-warn-text)]/15',
        dot:    'var(--signal-warn-text)',
        label:  'Rückläufig',
      };
    case 'COLD':
      return {
        bg:     'bg-[var(--signal-cold-bg)]',
        text:   'text-signal-cold',
        border: 'border-[var(--signal-cold-text)]/15',
        dot:    'var(--signal-cold-text)',
        label:  'Ruhend',
      };
    default:
      return {
        bg:     'bg-app-bg',
        text:   'text-text-muted',
        border: 'border-border',
        dot:    'var(--text-muted)',
        label:  'Inaktiv',
      };
  }
}
