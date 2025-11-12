import chalk from 'chalk';
import type {TermCaps} from './term.js';

export type Theme = {
  name: string;
  chrome: string; muted: string; border: string;
  snakeHead: string; snakeTail: string; food: string; grid: string;
  badgePlaying: string; badgePaused: string; badgeOver: string;
  unicodePreferred: boolean;
};

export const themes: Record<string, Theme> = {
  neutral: {
    name: 'neutral',
    chrome: '#64748b', muted: '#94a3b8', border: '#cbd5e1',
    snakeHead: '#00e676', snakeTail: '#0ea5e9', food: '#ff6b6b', grid: '#22d3ee',
    badgePlaying: '#22c55e', badgePaused: '#f59e0b', badgeOver: '#ef4444',
    unicodePreferred: true,
  },
  dark: {
    name: 'dark',
    chrome: '#9aa4b2', muted: '#7c8aa0', border: '#3b4252',
    snakeHead: '#34d399', snakeTail: '#60a5fa', food: '#f87171', grid: '#7dd3fc',
    badgePlaying: '#22c55e', badgePaused: '#f59e0b', badgeOver: '#ef4444',
    unicodePreferred: true,
  },
  light: {
    name: 'light',
    chrome: '#4b5563', muted: '#6b7280', border: '#a1a1aa',
    snakeHead: '#059669', snakeTail: '#2563eb', food: '#dc2626', grid: '#22b8cf',
    badgePlaying: '#16a34a', badgePaused: '#b45309', badgeOver: '#b91c1c',
    unicodePreferred: true,
  },
  high: {
    name: 'high',
    chrome: '#ffffff', muted: '#d1d5db', border: '#9ca3af',
    snakeHead: '#00ff00', snakeTail: '#00aaff', food: '#ff0044', grid: '#00d5ff',
    badgePlaying: '#00ff00', badgePaused: '#ffaa00', badgeOver: '#ff0033',
    unicodePreferred: false,
  },
  mono: {
    name: 'mono',
    chrome: '#cccccc', muted: '#9e9e9e', border: '#8a8a8a',
    snakeHead: '#cccccc', snakeTail: '#aaaaaa', food: '#ffffff', grid: '#8a8a8a',
    badgePlaying: '#cccccc', badgePaused: '#cccccc', badgeOver: '#cccccc',
    unicodePreferred: false,
  },
};

export function pickTheme(name: string, caps: TermCaps): Theme {
  if (name !== 'auto') return themes[name] ?? themes.neutral;
  if (caps.colorDepth <= 4) return themes.mono;
  if (caps.colorDepth < 24) return themes.high;
  return themes.neutral; // safe bet across backgrounds
}

export function brandGradient(text: string): string {
  const palette = ['#22d3ee','#38bdf8','#60a5fa','#a78bfa','#f472b6','#f59e0b','#22c55e'];
  const chars = [...text];
  return chars.map((c,i)=>chalk.hex(palette[i%palette.length])(c)).join('');
}

export function lerpColorHex(aHex: string, bHex: string, t: number): string {
  function hexToRgb(h: string){ const n=parseInt(h.replace('#',''),16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  const A = hexToRgb(aHex), B = hexToRgb(bHex);
  const rr = Math.round(A.r + (B.r-A.r)*t);
  const gg = Math.round(A.g + (B.g-A.g)*t);
  const bb = Math.round(A.b + (B.b-A.b)*t);
  const s = (x:number)=>x.toString(16).padStart(2,'0');
  return `#${s(rr)}${s(gg)}${s(bb)}`;
}

export function pulse(text: string, t: number = Date.now()): string {
  const phase = (Math.sin(t/240) + 1) / 2; // 0..1
  const c = lerpColorHex('#94a3b8', '#e2e8f0', phase);
  return chalk.hex(c)(text);
}
