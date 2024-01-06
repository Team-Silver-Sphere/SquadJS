import fs from 'fs';

import Logger from 'core/logger';
import { URL } from 'url';

class Plugins {
  constructor() {
    this.pluginMap = new Map();
  }

  /**
   * Get all Plugins in the provided directory.
   *
   * @param {boolean} force
   * @param {boolean} recursive - Whether to recursively load the Plugins in the directory
   * @param {string|"./"} dir - The directory to load the Plugins from
   * @returns {Promise<object|null>}
   */
  async getPlugins(force = false, recursive = false, dir = './') {
    if (this.pluginMap.size !== 0 && !force) return this.toObj();

    const plugins = await this.loadPlugins(force, new URL(dir, import.meta.url), recursive);

    for (const Plugin of plugins) {
      if (!Plugin.name) continue;
      Logger.verbose('Plugins', 1, `Loading plugin file ${Plugin.name}...`);
      this.pluginMap.set(Plugin.name, Plugin);
    }
    return this.toObj();
  }

  /**
   * Load all Plugins in the provided directory.
   *
   * @template {object} T
   * @param {boolean} force
   * @param {fs.PathLike} dir - The directory to load the Plugins from
   * @param {boolean} recursive - Whether to recursively load the Plugins in the directory
   * @returns {Promise<T[]>}
   */
  async loadPlugins(force = false, dir, recursive = true) {
    // Get the stats of the directory
    const statDir = await fs.promises.stat(dir);

    // If the provided directory path is not a directory, throw an error
    if (!statDir.isDirectory()) {
      throw new Error(`The directory '${dir}' is not a directory.`);
    }

    // Get all the files in the directory
    const files = await fs.promises.readdir(dir);

    // Create an empty array to store the plugins
    /** @type {T[]} */
    const plugins = [];

    // Loop through all the files in the directory
    for (const file of files) {
      // If the file is index.js, is a base plugin, or the file does not end with .js, skip the file
      if (/(index|base-(plugin|message-updater))\.js/.test(file) || !file.endsWith('.js')) {
        continue;
      }

      // Get the stats of the file
      const statFile = await fs.promises.stat(new URL(`${dir}/${file}`));

      // If the file is a directory and recursive is true, recursively load the plugins in the directory
      if (statFile.isDirectory() && recursive) {
        plugins.push(...(await this.loadPlugins(force, `${dir}/${file}`, recursive)));
        continue;
      }

      // Import the plugin dynamically from the file
      const Plugin = (await import(`${dir}/${file}`)).default;
      plugins.push(Plugin);
    }

    return plugins;
  }

  /**
   * Transforms plugin Map to an object
   *
   * @returns {null|object{}}
   */
  toObj() {
    if (this.pluginMap.size === 0) {
      return null;
    }
    const obj = {};
    for (const [k, v] of this.pluginMap) {
      obj[k] = v;
    }
    return obj;
  }
}

export default new Plugins();
