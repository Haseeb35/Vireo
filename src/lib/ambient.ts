// Controls the page-wide ambient colour (--amb on <html>). Browser-only.
//
// "Base" is the colour of the featured film in the hero.
// "Preview" temporarily replaces it while a poster is hovered or focused.
// The colour fade itself is a CSS transition on the registered --amb property.

import { DEFAULT_AMB } from "./color";

let base = DEFAULT_AMB;
let previewing = false;

function apply(color: string) {
  document.documentElement.style.setProperty("--amb", color);
}

export function setBaseAmbient(color: string) {
  base = color;
  if (!previewing) apply(color);
}

export function previewAmbient(color: string) {
  previewing = true;
  apply(color);
}

export function endAmbientPreview() {
  previewing = false;
  apply(base);
}
