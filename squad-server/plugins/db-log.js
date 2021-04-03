import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes } = Sequelize;

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
      '<li>Import the <a href="https://github.com/Thomas-Smyth/SquadJS/blob/master/squad-server/templates/SquadJS-Dashboard-v2.json">SquadJS Dashboard</a> to get a preconfigured MySQL only Grafana dashboard.</li>\n' +
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
    this.playerSession = {};

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
      'PlaySession',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },

        steamID: {
          type: DataTypes.STRING
        },

        lastName: {
          type: DataTypes.STRING
        },

        timePlayed: {
          type: DataTypes.INTEGER
        },

        start: {
          type: DataTypes.DATE
        },

        end: {
          type: DataTypes.DATE
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
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

    this.models.Server.hasMany(this.models.PlaySession, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Wound, {
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Wound, {
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Death, {
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Death, {
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Revive, {
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Revive, {
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.SteamUser.hasMany(this.models.Revive, {
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
    this.onPlayerWounded = this.onPlayerWounded.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
    this.onPlayerRevived = this.onPlayerRevived.bind(this);
    this.onPlayerConnected = this.onPlayerConnected.bind(this);
    this.onPlayerDisconnected = this.onPlayerDisconnected.bind(this);
    this.startSession = this.startSession.bind(this);
    this.saveSession = this.saveSession.bind(this);
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
    await this.models.PlaySession.sync();
    await this.models.Wound.sync();
    await this.models.Death.sync();
    await this.models.Revive.sync();
  }

  async mount() {
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
    this.server.on('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.on('PLAYER_DIED', this.onPlayerDied);
    this.server.on('PLAYER_REVIVED', this.onPlayerRevived);
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.on('PLAYER_DISCONNECTED', this.onPlayerDisconnected);

    for (const steamID of Object.keys(this.playerSession))
      await this.startSession(steamID, this.playerSession[steamID].name, new Date());
  }

  async unmount() {
    this.server.removeEventListener('TICK_RATE', this.onTickRate);
    this.server.removeEventListener('UPDATED_A2S_INFORMATION', this.onTickRate);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.removeEventListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeEventListener('PLAYER_REVIVED', this.onPlayerRevived);
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.removeEventListener('PLAYER_DISCONNECTED', this.onPlayerDisconnected);

    for (const steamID of Object.keys(this.playerSession))
      await this.saveSession(steamID, new Date(), false);
  }

  async onTickRate(info) {
    await this.models.TickRate.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      time: info.time,
      tickRate: info.tickRate
    });
  }

  async onUpdatedA2SInformation() {
    await this.models.PlayerCount.create({
      server: this.options.overrideServerID || this.server.id,
      match: this.match ? this.match.id : null,
      players: this.server.a2sPlayerCount,
      publicQueue: this.server.publicQueue,
      reserveQueue: this.server.reserveQueue
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
      await this.models.SteamUser.upsert({
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      });
    if (info.victim)
      await this.models.SteamUser.upsert({
        steamID: info.victim.steamID,
        lastName: info.victim.name
      });

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
      await this.models.SteamUser.upsert({
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      });
    if (info.victim)
      await this.models.SteamUser.upsert({
        steamID: info.victim.steamID,
        lastName: info.victim.name
      });

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
      await this.models.SteamUser.upsert({
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      });
    if (info.victim)
      await this.models.SteamUser.upsert({
        steamID: info.victim.steamID,
        lastName: info.victim.name
      });
    if (info.reviver)
      await this.models.SteamUser.upsert({
        steamID: info.reviver.steamID,
        lastName: info.reviver.name
      });

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
    if (!info || !info.player) return;

    await this.startSession(info.player.steamID, info.player.name, info.time);
  }

  async onPlayerDisconnected(info) {
    if (!info || !info.player) return;

    await this.saveSession(info.player.steamID, info.time);
  }

  async startSession(steamID, name, startTime) {
    const session = await this.models.PlaySession.create({
      server: this.options.overrideServerID || this.server.id,
      steamID,
      lastName: name,
      timePlayed: 0,
      start: startTime,
      end: startTime
    });

    this.playerSession[steamID] = {
      sessionId: session.id,
      name,
      start: Math.floor(Date.now() / 1000)
    };
  }

  async saveSession(steamID, endTime, deleteFromMemory = true) {
    const session = this.playerSession[steamID];

    // If the bot was started in the middle of the match and player was not added
    // Eg. bot has crashed and was restarted by PM2
    if (!session) return;

    const dbSession = await this.models.PlaySession.findOne({ where: { id: session.sessionId } });

    if (!dbSession) {
      delete this.playerSession[steamID];
      return;
    }

    dbSession.timePlayed = dbSession.timePlayed + (Math.floor(Date.now() / 1000) - session.start);
    dbSession.end = endTime;

    await dbSession.save();

    if (deleteFromMemory) delete this.playerSession[steamID];
  }
}
