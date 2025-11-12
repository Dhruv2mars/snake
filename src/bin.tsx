#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import {Readable} from 'node:stream';
import {App} from './ui/app.js';

const isTty = Boolean(process.stdout.isTTY && process.stdin.isTTY);
const stdin = isTty ? process.stdin : (() => {
  const r = new Readable({read(){}}) as unknown as NodeJS.ReadStream;
  (r as any).isTTY = false;
  (r as any).setRawMode = () => {};
  return r;
})();

render(<App />, { stdin, stdout: process.stdout, stderr: process.stderr, exitOnCtrlC: false });

