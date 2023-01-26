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

    const pluginFilenames = [];
    for await (const dirent of dir) {
      if (!dirent.isFile()) continue;
      if (!dirent.name.endsWith('.squad.js')) continue;

      pluginFilenames.push(dirent.name);
    }

    for (const pluginFilename of pluginFilenames) {
      Logger.verbose('Plugins', 1, `Loading plugin file ${pluginFilename}...`);
      const { default: Plugin } = await import(`./${pluginFilename}`);
      this.plugins[Plugin.name] = Plugin;
    }

    return this.plugins;
  }
}

export default new Plugins();
