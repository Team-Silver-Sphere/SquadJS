import SquadServer from 'squad-server';

export class Plugin {
  protected server: SquadServer;

  public constructor(server: SquadServer) {
    // Store a reference to the server so the plugin can access it.
    this.server = server;
  }

  public async mount() {}

  public async onRoundStart(data: object): Promise<void> {}
  public async onRoundEnd(data: object): Promise<void> {}

  public async onServerInformationUpdate(): Promise<void> {}
  public async onPlayerInformationUpdate(): Promise<void> {}
  public async onLayerInformationUpdate(): Promise<void> {}
  public async onTickRateUpdate(data: object): Promise<void> {}

  public async onChatMessage(data: object): Promise<void> {}
  public async onAdminBroadcast (data: object): Promise<void> {}

  public async onPlayerConnection(data: object): Promise<void> {}
  public async onPlayerDisconnection(data: object): Promise<void> {}
  public async onPlayerWarn(data: object): Promise<void> {}
  public async onPlayerKick(data: object): Promise<void> {}
  public async onPlayerBan(data: object): Promise<void> {}

  public async onPlayerChangeTeam(data: object): Promise<void> {}
  public async onPlayerChangeSquad(data: object): Promise<void> {}

  public async onPlayerDamage(data: object): Promise<void> {}
  public async onPlayerWound(data: object): Promise<void> {}
  public async onPlayerDie(data: object): Promise<void> {}
  public async onPlayerTeamkill(data: object): Promise<void> {}
  public async onPlayerRevive(data: object): Promise<void> {}

  public async onPlayerPossess(data: object): Promise<void> {}
  public async onPlayerUnPossess(data: object): Promise<void> {}

  public async onPlayerPossessAdminCamera(data: object): Promise<void> {}
  public async onPlayerUnPossessAdminCamera(data: object): Promise<void> {}

  public async onSquadCreate(data: object): Promise<void> {}

  public async onDeployableDamage(data: object): Promise<void> {}

  public async onRconError(data: object): Promise<void> {}
}