import fs from 'fs';

import Logger from 'core/logger';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Plugins {
  constructor() {
    this.plugins = null;
  }

  async getPlugins(force = false) {
    if (this.plugins && !force) return this.plugins;

    this.plugins = {};

    const dir = await fs.promises.opendir(path.join(__dirname, './'));
    for await (const dirent of dir) {
      if (!dirent.isFile()) continue;
      if (
        ['index.js', 'base-plugin.js', 'discord-base-plugin.js', 'readme.md'].includes(dirent.name)
      )
        continue;
      Logger.verbose('Plugins', 1, `Loading plugin file ${dirent.name}...`);
      const { default: Plugin } = await import(`./${dirent.name}`);

      this.plugins[Plugin.name] = Plugin;
    }

    return this.plugins;
  }
}

export default new Plugins();
