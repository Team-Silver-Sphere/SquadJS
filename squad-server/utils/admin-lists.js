import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client as FTPClient } from 'basic-ftp';
import WritableBuffer from './writable-buffer.js';

import axios from 'axios';
import Logger from 'core/logger';

const __dirname = fileURLToPath(import.meta.url);

// Replaces the password in a list address (ftp://user:password@host/...) with ***, so it is not logged.
function withoutPassword(source) {
  try {
    const url = new URL(source);
    if (url.password) {
      url.password = '***';
      return url.toString();
    }
  } catch {
    // Not a valid URL; the pattern below still applies.
  }
  // An address without a parsed password, for example an FTP address without "ftp://".
  return source.replace(/^([^:/@\s]+):[^@\s]+@/, '$1:***@');
}

export default async function fetchAdminLists(adminLists) {
  Logger.verbose('SquadServer', 1, `Fetching Admin Lists...`);

  const groups = {};
  const admins = {};

  for (const [idx, list] of adminLists.entries()) {
    const shownSource = withoutPassword(list.source);
    let data = '';
    try {
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
        case 'ftp': {
          // ex url: ftp//<user>:<password>@<host>:<port>/<url-path>
          if (!list.source.startsWith('ftp://')) {
            throw new Error(
              `Invalid FTP URI format of ${list.source}. The source must be a FTP URI starting with the protocol. Ex: ftp://username:password@host:21/some/file.txt`
            );
          }
          const [loginString, hostPathString] = list.source.substring('ftp://'.length).split('@');
          const [user, password] = loginString.split(':').map((v) => decodeURI(v));
          const pathStartIndex = hostPathString.indexOf('/');
          const remoteFilePath =
            pathStartIndex === -1 ? '/' : hostPathString.substring(pathStartIndex);
          const [host, port = 21] = hostPathString
            .substring(0, pathStartIndex === -1 ? hostPathString.length : pathStartIndex)
            .split(':');

          const buffer = new WritableBuffer();
          const ftpClient = new FTPClient();
          try {
            await ftpClient.access({ host, port, user, password });
            await ftpClient.downloadTo(buffer, remoteFilePath);
          } finally {
            // Without close(), every fetch leaves one FTP connection open.
            ftpClient.close();
          }
          data = buffer.toString('utf8');
          break;
        }
        default:
          throw new Error(`Unsupported AdminList type:${list.type}`);
      }
    } catch (error) {
      // Only the message is logged: request errors contain the full address, including a password.
      const reason = String(error?.message ?? error)
        .split(list.source)
        .join(shownSource);
      Logger.verbose(
        'SquadServer',
        1,
        `Error fetching ${list.type} admin list: ${shownSource}: ${reason}`
      );
    }

    const groupRgx = /(?<=^Group=)(?<groupID>.*?):(?<groupPerms>.*?)(?=(?:\r\n|\r|\n|\s+\/\/))/gm;
    const adminRgx = /(?<=^Admin=)(?<adminID>\d{17}|[a-f0-9]{32}):(?<groupID>\S+)/gm;

    for (const m of data.matchAll(groupRgx)) {
      groups[`${idx}-${m.groups.groupID}`] = m.groups.groupPerms.split(',');
    }
    for (const m of data.matchAll(adminRgx)) {
      try {
        const group = groups[`${idx}-${m.groups.groupID}`];
        const perms = {};
        for (const groupPerm of group) perms[groupPerm.toLowerCase()] = true;

        const adminID = m.groups.adminID;
        if (adminID in admins) {
          admins[adminID] = Object.assign(admins[adminID], perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Merged duplicate Admin ${adminID} to ${Object.keys(admins[adminID])}`
          );
        } else {
          admins[adminID] = Object.assign(perms);
          Logger.verbose(
            'SquadServer',
            3,
            `Added Admin ${adminID} with ${Object.keys(admins[adminID])}`
          );
        }
      } catch (error) {
        Logger.verbose(
          'SquadServer',
          1,
          `Error parsing admin group ${m.groups.groupID} from admin list: ${shownSource}`,
          error
        );
      }
    }
  }
  Logger.verbose('SquadServer', 1, `${Object.keys(admins).length} admins loaded...`);
  return admins;
}
