export type TermCaps = {
  colorDepth: number; // 1, 4, 8, 24
  unicode: boolean;
  platform: NodeJS.Platform;
  reducedMotion: boolean;
  noColor: boolean;
  ascii: boolean;
  simpleBorders: boolean;
};

function hasFlag(name: string): boolean {
  return (process.argv || []).some(a => a === `--${name}`);
}

export function detectCaps(): TermCaps {
  const colorDepth = typeof (process.stdout as any)?.getColorDepth === 'function' ? (process.stdout as any).getColorDepth() : 1;
  const env = process.env;
  const asciiFlag = hasFlag('ascii') || env.SNAKE_ASCII === '1';
  const unicodeEnv = env.SNAKE_UNICODE === '1' ? true : (process.platform !== 'win32' && env.TERM !== 'linux');
  const unicode = asciiFlag ? false : unicodeEnv;
  const reducedMotion = process.env.SNAKE_REDUCED_MOTION === '1' || colorDepth <= 4;
  const noColor = hasFlag('no-color') || env.LIT_NO_COLOR === '1' || typeof env.NO_COLOR !== 'undefined' || colorDepth <= 1;
  const simpleBorders = hasFlag('simple-borders') || asciiFlag || !unicode;
  return { colorDepth, unicode, platform: process.platform, reducedMotion, noColor, ascii: asciiFlag, simpleBorders };
}
