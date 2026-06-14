import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

// Schwebendes Panel, anker-basiert — KEIN Overlay/Scrim (Hintergrund bleibt sichtbar,
// wird nicht abgedunkelt/verschwommen). Farben/Schatten/Radius über Design-Tokens.
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & { portal?: boolean }
>(({ className, align = "center", sideOffset = 6, portal = true, ...props }, ref) => {
  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        // pointer-events-auto: bei Portal-Render liegt der Popover außerhalb des modalen Sheets,
        // das body auf pointer-events:none setzt — ohne dies werden Klicks im Popover geschluckt.
        "pointer-events-auto z-[130] w-72 rounded-[12px] border border-border bg-app-surface p-4 text-text-primary shadow-[var(--shadow-dropdown)] outline-none",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    />
  );
  // portal={false}: Inhalt bleibt im DOM/Fokus-Scope des Eltern-Sheets → Textareas/Inputs
  // behalten den Fokus (sonst zieht die Radix-Dialog-Fokusfalle den Fokus zurück → kein Tippen).
  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content;
})
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
