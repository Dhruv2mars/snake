import React, {useEffect, useRef, useState} from 'react';
import {Box, Text, useApp, useInput, useStdin, useStdout} from 'ink';
import * as Engine from '../engine/index.js';
import {Board} from './board.js';
import {colors, brandGradient, pulse} from './theme.js';

type Screen = 'splash' | 'menu' | 'game';
type Overlay = 'none' | 'gameover' | 'pause';

export function App(){
  const [screen, setScreen] = useState<Screen>('splash');
  useEffect(() => {
    const t = setTimeout(() => setScreen('menu'), 900);
    return () => clearTimeout(t);
  }, []);
  return screen==='splash' ? <Splash onDone={() => setScreen('menu')} />
    : screen==='menu' ? <Menu onStart={() => setScreen('game')} />
    : <Game onExit={() => setScreen('menu')} />;
}

function Splash({onDone}:{onDone:()=>void}){
  const {stdout} = useStdout();
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, [onDone]);
  const w = stdout?.columns ?? 80;
  const h = stdout?.rows ?? 24;
  return (
    <Box width={w} height={h} alignItems="center" justifyContent="center" flexDirection="column">
      <Text>{brandGradient('██ S N A K E')}</Text>
      <Text dimColor>{pulse('loading…')}</Text>
    </Box>
  );
}

function Menu({onStart}:{onStart:()=>void}){
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
      <Text color={colors.muted}>The best-looking terminal game</Text>
      <Box height={1} />
      <Text>{pointer} Press Enter to Play</Text>
      <Text dimColor>Q to Quit</Text>
    </Box>
  );
}

function Game({onExit}:{onExit:()=>void}){
  const {exit} = useApp();
  const {stdout} = useStdout();
  const {isRawModeSupported} = useStdin();

  const [state, setState] = useState(() => Engine.initEngine({ width: 36, height: 20, wrap: true, speed: 10 }));
  const [overlay, setOverlay] = useState<Overlay>('none');
  const last = useRef<number>(Date.now());
  const running = useRef(true);

  useEffect(() => {
    running.current = true;
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(50, now - last.current);
      last.current = now;
      setState(s => ((overlay==='none') && s.alive) ? Engine.step(s, dt) : s);
    }, 16); // ~60 FPS render cadence; engine may step multiple times
    return () => { running.current = false; clearInterval(id); };
  }, [overlay]);

  useInput((input, key) => {
    const lower = input.toLowerCase();
    if (key.escape || lower==='q') exit();
    if (!state.alive) setOverlay('gameover');

    if (overlay==='gameover') {
      if (key.return) { setState(() => Engine.initEngine({ width: state.w, height: state.h, wrap: state.wrap, speed: 10 })); setOverlay('none'); }
      if (lower==='m') onExit();
      return;
    }

    if (key.leftArrow) setState(s => Engine.handleInput(s, 'left'));
    else if (key.rightArrow) setState(s => Engine.handleInput(s, 'right'));
    else if (key.upArrow) setState(s => Engine.handleInput(s, 'up'));
    else if (key.downArrow) setState(s => Engine.handleInput(s, 'down'));
    else if (lower==='r') { setState(() => Engine.initEngine({ width: state.w, height: state.h, wrap: state.wrap, speed: 10 })); setOverlay('none'); }
  }, { isActive: isRawModeSupported });

  const w = stdout?.columns ?? 80;
  const h = stdout?.rows ?? 24;

  const showGameOver = !state.alive || overlay==='gameover';

  return (
    <Box width={w} height={h} flexDirection="column">
      <Box height={1}><Text color={colors.chrome}>▣ Snake</Text><Text> </Text><Text dimColor>Score {state.score} • {state.alive ? 'Playing' : 'Game Over'} (Enter restart, M menu, Q quit)</Text></Box>
      <Box flexGrow={1} alignItems="center" justifyContent="center">
        <Box borderStyle="round" borderColor={colors.muted} paddingX={1} paddingY={0}>
          <Board state={state} cellWidth={2} />
        </Box>
      </Box>

      {showGameOver && (
        <Box position="absolute" width={w} height={h} alignItems="center" justifyContent="center">
          <Box flexDirection="column" borderStyle="round" borderColor={colors.chrome} padding={1} width={40}>
            <Text>{brandGradient('Game Over')}</Text>
            <Text dimColor>Score {state.score}</Text>
            <Text>Press Enter to restart</Text>
            <Text>Press M for menu</Text>
            <Text dimColor>Q to quit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
