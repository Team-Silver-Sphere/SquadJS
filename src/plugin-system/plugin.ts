import SquadServer from 'squad-server';

export class Plugin {
  protected server: SquadServer;

  public constructor(server: SquadServer) {
    // Store a reference to the server so the plugin can access it.
    this.server = server;
  }

  public async mount() {}

  public async onChatMessage(data: object): Promise<void> {}
}