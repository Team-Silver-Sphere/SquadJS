import winston from 'winston';
import { Plugin } from '../../src/plugin-system';

const logger: winston.Logger = winston.createLogger({
  transports: [new winston.transports.Console()]
});

export default class SquadJSCommand extends Plugin {
  async onChatMessage(data: any): Promise<void> {
    // Check whether the message contained the SquadJS command.
    const command = data.message.match(/!squadjs/);

    // Send the response to the command.
    if (command) {
      logger.info(`${data.player.name} called the !squadjs command.`);
      await this.server.rcon.warn(data.player.eosID, 'This server is running SquadJS!');
    }
  }
}