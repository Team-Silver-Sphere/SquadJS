import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SQUADJS_VERSION = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8')
).version;

/* As set out by the terms of the license, the following should not be modified. */
const COPYRIGHT_MESSAGE = 'Powered by SquadJS, Copyright © 2020';

const SQUADJS_API = 'https://squadjs.thomas-smyth.uk';

const CHATS_ADMINCHAT = 'ChatAdmin';

export { SQUADJS_VERSION, COPYRIGHT_MESSAGE, SQUADJS_API, CHATS_ADMINCHAT };
