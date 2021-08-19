import CorePlugin from '../core/plugin.js';

export default class Plugin extends CorePlugin {
  async onAdminBroadcast(event) {}
  async onChatMessage(event) {}
  async onDeployableDamage(event) {}
  async onGeneralServerInformationUpdated(event) {}
  async onLayerChanged(event) {}
  async onLayerInformationUpdated(event) {}
  async onPlayerBanned(event) {}
  async onPlayerCreated(event) {}
  async onPlayerDamaged(event) {}
  async onPlayerDeleted(event) {}
  async onPlayerDied(event) {}
  async onPlayerKicked(event) {}
  async onPlayerPossessedAdminCamera(event) {}
  async onPlayerRevived(event) {}
  async onPlayerUnpossessedAdminCamera(event) {}
  async onPlayerUpdated(event) {}
  async onPlayerWarned(event) {}
  async onPlayerWounded(event) {}
  async onSquadCreated(event) {}
  async onSquadDeleted(event) {}
  async onSquadUpdated(event) {}
  async onTeamsAndSquadsUpdated(event) {}
  async onTickRateUpdated(event) {}
}
