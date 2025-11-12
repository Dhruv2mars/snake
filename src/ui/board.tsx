import React, {useMemo, useRef} from 'react';
import {Text} from 'ink';
import chalk from 'chalk';
import type {EngineState, Direction} from '../engine/index.js';
import {colors, lerpColorHex} from './theme.js';

function nextOf(x:number,y:number,dir:Direction,w:number,h:number,wrap:boolean){
  let nx=x, ny=y; if(dir==='left') nx--; else if(dir==='right') nx++; else if(dir==='up') ny--; else ny++;
  if (wrap){ if(nx<0) nx=w-1; if(nx>=w) nx=0; if(ny<0) ny=h-1; if(ny>=h) ny=0; }
  return {x:nx,y:ny};
}

export function Board({state, cellWidth=2}:{state: EngineState; cellWidth?: number}){
  const {w, h, snake, food} = state;
  const alpha = state.timeAccMs / state.stepMs; // 0..1 time to next step

  const out = useMemo(() => {
    const dot = chalk.hex(colors.grid)('·'.repeat(cellWidth));
    const grid: string[][] = Array.from({length: h}, () => Array<string>(w).fill(dot));

    // Food (pulsing)
    const pulsePhase = (Math.sin(Date.now()/180) + 1) / 2;
    const foodColor = lerpColorHex('#ff8a80', colors.food, pulsePhase);
    if (food.x>=0 && food.x<w && food.y>=0 && food.y<h) grid[food.y][food.x] = chalk.hex(foodColor)('●'.repeat(cellWidth));

    // Snake gradient head->tail
    const len = snake.length;
    for (let i=0;i<len;i++){
      const seg = snake[i];
      if (seg.x<0||seg.x>=w||seg.y<0||seg.y>=h) continue;
      const t = i/(Math.max(1,len-1));
      const c = lerpColorHex(colors.snakeHead, colors.snakeTail, t);
      grid[seg.y][seg.x] = chalk.hex(c)('█'.repeat(cellWidth));
    }

    // Head ghost toward next cell for smoother perception
    const head = snake[0];
    const n = nextOf(head.x, head.y, state.lastDir, w, h, state.wrap);
    const ghost = chalk.hex(lerpColorHex(colors.snakeHead, colors.snakeTail, 0.15)).dim('█'.repeat(cellWidth));
    if (alpha>0.15) grid[n.y][n.x] = ghost;

    return grid.map(row => row.join('')).join('\n');
  }, [w,h,snake,food,cellWidth,state.wrap,state.lastDir,state.timeAccMs,state.stepMs]);

  return <Text>{out}</Text>;
}
