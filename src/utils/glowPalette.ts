function hexToRgb(hex: string) {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function mix(hex: string, target: string, amount: number) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(
    a.r + (b.r - a.r) * amount,
    a.g + (b.g - a.g) * amount,
    a.b + (b.b - a.b) * amount,
  );
}

function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * Derives the BorderGlow CSS custom properties from a single project accent
 * color: a brightened HSL for the edge-lit ring, and a 3-stop mesh (accent →
 * a lightened tint → the portfolio's steel highlight) for the border fill.
 */
export function buildGlowStyle(accent: string): Record<string, string> {
  const { h, s, l } = hexToHsl(accent);
  const ringH = h;
  const ringS = Math.min(s, 92);
  const ringL = Math.max(l, 64); // brighten so the ring reads against #16181A

  const opacities: [string, number][] = [
    ['', 100],
    ['-60', 60],
    ['-50', 50],
    ['-40', 40],
    ['-30', 30],
    ['-20', 20],
    ['-10', 10],
  ];
  const glowVars: Record<string, string> = {};
  for (const [key, op] of opacities) {
    glowVars[`--glow-color${key}`] = `hsl(${ringH}deg ${ringS}% ${ringL}% / ${op}%)`;
  }

  const colors = [accent, mix(accent, '#ffffff', 0.32), '#D7E2EA'];
  const positions = ['82% 18%', '12% 82%', '50% 45%'];
  const gradientKeys = ['one', 'two', 'three'];
  const gradVars: Record<string, string> = {};
  gradientKeys.forEach((key, i) => {
    gradVars[`--gradient-${key}`] = `radial-gradient(at ${positions[i]}, ${colors[i]} 0px, transparent 55%)`;
  });

  return { ...glowVars, ...gradVars };
}
