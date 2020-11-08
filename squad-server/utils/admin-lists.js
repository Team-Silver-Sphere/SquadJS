import axios from 'axios';
import Logger from 'core/logger';

export default async function fetchAdminLists(adminLists) {
  const groups = {};
  const admins = {};

  for (let idx = 0; idx < adminLists.length; idx++) {
    const list = adminLists[idx];

    let data = '';

    if (list.type === 'remote') {
      try {
        const resp = await axios({
          method: 'GET',
          url: `${list.loc}`
        });
        data = resp.data;
      } catch (error) {
        Logger.verbose('SquadServer', 1, `Error fetching remote admin list ${list.loc}`, error);
      }
    }

    const groupRgx = /(?<=Group=)(.*?):(.*)(?=\n)/g;
    const adminRgx = /(?<=Admin=)(\d+):(\S+)(?=\s)/g;

    /* eslint-disable no-unused-vars */
    for (const [match, groupID, groupPerms] of data.matchAll(groupRgx)) {
      groups[`${idx}-${groupID}`] = groupPerms.split(',');
    }
    for (const [match, steamID, groupID] of data.matchAll(adminRgx)) {
      const perms = {};
      for (const perm of groups[`${idx}-${groupID}`]) perms[perm] = true;

      if (steamID in admins) admins[steamID] = Object.assign(admins[steamID], perms);
      else admins[steamID] = Object.assign(perms);

      Logger.verbose(
        'SquadServer',
        3,
        `Added Admin ${steamID} with ${Object.keys(admins[steamID])}`
      );
    }
    /* eslint-enable no-unused-vars */
  }
  Logger.verbose('SquadServer', 2, `${Object.keys(admins).length} admins loaded`);
  return admins;
}
