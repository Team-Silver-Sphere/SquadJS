import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { Client } from 'basic-ftp';

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
          const provider = new FTPAdminListProvider({
            ...list.ftp,
            source: list.source
          });
          data = await provider.fetch();
          provider.close();
          break;
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
    const adminRgx = /(?<=^Admin=)(?<steamID>\d+):(?<groupID>\S+)/gm;

    for (const m of data.matchAll(groupRgx)) {
      groups[`${idx}-${m.groups.groupID}`] = m.groups.groupPerms.split(',');
    }
    for (const m of data.matchAll(adminRgx)) {
      try {
        const group = groups[`${idx}-${m.groups.groupID}`];
        const perms = {};
        for (const groupPerm of group) perms[groupPerm.toLowerCase()] = true;

        const steamID = m.groups.steamID;
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

class FTPAdminListProvider {
  constructor(options) {
    this.options = {
      host: options.host,
      port: options.port || 21,
      user: options.user,
      password: options.password,
      secure: options.secure || false,
      timeout: options.timeout || 2000,
      downloadPath: options.source,
      encoding: options.encoding || 'utf8',
      verbose: options.verbose || false
    }

    this.client = new Client(this.options.timeout);
    this.client.ftp.verbose = this.options.verbose;
    this.client.encoding = this.options.encoding;

    this.tempFilePath = path.join(
      process.cwd(),
      crypto
        .createHash('md5')
        .update(`${this.options.host}:${this.options.port}:${this.options.path}:Admins.cfg`)
        .digest('hex') + '.tmp'
    );
  }

  async fetch() {
    if (!this.client.closed) throw new Error("Tried to fetch admin list on closed FTP client!");
    try {
      await this.client.access({
        host: this.options.host,
        port: this.options.port,
        user: this.options.user,
        password: this.options.password,
        secure: this.options.secure
      });

      await this.client.downloadTo(this.tempFilePath, this.options.downloadPath);

      if (!fs.existsSync(this.tempFilePath)) throw new Error(`No admin file ${this.tempFilePath} found!`);

      return fs.readFileSync(this.tempFilePath, 'utf8');
    } catch (err) {
      console.log(err);
      throw new Error("Failed to fetch admin list from FTP!");
    }
  }

  close() {
    if (this.client.closed) return;

    this.client.close();
  }
}