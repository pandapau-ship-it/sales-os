// @vitest-environment jsdom
/** HeatThresholdTile — farbige Heat-Kachel: Label/Status-Wort/Caption + editierbarer Tage-Chip bzw. read-only. */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { Flame } from "lucide-react";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
import HeatThresholdTile from "./HeatThresholdTile";

beforeAll(() => {
  const p = Element.prototype as unknown as Record<string, unknown>;
  p.hasPointerCapture ??= () => false; p.setPointerCapture ??= () => {}; p.releasePointerCapture ??= () => {};
  p.scrollIntoView ??= () => {};
});
afterEach(cleanup);

describe("HeatThresholdTile", () => {
  it("editierbare Stufe: Label/Status/Caption + Chip speichert über onSave", async () => {
    const onSave = vi.fn();
    render(
      <HeatThresholdTile color="var(--color-success)" label="ENGAGED" statusWord="Hochaktiv"
        icon={<Flame className="w-3.5 h-3.5" />} caption="Gilt als engaged bis"
        value={3} unit="Tage" min={1} max={6} canEdit ariaLabel="Gilt als engaged bis" onSave={onSave} />,
    );
    expect(screen.getByText("ENGAGED")).toBeTruthy();
    expect(screen.getByText("Hochaktiv")).toBeTruthy();
    expect(screen.getByText("Gilt als engaged bis")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Gilt als engaged bis" }));
    const input = await screen.findByRole("spinbutton");
    fireEvent.change(input, { target: { value: "4" } });
    fireEvent.click(screen.getByText("common.save"));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(4));
  });

  it("abgeleitete Stufe (Gone): read-only Text, kein Chip-Button", () => {
    render(
      <HeatThresholdTile color="var(--color-muted)" label="GONE" statusWord="Verloren"
        icon={<Flame className="w-3.5 h-3.5" />} caption="Automatisch nach" readOnlyText="> 31 Tagen" />,
    );
    expect(screen.getByText("> 31 Tagen")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
