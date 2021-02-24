import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQUADJS_VERSION = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
).version;

/* As set out by the terms of the license, the following should not be modified. */
const COPYRIGHT_MESSAGE = `Powered by SquadJS, Copyright © ${new Date().getFullYear()}`;

export { SQUADJS_VERSION, COPYRIGHT_MESSAGE };
