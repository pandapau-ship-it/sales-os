import confetti from "canvas-confetti";

/**
 * triggerConfetti — kurze Konfetti-Explosion von oben (~2s) als Won-Feedback.
 * Markenfarben Teal + Weiß + Gold. Nur bei „Deal gewonnen" aufrufen, nie bei Lost.
 * Canvas-Farben sind Pixelwerte (keine CSS-Tokens möglich) → bewusst als Hex hier zentralisiert.
 */
export function triggerConfetti(): void {
  const colors = ["#175253", "#ffffff", "#d4af37"];
  confetti({
    particleCount: 140,
    spread: 75,
    startVelocity: 42,
    origin: { x: 0.5, y: 0 }, // von oben (Bildschirmrand)
    colors,
    gravity: 1.1,
    ticks: 200, // ~2s bis die Partikel verschwinden
  });
}
