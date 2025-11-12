import React, {useMemo} from 'react';
import {Text} from 'ink';
import chalk from 'chalk';
import type {EngineState, Direction} from '../engine/index.js';
import {lerpColorHex, Theme, themes} from './theme.js';

function nextOf(x:number,y:number,dir:Direction,w:number,h:number,wrap:boolean){
  let nx=x, ny=y; if(dir==='left') nx--; else if(dir==='right') nx++; else if(dir==='up') ny--; else ny++;
  if (wrap){ if(nx<0) nx=w-1; if(nx>=w) nx=0; if(ny<0) ny=h-1; if(ny>=h) ny=0; }
  return {x:nx,y:ny};
}

export type OverlayDot = { x:number; y:number; color:string; ch?:string };

export function Board({state, cellWidth=2, overlays=[], theme=themes.neutral, unicode=true}:{state: EngineState; cellWidth?: number; overlays?: OverlayDot[]; theme?: Theme; unicode?: boolean}){
  const {w, h, snake, food} = state;
  const alpha = state.timeAccMs / state.stepMs; // 0..1 time to next step

  const out = useMemo(() => {
    const gridDot = unicode ? '·' : '.';
    const dot = chalk.hex(theme.grid)(gridDot.repeat(cellWidth));
    const grid: string[][] = Array.from({length: h}, () => Array<string>(w).fill(dot));

    // Food (pulsing)
    const pulsePhase = (Math.sin(Date.now()/180) + 1) / 2;
    const foodColor = lerpColorHex('#ff8a80', theme.food, pulsePhase);
    const foodCh = unicode ? '●' : 'o';
    if (food.x>=0 && food.x<w && food.y>=0 && food.y<h) grid[food.y][food.x] = chalk.hex(foodColor)(foodCh.repeat(cellWidth));

    // Snake gradient head->tail with slight trail easing
    const len = snake.length;
    for (let i=0;i<len;i++){
      const seg = snake[i];
      if (seg.x<0||seg.x>=w||seg.y<0||seg.y>=h) continue;
      const t = i/(Math.max(1,len-1));
      const c = lerpColorHex(theme.snakeHead, theme.snakeTail, t);
      const block = !unicode ? '#' : (i===0 ? '█' : (i<4 ? '▓' : '█'));
      grid[seg.y][seg.x] = chalk.hex(c)(block.repeat(cellWidth));
    }

    // Effects overlays (particles/ripples)
    for (const p of overlays) {
      if (p.x>=0 && p.x<w && p.y>=0 && p.y<h) grid[p.y][p.x] = chalk.hex(p.color)((p.ch ?? '•').repeat(cellWidth));
    }

    // Head ghost toward next cell for smoother perception
    const head = snake[0];
    const n = nextOf(head.x, head.y, state.lastDir, w, h, state.wrap);
    const ghostStrength = Math.max(0, Math.min(1, (alpha-0.15)/0.85));
    if (ghostStrength>0) {
      const gc = lerpColorHex(theme.snakeHead, theme.snakeTail, 0.1);
      const ghostChar = !unicode ? '#' : (ghostStrength>0.66 ? '▓' : (ghostStrength>0.33 ? '▒' : '░'));
      grid[n.y][n.x] = chalk.hex(gc).dim(ghostChar.repeat(cellWidth));
    }

    return grid.map(row => row.join('')).join('\n');
  }, [w,h,snake,food,cellWidth,state.wrap,state.lastDir,state.timeAccMs,state.stepMs,overlays,theme,unicode]);

  return <Text>{out}</Text>;
}
