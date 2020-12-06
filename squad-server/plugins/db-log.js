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
    this.createModel(
      'Server',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        name: {
          type: DataTypes.STRING
        }
      }
    );

    this.createModel(
      'TickRate',
      {
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
      }
    );

    this.models.Server.hasMany(
      this.models.TickRate,
      { foreignKey: { name: 'server', allowNull: false },  onDelete: 'CASCADE' }
    );

    await this.models.Server.sync();
    await this.models.TickRate.sync();

    let server = await this.models.Server.findOne({ id: this.server.id });
    if (server === null) {
      server = await this.models.Server.create({ id: this.server.id });
    }
    server.name = this.server.serverName;
    await server.save();
  }

  createModel(name, schema) {
    this.models[name] = this.options.database.define(`DBLog_${name}`, schema);
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.models = {};

    this.onTickRate = this.onTickRate.bind(this);
  }

  mount() {
    this.server.on('TICK_RATE', this.onTickRate);
  }

  unmount() {
    this.server.removeEventListener('TICK_RATE', this.onTickRate)
  }

  async onTickRate(info) {
    await this.models.TickRate.create({ server: this.server.id, time: info.time, tickRate: info.tickRate});
  }
}
