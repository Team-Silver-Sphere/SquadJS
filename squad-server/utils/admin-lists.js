import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client as FTPClient } from 'basic-ftp';
import SFTPClient from 'ssh2-sftp-client';
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

// SquadJS waits for the admin lists at startup and before it emits NEW_GAME, so a slow remote list
// must not hold it for long.
const REMOTE_LIST_TIMEOUT = 10 * 1000;

// Last content that was fetched from each list. When a later fetch fails, this content is used, so
// the admins of that list do not disappear until the next successful fetch.
const lastFetchedLists = new Map();

export default async function fetchAdminLists(adminLists) {
  Logger.verbose('SquadServer', 1, `Fetching Admin Lists...`);

  const groups = {};
  const admins = {};

  for (const [idx, list] of adminLists.entries()) {
    const shownSource = withoutPassword(list.source);
    const listKey = `${list.type}:${list.source}`;
    let data = '';
    try {
      switch (list.type) {
        case 'remote': {
          const resp = await axios({
            method: 'GET',
            url: `${list.source}`,
            timeout: REMOTE_LIST_TIMEOUT
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
        case 'sftp': {
          // ex url: sftp://<user>:<password>@<host>:<port>/<url-path>
          if (!list.source.startsWith('sftp://')) {
            throw new Error(
              `Invalid SFTP URI format of ${list.source}. The source must be a SFTP URI starting with the protocol. Ex: sftp://username:password@host:22/some/file.txt`
            );
          }
          // URL keeps the user, password and path percent-encoded.
          const url = new URL(list.source);
          const buffer = new WritableBuffer();
          const sftpClient = new SFTPClient();
          try {
            await sftpClient.connect({
              host: url.hostname,
              port: Number(url.port) || 22,
              username: decodeURIComponent(url.username),
              password: decodeURIComponent(url.password)
            });
            await sftpClient.get(decodeURIComponent(url.pathname), buffer);
          } finally {
            await sftpClient.end();
          }
          data = buffer.toString('utf8');
          break;
        }
        default:
          throw new Error(`Unsupported AdminList type:${list.type}`);
      }
      lastFetchedLists.set(listKey, data);
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
      if (lastFetchedLists.has(listKey)) {
        data = lastFetchedLists.get(listKey);
        Logger.verbose('SquadServer', 1, `Using the last fetched ${list.type} admin list instead.`);
      }
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
