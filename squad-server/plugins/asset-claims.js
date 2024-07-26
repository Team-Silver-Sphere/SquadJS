import BasePlugin from './base-plugin.js';

export default class AssetClaims extends BasePlugin {
  static get description() {
    return 'The <code>AssetClaims</code> plugin will prevent Squads with certain names from being created.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      disallowedNames: {
        required: false,
        description: 'Squad Names that are not allowed.',
        default: [
            "TANK",
            "TONK",
            "CHADLEY",
            "CHALLY",
            "HELIS",
            "HELI",
            "HELO",
            "HELICOPTER",
            "ARMOR",
            "IFV",
            "MBT",
            "SCOUT",
            "TNAK",
            "PILOT"
          ],
        example: ['TANK', 'TONK', 'HELI']
      },
      warningMessage: {
        required: false,
        description: 'AdminWarn Message to send to the Player that created the Squad.',
        default: 'Please name your Vehicle Squad more specifically.\nSuch as T-72 instead of TANK',
        example: 'Please name your Vehicle Squad more specifically.\nSuch as T-72 instead of TANK'
      },
      disbandTimeout: {
        required: false,
        description: 'Time in milliseconds to wait before disbanding the Squad after the AdminWarn.',
        default: 5000,
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onSquadCreated = this.onSquadCreated.bind(this);
  }

  async mount() {
    this.server.on('SQUAD_CREATED', this.onSquadCreated);
  }

  async unmount() {
    this.server.removeEventListener('SQUAD_CREATED', this.onSquadCreated);
  }

  async onSquadCreated(info) {
    // Regular expression to check if the info.squadName contains any of the words in the disallowedNames config array, case insensitive
    const regex = new RegExp(this.options.disallowedNames.map(name => name.toLowerCase()).join('|'), 'i');

    // If the above regex is a match to the config array, send a warning message using rcon.warn
    if (regex.test(info.squadName.toLowerCase())) {
      await this.server.rcon.warn(info.player.steamID, this.options.warningMessage);
      this.verbose(
        1,
        `Disbanding Team ${info.player.teamID} - Squad ${info.squadID} - Named: ${info.squadName}`
      );
      setTimeout(async () => {
          await this.server.rcon.disbandSquad(info.player.teamID, info.squadID);
      }, this.options.disbandTimeout);
    }
  }
}