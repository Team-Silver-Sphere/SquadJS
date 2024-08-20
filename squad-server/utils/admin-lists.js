import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client as FTPClient } from 'basic-ftp'
import WritableBuffer from "./writable-buffer.js"

import axios from 'axios';
import Logger from 'core/logger';

const __dirname = fileURLToPath(import.meta.url);

export default async function fetchAdminLists(adminLists) {
  Logger.verbose('SquadServer', 1, `Fetching Admin Lists...`);

  const groups = {};
  const admins = {};

  for (const [idx, list] of adminLists.entries()) {
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
          // ex uri:  ftp://username:password@host:21/some/file.txt
          if (!list.source.startsWith('ftp://')) {
            throw new Error(`Invalid FTP URI format of ${list.source}. The source must be a FTP URI starting with the protocol. Ex: ftp://username:password@host:21/some/file.txt`)
          }
          const [loginString, hostPathString] = list.source.substring('ftp://'.length).split("@")
          const [user, password] = loginString.split(":").map(v => decodeURI(v))
          const pathStartIndex = hostPathString.indexOf("/")
          const remoteFilePath = pathStartIndex === -1 ? "/" : hostPathString.substring(pathStartIndex)
          const [host, port = 21] = hostPathString.substring(0, pathStartIndex === -1 ? hostPathString.length : pathStartIndex).split(":")

          console.log("ftp debug loginString", loginString)
          console.log("ftp debug hostPathString", hostPathString)
          console.log("ftp debug user", user)
          console.log("ftp debug password", password)
          console.log("ftp debug pathStartIndex", pathStartIndex)
          console.log("ftp debug remoteFilePath", remoteFilePath)
          console.log("ftp debug host", host)
          console.log("ftp debug port", port)

          const buffer = new WritableBuffer()
          const ftpClient = new FTPClient()
          await ftpClient.access({
            host,
            port,
            user,
            password
          })
          await ftpClient.downloadTo(buffer, remoteFilePath)
          const bufData = buffer.toString("utf8")
          console.log("ftp debug buffer", bufData)
          data = bufData
          break
        }
        default:
          throw new Error(`Unsupported AdminList type:${list.type}`);
      }
    } catch (error) {
      Logger.verbose(
        'SquadServer',
        1,
        `Error fetching ${list.type} admin list: ${list.source}`,
        error
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
          `Error parsing admin group ${m.groups.groupID} from admin list: ${list.source}`,
          error
        );
      }
    }
  }
  Logger.verbose('SquadServer', 1, `${Object.keys(admins).length} admins loaded...`);
  return admins;
}
