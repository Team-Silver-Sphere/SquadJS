import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes, QueryTypes } = Sequelize;

export default class DBLog extends BasePlugin {
  static get description() {
    return (
      'The <code>mysql-log</code> plugin will log various server statistics and events to a database. This is great ' +
      'for server performance monitoring and/or player stat tracking.' +
      '\n\n' +
      'Grafana:\n' +
      '<ul><li> <a href="https://grafana.com/">Grafana</a> is a cool way of viewing server statistics stored in the database.</li>\n' +
      '<li>Install Grafana.</li>\n' +
      '<li>Add your database as a datasource named <code>SquadJS</code>.</li>\n' +
      '<li>Import the <a href="https://github.com/Team-Silver-Sphere/SquadJS/blob/master/squad-server/templates/SquadJS-Dashboard-v2.json">SquadJS Dashboard</a> to get a preconfigured MySQL only Grafana dashboard.</li>\n' +
      '<li>Install any missing Grafana plugins.</li></ul>'
    );
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

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.models = {};

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

    this.createModel('Match', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dlc: {
        type: DataTypes.STRING
      },
      mapClassname: {
        type: DataTypes.STRING
      },
      layerClassname: {
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

    this.createModel(
      'SteamUser',
      {
        steamID: {
          type: DataTypes.STRING,
          primaryKey: true
        },
        lastName: {
          type: DataTypes.STRING
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.createModel(
      'Player',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        eosID: {
          type: DataTypes.STRING,
          unique: true
        },
        steamID: {
          type: DataTypes.STRING,
          notNull: true,
          unique: true
        },
        lastName: {
          type: DataTypes.STRING
        },
        lastIP: {
          type: DataTypes.STRING
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
          {
            fields: ['eosID']
          },
          {
            fields: ['steamID']
          }
        ]
      }
    );

    this.createModel(
      'Wound',
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
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.createModel(
      'Death',
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
        woundTime: {
          type: DataTypes.DATE
        },
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.createModel(
      'Revive',
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
        woundTime: {
          type: DataTypes.DATE
        },
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        },
        reviverName: {
          type: DataTypes.STRING
        },
        reviverTeamID: {
          type: DataTypes.INTEGER
        },
        reviverSquadID: {
          type: DataTypes.INTEGER
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

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

    this.models.Server.hasMany(this.models.Wound, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Death, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Revive, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Wound, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Wound, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Death, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Death, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'reviver' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.TickRate, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.PlayerCount, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Wound, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Death, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Revive, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.onTickRate = this.onTickRate.bind(this);
    this.onUpdatedA2SInformation = this.onUpdatedA2SInformation.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.onPlayerConnected = this.onPlayerConnected.bind(this);
    this.onPlayerWounded = this.onPlayerWounded.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
    this.onPlayerRevived = this.onPlayerRevived.bind(this);
    this.migrateSteamUsersIntoPlayers = this.migrateSteamUsersIntoPlayers.bind(this);
    this.dropAllForeignKeys = this.dropAllForeignKeys.bind(this);
  }

  createModel(name, schema) {
    this.models[name] = this.options.database.define(`DBLog_${name}`, schema, {
      timestamps: false
    });
  }

  async prepareToMount() {
    await this.models.Server.sync();
    await this.models.Match.sync();
    await this.models.TickRate.sync();
    await this.models.PlayerCount.sync();
    await this.models.SteamUser.sync();
    await this.models.Player.sync();
    await this.models.Wound.sync();
    await this.models.Death.sync();
    await this.models.Revive.sync();
  }

  async mount() {
    await this.migrateSteamUsersIntoPlayers();

    await this.models.Server.upsert({
      id: this.options.overrideServerID || this.server.id,
      name: this.server.serverName
    });

    this.match = await this.models.Match.findOne({
      where: { server: this.options.overrideServerID || this.server.id, endTime: null }
    });

    this.server.on('TICK_RATE', this.onTickRate);
    this.server.on('UPDATED_A2S_INFORMATION', this.onUpdatedA2SInformation);
    this.server.on('NEW_GAME', this.onNewGame);
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.on('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.on('PLAYER_DIED', this.onPlayerDied);
    this.server.on('PLAYER_REVIVED', this.onPlayerRevived);
  }

  async unmount() {
    this.server.removeEventListener('TICK_RATE', this.onTickRate);
    this.server.removeEventListener('UPDATED_A2S_INFORMATION', this.onTickRate);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.removeEventListener('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.removeEventListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeEventListener('PLAYER_REVIVED', this.onPlayerRevived);
  }

  async onTickRate(info) {
    await this.models.TickRate.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      tickRate: info.tickRate
    });
  }

  async onUpdatedA2SInformation(info) {
    await this.models.PlayerCount.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      players: info.a2sPlayerCount,
      publicQueue: info.publicQueue,
      reserveQueue: info.reserveQueue
    });
  }

  async onNewGame(info) {
    await this.models.Match.update(
      { endTime: info.time, winner: info.winner },
      { where: { server: this.options.overrideServerID || this.server.id, endTime: null } }
    );

    this.match = await this.models.Match.create({
      server: this.options.overrideServerID || this.server.id,
      dlc: info.dlc,
      mapClassname: info.mapClassname,
      layerClassname: info.layerClassname,
      map: info.layer ? info.layer.map.name : null,
      layer: info.layer ? info.layer.name : null,
      startTime: info.time
    });
  }

  async onPlayerWounded(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Wound.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill
    });
  }

  async onPlayerDied(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Death.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill
    });
  }

  async onPlayerRevived(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.reviver)
      await this.models.Player.upsert(
        {
          eosID: info.reviver.eosID,
          steamID: info.reviver.steamID,
          lastName: info.reviver.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Revive.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill,
      reviver: info.reviver ? info.reviver.steamID : null,
      reviverName: info.reviver ? info.reviver.name : null,
      reviverTeamID: info.reviver ? info.reviver.teamID : null,
      reviverSquadID: info.reviver ? info.reviver.squadID : null
    });
  }

  async onPlayerConnected(info) {
    await this.models.Player.upsert(
      {
        eosID: info.player.eosID,
        steamID: info.player.steamID,
        lastName: info.player.name,
        lastIP: info.ip
      },
      {
        conflictFields: ['steamID']
      }
    );
  }

  async migrateSteamUsersIntoPlayers() {
    try {
      const steamUsersCount = await this.models.SteamUser.count();
      const playersCount = await this.models.Player.count();

      if (steamUsersCount < playersCount) {
        this.verbose(
          1,
          `Skipping migration from SteamUsers to Players due to a previous successful migration.`
        );
        return;
      }

      await this.dropAllForeignKeys();

      const steamUsers = (await this.models.SteamUser.findAll()).map((u) => u.dataValues);
      await this.models.Player.bulkCreate(steamUsers);

      this.verbose(1, `Migration from SteamUsers to Players successful`);
    } catch (error) {
      this.verbose(1, `Error during Migration from SteamUsers to Players: ${error}`);
    }
  }

  async dropAllForeignKeys() {
    this.verbose(
      1,
      `Starting to drop constraints on DB: ${this.options.database.config.database} related to DBLog_SteamUsers deptecated table.`
    );
    for (const modelName in this.models) {
      const model = this.models[modelName];
      const tableName = model.tableName;

      try {
        const result = await this.options.database.query(
          `SELECT * FROM information_schema.key_column_usage WHERE referenced_table_name IS NOT NULL AND table_schema = '${this.options.database.config.database}' AND table_name = '${tableName}';`,
          { type: QueryTypes.SELECT }
        );

        for (const r of result) {
          if (r.REFERENCED_TABLE_NAME === 'DBLog_SteamUsers') {
            this.verbose(
              1,
              `Found constraint ${r.COLUMN_NAME} on table ${tableName}, referencing ${r.REFERENCED_COLUMN_NAME} on ${r.REFERENCED_TABLE_NAME}`
            );

            await this.options.database
              .query(`ALTER TABLE ${tableName} DROP FOREIGN KEY ${r.CONSTRAINT_NAME}`, {
                type: QueryTypes.RAW
              })
              .then(() => {
                this.verbose(1, `Dropped foreign key ${r.COLUMN_NAME} on table ${tableName}`);
              })
              .catch((e) => {
                this.verbose(
                  1,
                  `Error dropping foreign key ${r.COLUMN_NAME} on table ${tableName}:`,
                  e
                );
              });
          }
        }
      } catch (error) {
        this.verbose(1, `Error dropping foreign keys for table ${tableName}:`, error);
      } finally {
        model.sync();
      }
    }
    await this.models.Player.sync();
  }
}
