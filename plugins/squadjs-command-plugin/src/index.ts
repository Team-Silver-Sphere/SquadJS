import SquadServer from 'squad-server/index';
import { SQUADJS_VERSION } from '../../../squad-server/utils/constants.js';
import { Plugin } from '../../../src/plugin-system';
import { pluginConfigSchema } from './plugin-config/schema';
import { PluginConfig } from './plugin-config/types';

// Define the plugin.
export default class SquadJSCommandPlugin extends Plugin<PluginConfig> {
  constructor(server: SquadServer, config?: PluginConfig) {
    // Validate the plugin-config and set default values.
    const result = pluginConfigSchema.validate(config);

    // Throw an error if the plugin-config is invalid.
    if (result.error) {
      throw result.error;
    }

    // Define the plugin-config.
    config = result.value;

    // Initiate the parent class.
    super(server, config);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onChatMessage(data: any): Promise<void> {
    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/^squadjs/);

    // Handle uses of the command.
    if (command) {
      // Define the response.
      const message = `This server is running SquadJS (v${SQUADJS_VERSION})!`;

      // Send the response for the appropriate mode.
      switch (this.config.mode) {
        case 'broadcast':
          await this.server.rcon.broadcast(message);
          break;
        case 'warn':
          await this.server.rcon.warn(data.player.eosID, message);
          break;
        default:
          break;
      }
    }
  }
}
