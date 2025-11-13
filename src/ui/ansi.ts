import chalkLib from 'chalk';
import {detectCaps} from './term.js';

const caps = detectCaps();
const chalk = new chalkLib.Instance({ level: caps.noColor ? 0 : 3 });

export function paint(hex: string, text: string): string {
  if (caps.noColor) return text;
  return chalk.hex(hex)(text);
}

export { chalk };

