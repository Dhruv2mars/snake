import React, {useMemo} from 'react';
import {Text} from 'ink';
import type {EngineState} from '../engine/index.js';

export function Board({state, cellWidth=2}:{state: EngineState; cellWidth?: number}){
  const {w, h, snake, food, alive} = state;
  const out = useMemo(() => {
    const empty = '·'.repeat(cellWidth);
    const snakeCh = '█'.repeat(cellWidth);
    const foodCh = '●'.repeat(cellWidth);
    const grid: string[][] = Array.from({length: h}, () => Array<string>(w).fill(empty));
    for (const seg of snake) {
      if (seg.x>=0 && seg.x<w && seg.y>=0 && seg.y<h) grid[seg.y][seg.x] = snakeCh;
    }
    if (food.x>=0 && food.x<w && food.y>=0 && food.y<h) grid[food.y][food.x] = foodCh;
    const lines = grid.map(row => row.join(''));
    return lines.join('\n');
  }, [w,h,snake,food,cellWidth,alive]);

  return <Text color="#00c853">{out}</Text>;
}

