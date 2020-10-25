import axios from 'axios';

import { SQUADJS_VERSION, COPYRIGHT_MESSAGE } from './constants.js';

export default async function () {
  const { data } = await axios.get(
    'https://raw.githubusercontent.com/Thomas-Smyth/SquadJS/master/package.json'
  );

  const cMatch = SQUADJS_VERSION.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/).shift();
  const lMatch = data.version.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/).shift();

  const [cMajor, cMinor, cPatch] = cMatch;
  const [lMajor, lMinor, lPatch] = lMatch;

  const outdatedVersion =
    cMajor < lMajor ||
    (cMajor === lMajor && cMinor < lMinor) ||
    (cMajor === lMajor && cMinor === lMinor && cPatch < lPatch);

  console.log(
    `
   _____  ____  _    _         _____   \x1b[33m_\x1b[0m     
  / ____|/ __ \\| |  | |  /\\   |  __ \\ \x1b[33m(_)\x1b[0m    
 | (___ | |  | | |  | | /  \\  | |  | | \x1b[33m_ ___\x1b[0m 
  \\___ \\| |  | | |  | |/ /\\ \\ | |  | |\x1b[33m| / __|\x1b[0m
  ____) | |__| | |__| / ____ \\| |__| |\x1b[33m| \\__ \\\x1b[0m
 |_____/ \\___\\_\\\\____/_/    \\_\\_____\x1b[33m(_) |___/\x1b[0m
                                     \x1b[33m_/ |\x1b[0m    
                                    \x1b[33m|__/\x1b[0m     
${COPYRIGHT_MESSAGE}
GitHub: https://github.com/Thomas-Smyth/SquadJS

Latest Version: ${data.version}, Installed Version: ${SQUADJS_VERSION},
${
  outdatedVersion
    ? 'Your SquadJS version is outdated, please consider updating.'
    : 'Your SquadJS version is up to date.'
}
`
  );
}
