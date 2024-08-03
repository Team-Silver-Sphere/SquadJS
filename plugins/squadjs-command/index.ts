import { SQUADJS_VERSION } from '../../squad-server/utils/constants.js';
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class SquadJSCommand extends Plugin {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onChatMessage(data: any): Promise<void> {
    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/!squadjs/);

    // Handle uses of the command.
    if (command) {
      // Send the response to the command.
      await this.server.rcon.warn(
        data.player.eosID,
        `This server is running SquadJS (v${SQUADJS_VERSION})!`
      );
    }
  }
}
