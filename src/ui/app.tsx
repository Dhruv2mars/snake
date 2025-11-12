import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, useApp, useInput, useStdin, useStdout} from 'ink';
import * as Engine from '../engine/index.js';
import {Board, OverlayDot} from './board.js';
import {themes, pickTheme, Theme, brandGradient, pulse} from './theme.js';
import chalk from 'chalk';
import {Modal} from './modal.js';
import {detectCaps} from './term.js';
import {spawnBurst, stepParticles, Particle} from './particles.js';
import {lerpColorHex} from './theme.js';

type Screen = 'splash' | 'menu' | 'game';
type Overlay = 'none' | 'gameover' | 'pause' | 'settings';

export function App(){
  const [screen, setScreen] = useState<Screen>('splash');
  const caps = detectCaps();
  const [themeName, setThemeName] = useState<'auto'|'neutral'|'dark'|'light'|'high'|'mono'>('auto');
  const theme = pickTheme(themeName, caps);
  const unicode = caps.unicode && theme.unicodePreferred;
  return screen==='splash' ? <Splash onDone={() => setScreen('menu')} />
    : screen==='menu' ? <Menu onStart={() => setScreen('game')} theme={theme} />
    : <Game onExit={() => setScreen('menu')} theme={theme} unicode={unicode} themeName={themeName} setThemeName={setThemeName} reducedMotion={caps.reducedMotion} />;
}

function cycleTheme(curr: string, dir: 1|-1){
  const order = ['auto','neutral','dark','light','high','mono'];
  const i = Math.max(0, order.indexOf(curr));
  const ni = (i + (dir===1?1:-1) + order.length) % order.length;
  return order[ni] as any;
}

function Splash({onDone}:{onDone:()=>void}){
  const {stdout} = useStdout();
  const {isRawModeSupported} = useStdin();
  const [tick, setTick] = useState(0);
  const startedAt = useRef<number>(Date.now());
  const minShowMs = 750; // ensure it feels intentional
  const totalMs = 1500;  // full animation length
  useEffect(() => {
    const id = setInterval(() => setTick(t=>t+1), 80);
    const t = setTimeout(() => onDone(), totalMs);
    return () => { clearInterval(id); clearTimeout(t); };
  }, [onDone]);
  useInput((_, __) => {
    const elapsed = Date.now() - startedAt.current;
    if (elapsed >= minShowMs) onDone();
  }, { isActive: isRawModeSupported });

  const w = stdout?.columns ?? 80;
  const h = stdout?.rows ?? 24;
  const dots = '.'.repeat((tick % 4));
  const blockFrames = ['▉','▊','▋','▌','▍','▎'];
  const block = blockFrames[tick % blockFrames.length];
  const title = brandGradient(' S N A K E ');

  return (
    <Box width={w} height={h} alignItems="center" justifyContent="center" flexDirection="column">
      <Text>{chalk.cyan(block)}{chalk.cyanBright('█')} {title}</Text>
      <Text dimColor>{`loading${dots}`}</Text>
    </Box>
  );
}

function Menu({onStart, theme}:{onStart:()=>void; theme: Theme}){
  const {exit} = useApp();
  const {stdout} = useStdout();
  const w = stdout?.columns ?? 80;
  const h = stdout?.rows ?? 24;
  useInput((input, key) => {
    if (key.return) onStart();
    if (input.toLowerCase()==='q' || key.escape) exit();
  });
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(()=>setTick(t=>t+1),120); return ()=>clearInterval(id); }, []);
  const pointer = tick % 2 === 0 ? '›' : '»';
  return (
    <Box width={w} height={h} alignItems="center" justifyContent="center" flexDirection="column">
      <Text>{brandGradient('▣ Snake CLI')}</Text>
      <Text color={theme.muted}>The best-looking terminal game</Text>
      <Box height={1} />
      <Text>{pointer} Press Enter to Play</Text>
      <Text dimColor>Q to Quit</Text>
    </Box>
  );
}

function Game({onExit, theme, unicode, themeName, setThemeName, reducedMotion}:{onExit:()=>void; theme: Theme; unicode: boolean; themeName: string; setThemeName: React.Dispatch<React.SetStateAction<any>>; reducedMotion: boolean}){
  const {exit} = useApp();
  const {stdout} = useStdout();
  const {isRawModeSupported} = useStdin();
  const cols = stdout?.columns ?? 80;
  const rows = stdout?.rows ?? 24;
  const cellW = 2;
  const boardW = Math.max(24, Math.min(54, Math.floor((cols - 12) / cellW)));
  const boardH = Math.max(16, Math.min(28, rows - 8));

  const [state, setState] = useState(() => Engine.initEngine({ width: boardW, height: boardH, wrap: true, speed: 12 }));
  const [overlay, setOverlay] = useState<Overlay>('none');
  const lastScore = useRef<number>(0);
  const lastFood = useRef<{x:number;y:number} | null>(null);
  const [ripple, setRipple] = useState<{x:number;y:number;r:number;max:number;color:string}|null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [ambient, setAmbient] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [scorePulse, setScorePulse] = useState(0);
  const last = useRef<number>(Date.now());
  const running = useRef(true);

  useEffect(() => {
    running.current = true;
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(50, now - last.current);
      last.current = now;
      setState(s => ((overlay==='none') && s.alive) ? Engine.step(s, dt) : s);
      if (ripple) {
        setRipple(r => r ? ({...r, r: r.r + 0.75}) : r);
      }
      if (!reducedMotion) {
        setParticles(ps => stepParticles(ps, state.w, state.h));
        setAmbient(a => (a + 0.02) % 1);
      }
      setDisplayScore(s => (s < state.score ? Math.min(state.score, s + 1) : s));
      setScorePulse(p => Math.max(0, p - 1));
    }, 16); // ~60 FPS render cadence; engine may step multiple times
    return () => { running.current = false; clearInterval(id); };
  }, [overlay, ripple]);

  useInput((input, key) => {
    const lower = input.toLowerCase();
    if (key.escape || lower==='q') exit();
    if (lower==='p') { setOverlay(o => o==='pause' ? 'none' : 'pause'); return; }
    if (!state.alive) setOverlay('gameover');

    if (overlay==='gameover') {
      if (key.return) { setState(() => Engine.initEngine({ width: state.w, height: state.h, wrap: state.wrap, speed: 12 })); setDisplayScore(0); setOverlay('none'); }
      if (lower==='m') onExit();
      return;
    }

    if (overlay==='pause') {
      if (key.return || lower==='p') { setOverlay('none'); return; }
      if (lower==='r') { setState(() => Engine.initEngine({ width: state.w, height: state.h, wrap: state.wrap, speed: 12 })); setDisplayScore(0); setOverlay('none'); return; }
      if (lower==='m') { onExit(); return; }
      return;
    }

    if (overlay==='settings') {
      if (lower==='s' || key.escape) { setOverlay('none'); return; }
      if (lower==='w') { setState(s => ({...s, wrap: !s.wrap} as any)); return; }
      if (lower==='+') { setState(s => Engine.setSpeed(s, Math.min(20, Math.round(1000/s.stepMs)+2))); return; }
      if (lower==='-') { setState(s => Engine.setSpeed(s, Math.max(4, Math.round(1000/s.stepMs)-2))); return; }
      if (key.leftArrow || lower==='<') { setThemeName((n:string)=> cycleTheme(n,-1)); return; }
      if (key.rightArrow || lower==='>') { setThemeName((n:string)=> cycleTheme(n,1)); return; }
      return;
    }

    if (key.leftArrow) setState(s => Engine.handleInput(s, 'left'));
    else if (key.rightArrow) setState(s => Engine.handleInput(s, 'right'));
    else if (key.upArrow) setState(s => Engine.handleInput(s, 'up'));
    else if (key.downArrow) setState(s => Engine.handleInput(s, 'down'));
    else if (lower==='r') { setState(() => Engine.initEngine({ width: state.w, height: state.h, wrap: state.wrap, speed: 12 })); setDisplayScore(0); setOverlay('none'); }
    else if (lower==='s') { setOverlay('settings'); }
  }, { isActive: isRawModeSupported });

  const w = cols;
  const h = rows;

  // Spawn ripple when score increases
  if (state.score !== lastScore.current) {
    if (state.score > lastScore.current && lastFood.current) {
      const f = lastFood.current;
      setRipple({x:f.x, y:f.y, r:0, max:6, color:'#ffd166'});
      if (!reducedMotion) setParticles(ps => ps.concat(spawnBurst(f.x, f.y, '#ffd166', 18)));
      setScorePulse(10);
    }
    lastScore.current = state.score;
  }
  lastFood.current = state.food;

  const showGameOver = !state.alive || overlay==='gameover';
  const showPause = overlay==='pause';
  const showSettings = overlay==='settings';

  // Build overlay dots from ripple
  const overlayDots: OverlayDot[] = [];
  if (ripple) {
    if (ripple.r > ripple.max) {
      // let effect decay by removing it next pass
    } else {
      const R = Math.round(ripple.r);
      const c = ripple.color;
      for (let dx=-R; dx<=R; dx++){
        const dy = R - Math.abs(dx);
        overlayDots.push({x:ripple.x+dx,y:ripple.y+dy,color:c,ch:'•'});
        overlayDots.push({x:ripple.x+dx,y:ripple.y-dy,color:c,ch:'•'});
      }
    }
  }
  for (const p of particles) {
    const t = p.life / p.max; // 1..0
    const ch = t > 0.66 ? '•' : (t > 0.33 ? '·' : '.');
    const color = lerpColorHex(p.color, theme.muted, 1 - t);
    overlayDots.push({ x: Math.round(p.x), y: Math.round(p.y), color, ch });
  }

  return (
    <Box width={w} height={h} flexDirection="column">
      <Box height={1}>
        <Text color={theme.chrome}>▣ Snake</Text>
        <Text>  </Text>
        <Text color={scorePulse>0 ? theme.badgePlaying : undefined} dimColor={scorePulse<=0}>Score {displayScore}</Text>
        <Text>  </Text>
        <Text color={overlay==='pause' ? '#f59e0b' : '#94a3b8'}>⏯ P pause</Text>
        <Text>  </Text>
        <Text color="#94a3b8">⟲ R restart</Text>
        <Text>  </Text>
        <Text color="#94a3b8">⚙ S settings</Text>
        <Text>  </Text>
        <Text color="#94a3b8">⏻ Q quit</Text>
      </Box>
      <Box flexGrow={1} alignItems="center" justifyContent="center" position="relative">
        {(() => {
          const boxW = state.w * 2 + 4; // cellWidth*state.w + borders+padding
          const boxH = state.h + 2;     // rows + borders
          return (
            <>
              <Box borderStyle="round" borderColor={theme.muted} paddingX={1} paddingY={0}>
                <Board state={state} cellWidth={2} overlays={overlayDots} theme={theme} unicode={unicode} ambient={ambient} />
              </Box>

              {showGameOver && (
                <Box position="absolute" width={boxW} height={boxH} alignItems="center" justifyContent="center">
                  <Modal title={brandGradient('Game Over')} width={Math.min(56, boxW-4)} borderColor={theme.muted}>
                    <Text>Score {state.score}</Text>
                    <Text>Press Enter to play again</Text>
                    <Text>Press M for menu</Text>
                    <Text dimColor>Q to quit</Text>
                  </Modal>
                </Box>
              )}

              {showPause && (
                <Box position="absolute" width={boxW} height={boxH} alignItems="center" justifyContent="center">
                  <Modal title={brandGradient('Paused')} width={Math.min(56, boxW-4)} borderColor={theme.muted}>
                    <Text>Enter resume</Text>
                    <Text>R restart</Text>
                    <Text>M menu</Text>
                    <Text dimColor>Q quit</Text>
                  </Modal>
                </Box>
              )}
            </>
          );
        })()}
      </Box>

      {showSettings && (
        <Box position="absolute" width={w} height={h} alignItems="center" justifyContent="center">
          <Modal title={brandGradient('Settings')} width={56} borderColor={theme.muted}>
            <Text>Wrap: {state.wrap ? 'On' : 'Off'}  (W toggle)</Text>
            <Text>Speed: {(1000/state.stepMs).toFixed(0)} cps  (+ / -)</Text>
            <Text>Theme: {themeName}  ({'<' } / {'>' } to cycle)</Text>
            <Text>Close: S or Esc</Text>
          </Modal>
        </Box>
      )}
    </Box>
  );
}
