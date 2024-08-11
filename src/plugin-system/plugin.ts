import SquadServer from '../../squad-server';
import { Plugin as PluginInterface } from './plugin-interface';

export class Plugin<PluginConfig = undefined> implements PluginInterface {
  protected server: SquadServer;
  protected config: PluginConfig;

  constructor(server: SquadServer, config: PluginConfig) {
    // Store a reference to the server so the plugin can access it.
    this.server = server;

    // Store a reference to the config so the plugin can access it.
    this.config = config;
  }

  public async mount() {}
}
