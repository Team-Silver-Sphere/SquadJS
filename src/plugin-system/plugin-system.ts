import fs from 'fs/promises';
import path from 'path';
import SquadServer from 'squad-server';
import type { Plugin } from './plugin';

export class PluginSystem {
  public static async loadPlugins(server: SquadServer): Promise<void> {
    // Get a list of plugin folders.
    const pluginFolders = await fs.readdir('./plugins');

    // Loop over each plugin folder.
    for (const pluginFolder of pluginFolders) {
      // Get the path to the plugin.
      const pluginPath: string = path.resolve('./plugins', pluginFolder, 'index.ts');

      // Import the plugin.
      const { default: ImportedPlugin }: { default: typeof Plugin } = await import(
        `file://${pluginPath}`
      );

      // Initiate the plugin.
      const plugin = new ImportedPlugin(server);

      // Mount the new plugin.
      await server.mountPlugin(plugin);
    }
  }
}
