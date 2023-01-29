import fs from 'fs';

import Logger from 'core/logger';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __basedir = path.resolve(__dirname, '../../');

class Plugins {
  constructor() {
    this.plugins = null;
    this.pluginPaths = ['squad-server/plugins/'];
  }

  async setPluginPaths(pluginPaths) {
    this.pluginPaths = pluginPaths;
  }

  async getPlugins(force = false) {
    if (this.plugins && !force) return this.plugins;

    this.plugins = {};

    for (const pluginPath of this.pluginPaths) {
      const resolvedPath = path.resolve(__basedir, pluginPath);
      Logger.verbose('Plugins', 1, `Loading plugins from ${resolvedPath}...`);
      const dir = await fs.promises.opendir(resolvedPath);

      const pluginFilenames = [];
      for await (const dirent of dir) {
        if (!dirent.isFile()) continue;
        if (!dirent.name.endsWith('.squad.js')) continue;

        pluginFilenames.push(dirent.name);
      }

      for (const pluginFilename of pluginFilenames) {
        Logger.verbose('Plugins', 1, `Loading plugin file ${pluginFilename}...`);
        const { default: Plugin } = await import(`${resolvedPath}/${pluginFilename}`);

        if (this.plugins[Plugin.name] !== undefined) {
          Logger.verbose('Plugins', 1, `Overriding ${Plugin.name} using ${pluginFilename}...`);
        }
        this.plugins[Plugin.name] = Plugin;
      }
    }

    return this.plugins;
  }
}

export default new Plugins();
