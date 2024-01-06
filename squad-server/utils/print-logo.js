import axios from 'axios';

import { SQUADJS_VERSION, COPYRIGHT_MESSAGE } from './constants.js';

function versionOutOfDate(current, latest) {
  const cMatch = current.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/);
  const lMatch = latest.match(/([0-9]+)\.([0-9]+)\.([0-9]+)/);

  cMatch.shift();
  lMatch.shift();

  const [cMajor, cMinor, cPatch] = cMatch;
  const [lMajor, lMinor, lPatch] = lMatch;

  return (
    cMajor < lMajor ||
    (cMajor === lMajor && cMinor < lMinor) ||
    (cMajor === lMajor && cMinor === lMinor && cPatch < lPatch)
  );
}

export default async function () {
  const { data } = await axios.get(
    `https://raw.githubusercontent.com/Team-Silver-Sphere/SquadJS/master/package.json`
  );
  const outdated = versionOutOfDate(SQUADJS_VERSION, data.version);

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
GitHub: https://github.com/Team-Silver-Sphere/SquadJS

Latest Version: ${outdated ? '\x1b[31m' : '\x1b[32m'}${
      data.version
    }\x1b[0m, Installed Version: \x1b[32m${SQUADJS_VERSION}\x1b[0m
${
  outdated
    ? '\x1b[31mYour SquadJS version is outdated, please consider updating.'
    : '\x1b[32mYour SquadJS version is up to date.'
}\x1b[0m

\x1b[33mLooking for ways to help protect your server from harmful players?
Checkout the Squad Community Ban List: https://communitybanlist.com/\x1b[0m
`
  );
}
