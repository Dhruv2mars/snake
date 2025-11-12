import chalk from 'chalk';

export const colors = {
  chrome: '#64748b',
  muted: '#94a3b8',
  snakeHead: '#00e676',
  snakeTail: '#0ea5e9',
  food: '#ff6b6b',
  grid: '#22d3ee',
};

export function brandGradient(text: string): string {
  const palette = ['#22d3ee','#38bdf8','#60a5fa','#a78bfa','#f472b6','#f59e0b','#22c55e'];
  const chars = [...text];
  return chars.map((c,i)=>chalk.hex(palette[i%palette.length])(c)).join('');
}

export function lerpColorHex(a: string, b: string, t: number): string {
  function hexToRgb(h: string){ const n=parseInt(h.replace('#',''),16); return {r:(n>>16)&255,g:(n>>8)&255,b:n&255}; }
  const A = hexToRgb(a), B = hexToRgb(b);
  const r = Math.round(A.r + (B.r-A.r)*t);
  const g = Math.round(A.g + (B.g-A.g)*t);
  const b = Math.round(A.b + (B.b-A.b)*t);
  const s = (x:number)=>x.toString(16).padStart(2,'0');
  return `#${s(r)}${s(g)}${s(b)}`;
}

export function pulse(text: string, t: number = Date.now()): string {
  const phase = (Math.sin(t/240) + 1) / 2; // 0..1
  const c = lerpColorHex('#94a3b8', '#e2e8f0', phase);
  return chalk.hex(c)(text);
}

