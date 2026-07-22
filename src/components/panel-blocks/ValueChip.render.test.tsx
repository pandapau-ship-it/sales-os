// @vitest-environment jsdom
/** ValueChip — geteilter editierbarer Wert-Chip: Hervorhebung, Popover-Editor, Min/Max, Töne. */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
import ValueChip from "./ValueChip";

beforeAll(() => {
  const p = Element.prototype as unknown as Record<string, unknown>;
  p.hasPointerCapture ??= () => false; p.setPointerCapture ??= () => {}; p.releasePointerCapture ??= () => {};
  p.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe("ValueChip", () => {
  it("editierbar → Button (per aria-label), zeigt Wert + Einheit", () => {
    render(<ValueChip value={3} unit="Tage" min={1} max={30} ariaLabel="Engaged bis" onSave={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Engaged bis" })).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("Tage")).toBeTruthy();
  });

  it("canEdit=false → statischer Chip, kein Button", () => {
    render(<ValueChip value={7} unit="%" min={0} max={100} canEdit={false} onSave={vi.fn()} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("7")).toBeTruthy();
  });

  it("Popover-Editor: gültiger Wert ruft onSave, außerhalb Bereich NICHT", async () => {
    const onSave = vi.fn();
    render(<ValueChip value={3} unit="Tage" min={1} max={6} ariaLabel="Engaged bis" onSave={onSave} />);
    fireEvent.click(screen.getByRole("button", { name: "Engaged bis" }));
    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "99" } }); // > max
    fireEvent.click(screen.getByText("common.save"));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.click(screen.getByText("common.save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(5));
  });

  it("leerer Wert → Platzhalter", () => {
    render(<ValueChip value={null} min={1} max={10} canEdit={false} placeholder="—" onSave={vi.fn()} />);
    expect(screen.getByText("—")).toBeTruthy();
  });
});
