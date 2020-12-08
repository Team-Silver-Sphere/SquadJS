import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios';
import Logger from 'core/logger';

const __dirname = fileURLToPath(import.meta.url);

export default async function fetchAdminLists(adminLists) {
  Logger.verbose('SquadServer', 2, `Fetching Admin Lists...`);

  const groups = {};
  const admins = {};

  for (let idx = 0; idx < adminLists.length; idx++) {
    const list = adminLists[idx];
    try {
      let data = '';

      switch (list.type) {
        case 'remote': {
          const resp = await axios({
            method: 'GET',
            url: `${list.source}`
          });
          data = resp.data;
          break;
        }
        case 'local': {
          const listPath = path.resolve(__dirname, '../../../', list.source);
          if (!fs.existsSync(listPath)) throw new Error(`Could not find Admin List at ${listPath}`);
          data = fs.readFileSync(listPath, 'utf8');
          break;
        }
        default:
          throw new Error(`Unsupported AdminList type:${list.type}`);
      }

      const groupRgx = /(?<=Group=)(.*?):(.*)(?=(?:\r\n|\r|\n))/g;
      const adminRgx = /(?<=Admin=)(\d+):(\S+)(?=\s)/g;

      /* eslint-disable no-unused-vars */
      for (const [match, groupID, groupPerms] of data.matchAll(groupRgx)) {
        groups[`${idx}-${groupID}`] = groupPerms.split(',');
      }
      for (const [match, steamID, groupID] of data.matchAll(adminRgx)) {
        const perms = {};
        for (const perm of groups[`${idx}-${groupID}`]) perms[perm] = true;

        if (steamID in admins) {
          admins[steamID] = Object.assign(admins[steamID], perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Merged duplicate Admin ${steamID} to ${Object.keys(admins[steamID])}`
          );
        } else {
          admins[steamID] = Object.assign(perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Added Admin ${steamID} with ${Object.keys(admins[steamID])}`
          );
        }
      }
      /* eslint-enable no-unused-vars */
    } catch (error) {
      Logger.verbose(
        'SquadServer',
        1,
        `Error fetching ${list.type} admin list: ${list.source}`,
        error
      );
    }
  }
  Logger.verbose('SquadServer', 1, `${Object.keys(admins).length} admins loaded...`);
  return admins;
}
