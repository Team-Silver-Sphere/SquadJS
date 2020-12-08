import axios from 'axios';

import { SQUADJS_VERSION, COPYRIGHT_MESSAGE } from './constants.js';

function versionOutOfDate(current, latest) {
  const cMatch = current.match(/([0-9]+)\.([0-9]+)\.([0-9]+)(?:-beta([0-9]*))?/);
  const lMatch = latest.match(/([0-9]+)\.([0-9]+)\.([0-9]+)(?:-beta([0-9]*))?/);

  cMatch.shift();
  lMatch.shift();

  const [cMajor, cMinor, cPatch, cBetaVersion] = cMatch;
  const [lMajor, lMinor, lPatch, lBetaVersion] = lMatch;

  return (
    cMajor < lMajor ||
    (cMajor === lMajor && cMinor < lMinor) ||
    (cMajor === lMajor && cMinor === lMinor && cPatch < lPatch) ||
    (cBetaVersion &&
      lBetaVersion &&
      cMajor === lMajor &&
      cMinor === lMinor &&
      cPatch === lPatch &&
      cBetaVersion < lBetaVersion)
  );
}

export default async function () {
  const { data: masterData } = await axios.get(
    `https://raw.githubusercontent.com/Thomas-Smyth/SquadJS/master/package.json`
  );

  const { data: betaData } = await axios.get(
    `https://raw.githubusercontent.com/Thomas-Smyth/SquadJS/beta/package.json`
  );

  const branch = SQUADJS_VERSION.includes('beta') ? 'beta' : 'master';
  const outdated =
    (branch === 'master' && versionOutOfDate(SQUADJS_VERSION, masterData.version)) ||
    (branch === 'beta' &&
      (versionOutOfDate(SQUADJS_VERSION, masterData.version) ||
        versionOutOfDate(SQUADJS_VERSION, betaData.version)));

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

Latest Version: ${
      branch === 'master' ? masterData.version : betaData.version
    }, Installed Version: ${SQUADJS_VERSION},
${
  outdated
    ? 'Your SquadJS version is outdated, please consider updating.'
    : 'Your SquadJS version is up to date.'
}
`
  );
}
