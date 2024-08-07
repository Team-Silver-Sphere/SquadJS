import { SQUADJS_VERSION } from '../../squad-server/utils/constants.js';
import { Plugin } from '../../src/plugin-system';
import SquadServer from 'squad-server/index';

interface PluginConfig {
  mode: 'broadcast' | 'warn';
}

// Define the plugin.
export default class SquadJSCommandPlugin extends Plugin<PluginConfig> {
  constructor(server: SquadServer, config?: PluginConfig) {
    // Set default config.
    config = {
      mode: 'broadcast',
      ...(config || {})
    };

    // Initiate the parent class.
    super(server, config);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onChatMessage(data: any): Promise<void> {
    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/!squadjs/);

    // Handle uses of the command.
    if (command) {
      // Define the response.
      const message = `This server is running SquadJS (v${SQUADJS_VERSION})!`;

      // Send the response for the appropriate type.
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
