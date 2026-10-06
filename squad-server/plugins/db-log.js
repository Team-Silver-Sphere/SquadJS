import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes, QueryTypes } = Sequelize;

const MIGRATION_LOCK_WAIT_TIMEOUT = 10;

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
        victimEosID: {
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
        attackerEosID: {
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
        collate: 'utf8mb4_unicode_ci',
        // The player columns reference DBLog_Players.steamID with ON UPDATE CASCADE. Without these
        // indexes, every Player upsert scans this table once per foreign key on SQLite.
        indexes: [
          {
            fields: ['attacker']
          },
          {
            fields: ['victim']
          },
          {
            fields: ['attackerEosID']
          },
          {
            fields: ['victimEosID']
          }
        ]
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
        victimEosID: {
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
        attackerEosID: {
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
        collate: 'utf8mb4_unicode_ci',
        indexes: [
          {
            fields: ['attacker']
          },
          {
            fields: ['victim']
          },
          {
            fields: ['attackerEosID']
          },
          {
            fields: ['victimEosID']
          }
        ]
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
        victimEosID: {
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
        attackerEosID: {
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
        reviverEosID: {
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
        collate: 'utf8mb4_unicode_ci',
        indexes: [
          {
            fields: ['attacker']
          },
          {
            fields: ['victim']
          },
          {
            fields: ['reviver']
          },
          {
            fields: ['attackerEosID']
          },
          {
            fields: ['victimEosID']
          },
          {
            fields: ['reviverEosID']
          }
        ]
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

  createModel(name, schema, options = {}) {
    this.models[name] = this.options.database.define(`DBLog_${name}`, schema, {
      timestamps: false,
      ...options
    });
  }

  getPlayerConflictFields(player) {
    // Players from the Epic Games Store have no Steam ID. A NULL steamID never conflicts, so their upsert
    // would insert a second row and fail on the unique eosID.
    return player.steamID ? ['steamID'] : ['eosID'];
  }

  async prepareToMount() {
    await this.models.Server.sync();
    await this.models.Match.sync();
    await this.models.TickRate.sync();
    await this.models.PlayerCount.sync();
    await this.models.SteamUser.sync();
    await this.models.Player.sync();
    await this.addEosIDColumns();
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
    this.server.removeListener('TICK_RATE', this.onTickRate);
    this.server.removeListener('UPDATED_A2S_INFORMATION', this.onTickRate);
    this.server.removeListener('NEW_GAME', this.onNewGame);
    this.server.removeListener('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.removeListener('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.removeListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeListener('PLAYER_REVIVED', this.onPlayerRevived);
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
          conflictFields: this.getPlayerConflictFields(info.attacker)
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
          conflictFields: this.getPlayerConflictFields(info.victim)
        }
      );

    await this.models.Wound.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimEosID: info.victim ? info.victim.eosID : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerEosID: info.attacker ? info.attacker.eosID : null,
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
          conflictFields: this.getPlayerConflictFields(info.attacker)
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
          conflictFields: this.getPlayerConflictFields(info.victim)
        }
      );

    await this.models.Death.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimEosID: info.victim ? info.victim.eosID : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerEosID: info.attacker ? info.attacker.eosID : null,
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
          conflictFields: this.getPlayerConflictFields(info.attacker)
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
          conflictFields: this.getPlayerConflictFields(info.victim)
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
          conflictFields: this.getPlayerConflictFields(info.reviver)
        }
      );

    await this.models.Revive.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimEosID: info.victim ? info.victim.eosID : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerEosID: info.attacker ? info.attacker.eosID : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill,
      reviver: info.reviver ? info.reviver.steamID : null,
      reviverName: info.reviver ? info.reviver.name : null,
      reviverEosID: info.reviver ? info.reviver.eosID : null,
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
        conflictFields: this.getPlayerConflictFields(info.player)
      }
    );
  }

  async addEosIDColumns() {
    // sync() adds missing indexes to an existing table but not missing columns, so tables created before the
    // EOS ID columns existed get them here, before sync() tries to index them.
    const queryInterface = this.options.database.getQueryInterface();

    for (const modelName of ['Wound', 'Death', 'Revive']) {
      const model = this.models[modelName];
      const tableName = model.getTableName();
      if (!(await queryInterface.tableExists(tableName))) continue;

      const columns = Object.keys(model.rawAttributes).filter((column) => column.endsWith('EosID'));
      const hasColumn = async (column, options) =>
        column in (await queryInterface.describeTable(tableName, options));
      const hasIndex = async (column, options) =>
        (await queryInterface.showIndex(tableName, options)).some(
          (index) => index.fields.length === 1 && index.fields[0].attribute === column
        );

      const missingColumns = [];
      const missingIndexes = [];
      for (const column of columns) {
        if (!(await hasColumn(column))) missingColumns.push(column);
        if (!(await hasIndex(column))) missingIndexes.push(column);
      }
      if (missingColumns.length === 0 && missingIndexes.length === 0) continue;

      this.verbose(
        1,
        `Adding EOS ID columns to ${tableName}. Indexing existing rows can take a while on a large table.`
      );

      try {
        await this.runMigration(async (options) => {
          // Several SquadJS instances can share one database and start at the same time, so a step that fails
          // because another instance already did it counts as done.
          for (const column of missingColumns)
            await this.runMigrationStep(
              () =>
                queryInterface.addColumn(tableName, column, { type: DataTypes.STRING }, options),
              () => hasColumn(column, options)
            );
          for (const column of missingIndexes)
            await this.runMigrationStep(
              () => queryInterface.addIndex(tableName, { ...options, fields: [column] }),
              () => hasIndex(column, options)
            );
        });
      } catch (error) {
        if (error.parent && error.parent.code === 'ER_LOCK_WAIT_TIMEOUT')
          this.verbose(
            1,
            `Unable to add EOS ID columns to ${tableName}: another query held a lock on the table for more than ` +
              `${MIGRATION_LOCK_WAIT_TIMEOUT} seconds. Restart SquadJS to try again.`
          );
        else this.verbose(1, `Unable to add EOS ID columns to ${tableName}: ${error.message}`);
        throw error;
      }

      this.verbose(1, `Added EOS ID columns to ${tableName}.`);
    }
  }

  async runMigration(steps) {
    const database = this.options.database;
    if (!['mysql', 'mariadb'].includes(database.getDialect())) return steps({});

    // ALTER TABLE waits for a metadata lock that a long query on the table can hold, and the default wait is
    // one year. lock_wait_timeout is a session variable, so the transaction keeps every step on one connection.
    await database.transaction(async (transaction) => {
      await database.query(`SET SESSION lock_wait_timeout = ${MIGRATION_LOCK_WAIT_TIMEOUT}`, {
        transaction
      });
      try {
        await steps({ transaction });
      } finally {
        await database.query('SET SESSION lock_wait_timeout = DEFAULT', { transaction });
      }
    });
  }

  async runMigrationStep(step, isDone) {
    try {
      await step();
    } catch (error) {
      if (!(await isDone())) throw error;
    }
  }

  async migrateSteamUsersIntoPlayers() {
    try {
      const steamUsersCount = await this.models.SteamUser.count();
      const playersCount = await this.models.Player.count();

      if (steamUsersCount === 0) {
        this.verbose(1, `Skipping migration from SteamUsers to Players: there are no SteamUsers.`);
        return;
      }

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
