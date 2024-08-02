import SquadServer from 'squad-server';
import { PluginInterface } from './plugin-interface';

export class Plugin implements PluginInterface {
  protected server: SquadServer;

  public constructor(server: SquadServer) {
    // Store a reference to the server so the plugin can access it.
    this.server = server;
  }

  public async mount() {}
}
