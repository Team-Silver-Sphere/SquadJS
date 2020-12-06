import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes } = Sequelize;

export default class DBLog extends BasePlugin {
  static get description() {
    return 'The <code>DBLog</code> plugin will log server information to a Sequlize compatible DB.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      database: {
        required: true,
        connector: 'sequelize',
        description: 'The Sequelize connector to log server information to.',
        default: 'mysql'
      },
      overrideServerID: {
        required: false,
        description: 'A overridden server ID.',
        default: null
      }
    };
  }

  async prepareToMount() {
    this.createModel('Server', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING
      }
    });

    this.createModel('TickRate', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      time: {
        type: DataTypes.DATE,
        notNull: true
      },
      tickRate: {
        type: DataTypes.FLOAT,
        notNull: true
      }
    });

    this.createModel('PlayerCount', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      time: {
        type: DataTypes.DATE,
        notNull: true,
        defaultValue: DataTypes.NOW
      },
      players: {
        type: DataTypes.INTEGER,
        notNull: true
      },
      publicQueue: {
        type: DataTypes.INTEGER,
        notNull: true
      },
      reserveQueue: {
        type: DataTypes.INTEGER,
        notNull: true
      }
    });

    this.createModel('Match', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dlc: {
        type: DataTypes.STRING
      },
      map: {
        type: DataTypes.STRING
      },
      layer: {
        type: DataTypes.STRING
      },
      startTime: {
        type: DataTypes.DATE,
        notNull: true
      },
      endTime: {
        type: DataTypes.DATE
      },
      winner: {
        type: DataTypes.STRING
      }
    });

    this.models.Server.hasMany(this.models.TickRate, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.PlayerCount, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Match, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    await this.models.Server.sync();
    await this.models.TickRate.sync();
    await this.models.PlayerCount.sync();
    await this.models.Match.sync();

    let server = await this.models.Server.findOne({ id: this.server.id });
    if (server === null) {
      server = await this.models.Server.create({ id: this.server.id });
    }

    server.name = this.server.serverName;
    // await server.save();
  }

  createModel(name, schema) {
    this.models[name] = this.options.database.define(`DBLog_${name}`, schema, {
      timestamps: false
    });
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.models = {};

    this.onTickRate = this.onTickRate.bind(this);
    this.onUpdatedA2SInformation = this.onUpdatedA2SInformation.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
  }

  mount() {
    this.server.on('TICK_RATE', this.onTickRate);
    this.server.on('UPDATED_A2S_INFORMATION', this.onUpdatedA2SInformation);
    this.server.on('NEW_GAME', this.onNewGame);
  }

  unmount() {
    this.server.removeEventListener('TICK_RATE', this.onTickRate);
    this.server.removeEventListener('UPDATED_A2S_INFORMATION', this.onTickRate);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  async onTickRate(info) {
    await this.models.TickRate.create({
      server: this.server.id,
      time: info.time,
      tickRate: info.tickRate
    });
  }

  async onUpdatedA2SInformation() {
    await this.models.PlayerCount.create({
      server: this.server.id,
      players: this.server.a2sPlayerCount,
      publicQueue: this.server.publicQueue,
      reserveQueue: this.server.reserveQueue
    });
  }

  async onNewGame(info) {
    console.log(info);

    await this.models.Match.update(
      { endTime: info.time, winner: info.winner },
      { where: { server: this.server.id, endTime: null } }
    );

    await this.models.Match.create({
      server: this.server.id,
      dlc: info.dlc,
      map: info.layer ? info.layer.map : null,
      layer: info.layer ? info.layer.layer : null,
      startTime: info.time
    });
  }
}
