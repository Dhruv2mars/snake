export type Particle = {
  x: number; y: number;
  vx: number; vy: number;
  life: number; // frames remaining
  max: number;  // initial life to compute fade
  color: string;
  ch?: string;
};

export function spawnBurst(cx: number, cy: number, color: string, count=24): Particle[] {
  const ps: Particle[] = [];
  for (let i=0;i<count;i++){
    const angle = (Math.PI * 2) * (i / count) + (Math.random()*0.4-0.2);
    const speed = 0.3 + Math.random()*0.7;
    const life = 18 + (Math.random()*12)|0;
    ps.push({ x: cx, y: cy, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life, max: life, color, ch: '•' });
  }
  return ps;
}

export function stepParticles(ps: Particle[], w: number, h: number): Particle[] {
  const out: Particle[] = [];
  for (const p of ps) {
    const nx = p.x + p.vx;
    const ny = p.y + p.vy;
    const life = p.life - 1;
    if (life <= 0) continue;
    out.push({ ...p, x: nx, y: ny, life });
  }
  return out;
}
