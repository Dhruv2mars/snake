export type TermCaps = {
  colorDepth: number; // 1, 4, 8, 24
  unicode: boolean;
  platform: NodeJS.Platform;
  reducedMotion: boolean;
};

export function detectCaps(): TermCaps {
  const colorDepth = typeof (process.stdout as any)?.getColorDepth === 'function' ? (process.stdout as any).getColorDepth() : 1;
  const env = process.env;
  const unicode = env.SNAKE_ASCII === '1' ? false : (env.SNAKE_UNICODE === '1' ? true : (process.platform !== 'win32' && env.TERM !== 'linux'));
  const reducedMotion = process.env.SNAKE_REDUCED_MOTION === '1' || colorDepth <= 4;
  return { colorDepth, unicode, platform: process.platform, reducedMotion };
}
