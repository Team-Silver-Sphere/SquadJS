import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes } = Sequelize;

export default class PersistentEOSIDtoSteamID extends BasePlugin {
  static get description() {
    return "Stores into a DB every association of SteamID-EOSID";
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      database: {
        required: true,
        connector: 'sequelize',
        description: 'The Sequelize connector.',
        default: 'sqlite'
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.models = {};

    this.createModel(
      'SteamIDtoEOSID',
      {
        steamID: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        eosID: {
          type: DataTypes.STRING,
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.onPlayerConnected = this.onPlayerConnected.bind(this);
  }

  createModel(name, schema) {
    this.models[ name ] = this.options.database.define(`EOS_${name}`, schema, {
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: [ 'eosID' ]
        },
      ]
    });
  }

  async prepareToMount() {
    await this.models.SteamIDtoEOSID.sync();
  }

  async mount() {
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
    this.verbose(1, 'Mounted')
  }

  async unmount() {
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
  }

  async onPlayerConnected(info) {
    await this.models.SteamIDtoEOSID.upsert({
      steamID: info.player.steamID,
      eosID: info.eosID
    });
  }

  async getByEOSID(eosID) {
    return await this.models.SteamIDtoEOSID.findOne({ where: { eosID: eosID } })
  }

  async getBySteamID(steamID) {
    return await this.models.SteamIDtoEOSID.findOne({ where: { steamID: steamID } })
  }
}
