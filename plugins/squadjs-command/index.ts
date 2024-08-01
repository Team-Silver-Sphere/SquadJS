import { Plugin } from '../../src/plugin-system';

export default class SquadJSCommand extends Plugin {
  async onChatMessage(data: any): Promise<void> {
    console.log(data);

    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/!squadjs/);

    // Send the response to the command.
    if (command) {
      await this.server.rcon.warn(data.player.eosID, 'This server is running SquadJS!');
    }
  }
}