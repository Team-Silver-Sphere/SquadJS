import winston from 'winston';
import { Plugin } from '../../src/plugin-system';

// Create an instance of winston.
const logger: winston.Logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

// Define the plugin.
export default class SquadJSCommand extends Plugin {
  async onChatMessage(data: any): Promise<void> {
    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/!squadjs/);

    // Handle uses of the command.
    if (command) {
      // Log that the command was used.
      logger.info(`${data.player.name} called the !squadjs command.`);

      // Send the response to the command.
      await this.server.rcon.warn(data.player.eosID, 'This server is running SquadJS!');
    }
  }
}