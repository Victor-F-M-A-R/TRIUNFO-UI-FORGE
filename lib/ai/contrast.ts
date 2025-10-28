// lib/ai/contrast.ts

/**
 * Converte cor hex para RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calcula luminância relativa
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calcula contraste entre duas cores
 */
export function calculateContrast(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Verifica se passa no WCAG AA (4.5:1 para texto normal)
 */
export function passesWCAG_AA(ratio: number): boolean {
  return ratio >= 4.5;
}

/**
 * Verifica se passa no WCAG AAA (7:1 para texto normal)
 */
export function passesWCAG_AAA(ratio: number): boolean {
  return ratio >= 7;
}

/**
 * Extrai cores do elemento DOM
 */
export function getColorsFromElement(element: HTMLElement): {
  textColor: string;
  bgColor: string;
} {
  const computed = window.getComputedStyle(element);
  const textColor = rgbToHex(computed.color);
  const bgColor = rgbToHex(computed.backgroundColor);

  return { textColor, bgColor };
}

/**
 * Converte rgb(r, g, b) para hex
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g);
  if (!match) return "#000000";

  const [r, g, b] = match.map(Number);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
