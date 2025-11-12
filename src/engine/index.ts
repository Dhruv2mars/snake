export type Vec = { x: number; y: number };
export type Direction = 'up' | 'down' | 'left' | 'right';

export type EngineConfig = {
  width: number;
  height: number;
  wrap: boolean;
  speed: number; // cells per second
  seed?: number;
};

export type EngineState = {
  w: number;
  h: number;
  wrap: boolean;
  snake: Vec[]; // head first
  dir: Direction;
  pendingDir: Direction | null;
  food: Vec;
  score: number;
  alive: boolean;
  timeAccMs: number;
  stepMs: number;
  rng: () => number;
};

export function initEngine(cfg: EngineConfig): EngineState {
  const rng = mulberry32(cfg.seed ?? Date.now());
  const mid: Vec = { x: ((cfg.width / 2) | 0), y: ((cfg.height / 2) | 0) };
  const snake = [mid, { x: mid.x - 1, y: mid.y }, { x: mid.x - 2, y: mid.y }];
  const st: EngineState = {
    w: cfg.width,
    h: cfg.height,
    wrap: cfg.wrap,
    snake,
    dir: 'right',
    pendingDir: null,
    food: { x: 0, y: 0 },
    score: 0,
    alive: true,
    timeAccMs: 0,
    stepMs: Math.max(20, 1000 / Math.max(1, cfg.speed)),
    rng,
  };
  st.food = spawnFood(st);
  return st;
}

export function handleInput(st: EngineState, d: Direction): EngineState {
  if (!st.alive) return st;
  if (isOpposite(st.dir, d)) return st;
  // If we already changed dir this tick, queue one
  return { ...st, pendingDir: st.pendingDir ?? d };
}

export function step(st: EngineState, dtMs: number): EngineState {
  if (!st.alive) return st;
  let s = st;
  let acc = s.timeAccMs + dtMs;
  while (acc >= s.stepMs) {
    acc -= s.stepMs;
    s = tickOnce(s);
    if (!s.alive) break;
  }
  return { ...s, timeAccMs: acc };
}

export function setSpeed(st: EngineState, cellsPerSec: number): EngineState {
  return { ...st, stepMs: Math.max(20, 1000 / Math.max(1, cellsPerSec)) };
}

function tickOnce(st: EngineState): EngineState {
  const dir = st.pendingDir ?? st.dir;
  const head = st.snake[0];
  const nh = nextHead(head, dir, st.w, st.h, st.wrap);
  // self collision
  if (!st.wrap && (nh.x < 0 || nh.x >= st.w || nh.y < 0 || nh.y >= st.h)) {
    return { ...st, alive: false };
  }
  if (st.wrap) {
    if (nh.x < 0) nh.x = st.w - 1;
    if (nh.x >= st.w) nh.x = 0;
    if (nh.y < 0) nh.y = st.h - 1;
    if (nh.y >= st.h) nh.y = 0;
  }
  if (hitsSnake(st.snake, nh)) {
    return { ...st, alive: false };
  }
  const ate = (nh.x === st.food.x && nh.y === st.food.y);
  const body = [nh, ...st.snake];
  if (!ate) body.pop();
  const nextFood = ate ? spawnFood({ ...st, snake: body }) : st.food;
  return {
    ...st,
    snake: body,
    dir,
    pendingDir: null,
    food: nextFood,
    score: ate ? st.score + 1 : st.score,
  };
}

function nextHead(h: Vec, d: Direction, w: number, hgt: number, wrap: boolean): Vec {
  const v = { x: h.x, y: h.y };
  if (d === 'left') v.x -= 1;
  else if (d === 'right') v.x += 1;
  else if (d === 'up') v.y -= 1;
  else if (d === 'down') v.y += 1;
  if (!wrap) return v;
  // wrap is handled in tickOnce bounds; keep here untouched
  return v;
}

function spawnFood(st: EngineState): Vec {
  // Find random empty cell with a bounded number of tries; fallback to scan
  for (let i = 0; i < 100; i++) {
    const x = (st.rng() * st.w) | 0;
    const y = (st.rng() * st.h) | 0;
    if (!hitsSnake(st.snake, { x, y })) return { x, y };
  }
  for (let y = 0; y < st.h; y++) for (let x = 0; x < st.w; x++) {
    if (!hitsSnake(st.snake, { x, y })) return { x, y };
  }
  return { x: 0, y: 0 }; // board full — arbitrary
}

function hitsSnake(snake: Vec[], p: Vec): boolean {
  return snake.some(seg => seg.x === p.x && seg.y === p.y);
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (a === 'left' && b === 'right') || (a === 'right' && b === 'left') || (a === 'up' && b === 'down') || (a === 'down' && b === 'up');
}

// Small deterministic RNG
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

