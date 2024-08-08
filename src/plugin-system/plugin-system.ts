import fs from 'fs';
import path from 'path';
import SquadServer from 'squad-server';
import { logger } from '../utils';
import type { Plugin } from './plugin';

export class PluginSystem {
  public static async loadPlugins(server: SquadServer): Promise<void> {
    // Get a list of plugin folders.
    const pluginFolders = fs.readdirSync('./plugins');

    // Loop over each plugin folder.
    for (const pluginFolder of pluginFolders) {
      // Log progress.
      logger.info(`[PluginSystem] Importing ${pluginFolder}...`);

      // Get the path to the plugin.
      const pluginFolderPath = path.resolve('./plugins', pluginFolder);
      const pluginPath = path.resolve(pluginFolderPath, 'index.ts');
      const pluginConfigPath = path.resolve(pluginFolderPath, './config.json');

      // Initiate a variable to store the config in.
      // eslint-disable-next-line
      let config: { disabled?: boolean; [key: string]: any } | undefined;

      // Check the config file exists.
      if (fs.readFileSync(pluginConfigPath)) {
        // Read the config file.
        const configString = fs.readFileSync(pluginConfigPath, 'utf-8');

        // Parse the config.
        try {
          config = JSON.parse(configString);
        } catch (err) {
          logger.error(`[PluginSystem] ${pluginFolder} has an invalid configuration file.`);
          throw err;
        }
      }

      // Do not import, initiate or mount the plugin if it is disabled.
      if (config?.disabled) {
        logger.warn(`[PluginSystem] ${pluginFolder} is disabled.`);
        continue;
      }

      // Delete disabled if it is defined. This does not need to be passed to the plugin.
      if (config) {
        delete config.disabled;
      }

      // Import the plugin.
      const { default: ImportedPlugin }: { default: typeof Plugin } = await import(
        `file://${pluginPath}`
      );

      // Log progress.
      logger.info(`[PluginSystem] ${pluginFolder} is successfully imported.`);
      logger.info(`[PluginSystem] Mounting ${pluginFolder}...`);

      // Initiate the plugin.
      const plugin = new ImportedPlugin(server, config);

      // Mount the new plugin.
      await server.mountPlugin(plugin);

      // Log progress.
      logger.info(`[PluginSystem] ${pluginFolder} is successfully mounted.`);
    }
  }
}
