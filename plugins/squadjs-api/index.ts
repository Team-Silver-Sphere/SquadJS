import axios from 'axios';
import Logger from 'core/logger';
import SquadServer from '../../squad-server';
import { SQUADJS_VERSION } from '../../squad-server/utils/constants.js';
import { Plugin } from '../../src/plugin-system';

const SQUADJS_API_DOMAIN: string = 'https://squadjs.thomas-smyth.uk';

// Define the plugin.
export default class SquadJSCommand extends Plugin {
  private instance: number;
  private readonly interval: number = 5 * 60 * 1000;

  public constructor(server: SquadServer) {
    super(server);

    // Bind the ping method so this is accessible.
    this.ping = this.ping.bind(this);
  }

  async mount(): Promise<void> {
    // @ts-ignore
    this.instance = setInterval(this.ping, this.interval);
  }

  async ping(): Promise<void> {
    Logger.verbose('SquadServer', 1, 'Pinging SquadJS API...');

    // Prepare the data to send to the SquadJS API.
    const payload = {
      // Send information about the server.
      server: {
        host: this.server.options.host,
        queryPort: this.server.options.queryPort,

        name: this.server.serverName,
        playerCount: this.server.a2sPlayerCount + this.server.publicQueue + this.server.reserveQueue
      },

      // Send information about SquadJS.
      squadjs: {
        version: SQUADJS_VERSION,
        logReaderMode: this.server.options.logReaderMode
      }
    };

    // Handle an errors sending the request.
    try {
      // Send the request.
      const { data } = await axios.post(SQUADJS_API_DOMAIN + '/api/v1/ping', payload);

      // Log the response.
      if (data.error) {
        Logger.verbose(
          'SquadServer',
          1,
          `Successfully pinged the SquadJS API. Got back error: ${data.error}`
        );
      } else {
        Logger.verbose(
          'SquadServer',
          1,
          `Successfully pinged the SquadJS API. Got back message: ${data.message}`
        );
      }
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to ping the SquadJS API: ', err.message);
    }
  }
}