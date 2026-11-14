// Picks a vivid, glow-friendly colour from an image. Browser-only.
//
// We load a 64px thumbnail through Next's own image optimiser, which is
// same-origin, so the canvas can read its pixels without CORS problems.

export const DEFAULT_AMB = "#5f7fa8";

const cache = new Map<string, Promise<string>>();

export function extractColor(src: string): Promise<string> {
  let hit = cache.get(src);
  if (!hit) {
    hit = load(src).catch(() => DEFAULT_AMB);
    cache.set(src, hit);
  }
  return hit;
}

function load(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(dominant(img));
    img.onerror = reject;
    img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
  });
}

function dominant(img: HTMLImageElement): string {
  const w = 24;
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return DEFAULT_AMB;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Group pixels into 24 hue buckets, weighting colourful mid-tones highest.
  const buckets = Array.from({ length: 24 }, () => ({ score: 0, r: 0, g: 0, b: 0 }));
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const [hue, s, l] = rgbToHsl(r, g, b);
    if (l < 0.1 || l > 0.92 || s < 0.15) continue;
    const weight = s * (1 - Math.abs(l - 0.5) * 1.4);
    const bucket = buckets[Math.floor(hue * 24) % 24];
    bucket.score += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
  }

  const best = buckets.reduce((a, b) => (b.score > a.score ? b : a));
  if (best.score < 0.5) return DEFAULT_AMB; // nearly greyscale image

  const [hue, s, l] = rgbToHsl(best.r / best.score, best.g / best.score, best.b / best.score);
  // Normalise so every film glows with similar strength.
  return hslToHex(hue, Math.min(0.85, Math.max(0.5, s)), Math.min(0.62, Math.max(0.5, l)));
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
