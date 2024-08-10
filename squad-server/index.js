import Logger from 'core/logger';

import { Layers } from './layers/index.js';

import LogParser from './log-parser/index.js';
import Rcon from './rcon.js';

import fetchAdminLists from './utils/admin-lists.js';
import { isPlayerID, anyIDToPlayer, anyIDsToPlayers } from './utils/any-id.js';
import { playerIdNames } from 'core/id-parser';

export default class SquadServer {
  constructor(options = {}) {
    for (const option of ['host'])
      if (!(option in options)) throw new Error(`${option} must be specified.`);

    this.id = options.id;
    this.options = options;

    this.layerHistory = [];
    this.layerHistoryMaxLength = options.layerHistoryMaxLength || 20;

    this.players = [];

    this.squads = [];

    this.admins = {};
    this.adminsInAdminCam = {};

    this.setupRCON();
    this.setupLogParser();

    this.updatePlayerList = this.updatePlayerList.bind(this);
    this.updatePlayerListInterval = 30 * 1000;
    this.updatePlayerListTimeout = null;

    this.updateSquadList = this.updateSquadList.bind(this);
    this.updateSquadListInterval = 30 * 1000;
    this.updateSquadListTimeout = null;

    this.updateLayerInformation = this.updateLayerInformation.bind(this);
    this.updateLayerInformationInterval = 30 * 1000;
    this.updateLayerInformationTimeout = null;

    this.updateA2SInformation = this.updateA2SInformation.bind(this);
    this.updateA2SInformationInterval = 30 * 1000;
    this.updateA2SInformationTimeout = null;

    this.plugins = [];
  }

  async watch() {
    Logger.verbose(
      'SquadServer',
      1,
      `Beginning to watch ${this.options.host}:${this.options.queryPort}...`
    );

    await Layers.pull();

    this.admins = await fetchAdminLists(this.options.adminLists);

    await this.rcon.connect();
    await this.updateSquadList();
    await this.updatePlayerList(this);
    await this.updateLayerInformation();
    await this.updateA2SInformation();

    await this.logParser.watch();

    Logger.verbose('SquadServer', 1, `Watching ${this.serverName}...`);
  }

  async unwatch() {
    await this.rcon.disconnect();
    await this.logParser.unwatch();
  }

  setupRCON() {
    this.rcon = new Rcon({
      host: this.options.rconHost || this.options.host,
      port: this.options.rconPort,
      password: this.options.rconPassword,
      autoReconnectInterval: this.options.rconAutoReconnectInterval
    });

    // Handle chat messages.
    this.rcon.on('CHAT_MESSAGE', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      // Inform plugins of event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onChatMessage(data))
      );
    });

    this.rcon.on('POSSESSED_ADMIN_CAMERA', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      // Record what time the admin entered the admin camera.
      this.adminsInAdminCam[data.eosID] = data.time;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerPossessAdminCamera(data))
      );
    });

    this.rcon.on('UNPOSSESSED_ADMIN_CAMERA', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      if (this.adminsInAdminCam[data.eosID]) {
        data.duration = data.time.getTime() - this.adminsInAdminCam[data.eosID].getTime();
      } else {
        data.duration = 0;
      }

      // Remove the admin from the list of admins currently in the admin camera.
      delete this.adminsInAdminCam[data.eosID];

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerUnPossessAdminCamera(data))
      );
    });

    this.rcon.on('RCON_ERROR', async (data) => {
      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onRconError(data)));
    });

    this.rcon.on('PLAYER_WARNED', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByName(data.name);

      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onPlayerWarn(data)));
    });

    this.rcon.on('PLAYER_KICKED', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onPlayerKick(data)));
    });

    this.rcon.on('PLAYER_BANNED', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onPlayerBan(data)));
    });

    this.rcon.on('SQUAD_CREATED', async (data) => {
      // Get additional player data.
      data.player = await this.getPlayerByEOSID(data.playerEOSID, true);
      data.player.squadID = data.squadID;

      // Delete player's name from data.
      delete data.playerName;

      // Delete player's ids from data?
      for (const k in data) if (k.startsWith('player') && k.endsWith('ID')) delete data[k];

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onSquadCreate(data))
      );
    });
  }

  async restartRCON() {
    try {
      await this.rcon.disconnect();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to stop RCON instance when restarting.', err);
    }

    Logger.verbose('SquadServer', 1, 'Setting up new RCON instance...');
    this.setupRCON();
    await this.rcon.connect();
  }

  setupLogParser() {
    this.logParser = new LogParser({
      mode: this.options.logReaderMode,
      logDir: this.options.logDir,
      sftp: this.options.sftp,
      ftp: this.options.ftp
    });

    this.logParser.on('ADMIN_BROADCAST', async (data) => {
      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onAdminBroadcast(data))
      );
    });

    this.logParser.on('DEPLOYABLE_DAMAGED', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByNameSuffix(data.playerSuffix);

      // Delete player's suffix from data.
      delete data.playerSuffix;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onDeployableDamage(data))
      );
    });

    this.logParser.on('NEW_GAME', async (data) => {
      // Get additional data.
      data.layer = await Layers.getLayerByClassname(data.layerClassname);

      // Update layer history.
      this.layerHistory.unshift({ layer: data.layer, time: data.time });
      this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);

      // Update the current layer.
      this.currentLayer = data.layer;

      // Update admin lists.
      await this.updateAdmins();

      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onRoundStart(data)));
    });

    this.logParser.on('JOIN_SUCCEEDED', async (data) => {
      // Log that a player connected.
      Logger.verbose(
        'SquadServer',
        1,
        `Player connected ${data.playerSuffix} - SteamID: ${data.steamID} - EOSID: ${data.eosID} - IP: ${data.ip}`
      );

      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);
      if (data.player) data.player.suffix = data.playerSuffix;

      // Delete the player's suffix from the data.
      delete data.playerSuffix;

      // Delete the player's ids from the data.
      for (const k in data) if (playerIdNames.includes(k)) delete data[k];

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerConnection(data))
      );
    });

    this.logParser.on('PLAYER_DISCONNECTED', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.eosID);

      // Delete player's ids from data.
      for (const k in data) if (playerIdNames.includes(k)) delete data[k];

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerDisconnection(data))
      );
    });

    this.logParser.on('PLAYER_DAMAGED', async (data) => {
      // Get additional data.
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);

      if (data.attacker && !data.attacker.playercontroller && data.attackerController)
        data.attacker.playercontroller = data.attackerController;

      if (data.victim && data.attacker) {
        data.teamkill =
          data.victim.teamID === data.attacker.teamID && data.victim.eosID !== data.attacker.eosID;
      }

      // Delete players' names from data.
      delete data.victimName;
      delete data.attackerName;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerDamage(data))
      );
    });

    this.logParser.on('PLAYER_WOUNDED', async (data) => {
      // Get additional data.
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);

      if (!data.attacker)
        data.attacker = await this.getPlayerByController(data.attackerPlayerController);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID && data.victim.eosID !== data.attacker.eosID;

      // Delete players' names from data.
      delete data.victimName;
      delete data.attackerName;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerWound(data))
      );

      if (data.teamkill) {
        // Inform the plugins of the event.
        await Promise.allSettled(
          this.plugins.map(async (plugin) => await plugin.onPlayerTeamkill(data))
        );
      }
    });

    this.logParser.on('PLAYER_DIED', async (data) => {
      // Get additional data.
      data.victim = await this.getPlayerByName(data.victimName);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);

      if (!data.attacker)
        data.attacker = await this.getPlayerByController(data.attackerPlayerController);

      if (data.victim && data.attacker)
        data.teamkill =
          data.victim.teamID === data.attacker.teamID && data.victim.eosID !== data.attacker.eosID;

      // Delete players' names from data.
      delete data.victimName;
      delete data.attackerName;

      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onPlayerDie(data)));
    });

    this.logParser.on('PLAYER_REVIVED', async (data) => {
      // Get additional data.
      data.victim = await this.getPlayerByEOSID(data.victimEOSID);
      data.attacker = await this.getPlayerByEOSID(data.attackerEOSID);
      data.reviver = await this.getPlayerByEOSID(data.reviverEOSID);

      // Delete players' names from data.
      delete data.victimName;
      delete data.attackerName;
      delete data.reviverName;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerRevive(data))
      );
    });

    this.logParser.on('PLAYER_POSSESS', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.playerEOSID);
      if (data.player) data.player.possessClassname = data.possessClassname;

      // Delete player's suffix from data.
      delete data.playerSuffix;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerPossess(data))
      );
    });

    this.logParser.on('PLAYER_UNPOSSESS', async (data) => {
      // Get additional data.
      data.player = await this.getPlayerByEOSID(data.playerEOSID);

      // Delete player's suffix from data.
      delete data.playerSuffix;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerUnPossess(data))
      );
    });

    this.logParser.on('ROUND_ENDED', async (data) => {
      // Inform the plugins of the event.
      await Promise.allSettled(this.plugins.map(async (plugin) => await plugin.onRoundEnd(data)));
    });

    this.logParser.on('TICK_RATE', async (data) => {
      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onTickRateUpdate(data))
      );
    });
  }

  async restartLogParser() {
    try {
      await this.logParser.unwatch();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to stop LogParser instance when restarting.', err);
    }

    Logger.verbose('SquadServer', 1, 'Setting up new LogParser instance...');
    this.setupLogParser();
    await this.logParser.watch();
  }

  /**
   * @deprecated Kept for backwards compatibility with custom plugins.
   */
  getAdminPermsBySteamID(steamID) {
    return this.getAdminPermsByAnyID(steamID);
  }

  getAdminPermsByAnyID(anyID) {
    // using this.players directly to keep the function sync
    const player = anyIDToPlayer(anyID, this.players);
    if (player === undefined) return;
    for (const idName of playerIdNames)
      if (player[idName] in this.admins) return this.admins[player[idName]];
  }

  /**
   * Get ids of every admin that has the permission.
   * @overload
   * @arg {string} perm - permission to filter with.
   * @arg {('steamID'|'eosID'|'anyID')} type - return IDs of selected
   *   type. For <code>'steamID'</code> returns all matching steam IDs
   *   from admins lists plus maps online admins from eosIDs to steamIDs
   *   if both IDs are provided (and vice versa for
   *   <code>'eosID'</code>). For <code>'anyID'</code> returns both
   *   steam and eos IDs as is, no remapping applied.
   * @returns {string[]}
   */ /**
   * Get every admin that has the permission.
   * @overload
   * @arg {string} perm - permission to filter with.
   * @arg {'player'} type - return players instead of just IDs. Returns
   *   only admins that are online.
   * @returns {Player[]}
   */ /**
   * Get steamIDs of every admin that has the permission. This overload
   * exists for compatibility with pre-EOS API and is equivalent to
   * <code>getAdminsWithPermisson(perm, type='steamID')</code>.
   * @overload
   * @arg {string} perm - permission to filter with.
   * @returns {string[]}
   */
  getAdminsWithPermission(perm, type = 'steamID') {
    const steamRgx = /^\d{17}$/;
    const ret = [];
    for (const [anyID, perms] of Object.entries(this.admins)) {
      if (perm in perms) ret.push(anyID);
    }
    let filter = (ID) => ID.match(steamRgx) !== null; // true if steamID
    switch (type) {
      // 1) if admin is registered with steamID and is online then swap to eosID
      // 2) deduplicate output in case same admin was in 2 lists with different IDs
      case 'anyID':
        return [
          ...new Set(
            ret.map((ID) => {
              for (const adm of this.players) {
                if (isPlayerID(ID, adm)) return adm.eosID;
              }
              return ID;
            })
          )
        ];
      case 'player':
        return anyIDsToPlayers(ret, this.players);
      case 'eosID': {
        filter = (ID) => ID.match(steamRgx) === null;
        break;
      }
      case 'steamID':
        break;
      default:
        throw new Error(`Expected type == 'steamID'|'eosID'|'anyID'|'player', got '${type}'.`);
    }
    const matches = [];
    const fails = [];
    ret.forEach((ID) => (filter(ID) ? matches : fails).push(ID));
    if (fails.length) {
      const remappedIDs = anyIDsToPlayers(fails, this.players).map((player) => player[type]);
      // deduplicate output after remapping
      return [...new Set(matches.concat(remappedIDs))];
    }
    return matches;
  }

  async updateAdmins() {
    this.admins = await fetchAdminLists(this.options.adminLists);
  }

  async updatePlayerList() {
    if (this.updatePlayerListTimeout) clearTimeout(this.updatePlayerListTimeout);

    Logger.verbose('SquadServer', 1, `Updating player list...`);

    try {
      const oldPlayerInfo = {};
      for (const player of this.players) {
        oldPlayerInfo[player.eosID] = player;
      }

      const players = [];
      for (const player of await this.rcon.getListPlayers(this))
        players.push({
          ...oldPlayerInfo[player.eosID],
          ...player,
          playercontroller: this.logParser.eventStore.players[player.eosID]
            ? this.logParser.eventStore.players[player.eosID].controller
            : null,
          squad: await this.getSquadByID(player.teamID, player.squadID)
        });

      this.players = players;

      for (const player of this.players) {
        const oldInfo = oldPlayerInfo[player.eosID];
        if (oldInfo === undefined) continue;

        if (player.teamID !== oldInfo.teamID) {
          // Inform the plugins of the event.
          await Promise.allSettled(
            this.plugins.map(
              async (plugin) =>
                await plugin.onPlayerChangeTeam({
                  player: player,
                  oldTeamID: oldInfo.teamID,
                  newTeamID: player.teamID
                })
            )
          );
        }

        if (player.squadID !== oldInfo.squadID) {
          // Inform the plugins of the event.
          await Promise.allSettled(
            this.plugins.map(
              async (plugin) =>
                await plugin.onPlayerChangeSquad({
                  player: player,
                  oldSquadID: oldInfo.squadID,
                  newSquadID: player.squadID
                })
            )
          );
        }
      }

      if (this.a2sPlayerCount > 0 && players.length === 0)
        Logger.verbose(
          'SquadServer',
          1,
          `Real Player Count: ${this.a2sPlayerCount} but loaded ${players.length}`
        );

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onPlayerInformationUpdate())
      );
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update player list.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated player list.`);

    this.updatePlayerListTimeout = setTimeout(this.updatePlayerList, this.updatePlayerListInterval);
  }

  async updateSquadList() {
    if (this.updateSquadListTimeout) clearTimeout(this.updateSquadListTimeout);

    Logger.verbose('SquadServer', 1, `Updating squad list...`);

    try {
      this.squads = await this.rcon.getSquads();
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update squad list.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated squad list.`);

    this.updateSquadListTimeout = setTimeout(this.updateSquadList, this.updateSquadListInterval);
  }

  async updateLayerInformation() {
    if (this.updateLayerInformationTimeout) clearTimeout(this.updateLayerInformationTimeout);

    Logger.verbose('SquadServer', 1, `Updating layer information...`);

    try {
      const currentMap = await this.rcon.getCurrentMap();
      const nextMap = await this.rcon.getNextMap();
      const nextMapToBeVoted = nextMap.layer === 'To be voted';

      const currentLayer = await Layers.getLayerById(currentMap.layer);
      const nextLayer = nextMapToBeVoted ? null : await Layers.getLayerById(nextMap.layer);

      if (this.layerHistory.length === 0) {
        this.layerHistory.unshift({ layer: currentLayer, time: Date.now() });
        this.layerHistory = this.layerHistory.slice(0, this.layerHistoryMaxLength);
      }

      this.currentLayer = currentLayer;
      this.nextLayer = nextLayer;
      this.nextLayerToBeVoted = nextMapToBeVoted;

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onLayerInformationUpdate())
      );
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update layer information.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated layer information.`);

    this.updateLayerInformationTimeout = setTimeout(
      this.updateLayerInformation,
      this.updateLayerInformationInterval
    );
  }

  updateA2SInformation() {
    return this.updateServerInformation();
  }

  async updateServerInformation() {
    if (this.updateA2SInformationTimeout) clearTimeout(this.updateA2SInformationTimeout);

    Logger.verbose('SquadServer', 1, `Updating server information...`);

    try {
      const rawData = await this.rcon.execute(`ShowServerInfo`);
      Logger.verbose('SquadServer', 3, `Server information raw data`, rawData);
      const data = JSON.parse(rawData);
      Logger.verbose('SquadServer', 2, `Server information data`, JSON.data);

      const info = {
        raw: data,
        serverName: data.ServerName_s,

        maxPlayers: parseInt(data.MaxPlayers),
        publicQueueLimit: parseInt(data.PublicQueueLimit_I),
        reserveSlots: parseInt(data.PlayerReserveCount_I),

        playerCount: parseInt(data.PlayerCount_I),
        a2sPlayerCount: parseInt(data.PlayerCount_I),
        publicQueue: parseInt(data.PublicQueue_I),
        reserveQueue: parseInt(data.ReservedQueue_I),

        currentLayer: data.MapName_s,
        nextLayer: data.NextLayer_s,

        teamOne: data.TeamOne_s?.replace(new RegExp(data.MapName_s, 'i'), '') || '',
        teamTwo: data.TeamTwo_s?.replace(new RegExp(data.MapName_s, 'i'), '') || '',

        matchTimeout: parseFloat(data.MatchTimeout_d),
        matchStartTime: this.getMatchStartTimeByPlaytime(data.PLAYTIME_I),
        gameVersion: data.GameVersion_s
      };

      this.serverName = info.serverName;

      this.maxPlayers = info.maxPlayers;
      this.publicSlots = info.maxPlayers - info.reserveSlots;
      this.reserveSlots = info.reserveSlots;

      this.a2sPlayerCount = info.playerCount;
      this.playerCount = info.playerCount;
      this.publicQueue = info.publicQueue;
      this.reserveQueue = info.reserveQueue;

      this.matchTimeout = info.matchTimeout;
      this.matchStartTime = info.matchStartTime;
      this.gameVersion = info.gameVersion;

      if (!this.currentLayer) this.currentLayer = Layers.getLayerByClassname(info.currentLayer);
      if (!this.nextLayer) this.nextLayer = Layers.getLayerByClassname(info.nextLayer);

      // Inform the plugins of the event.
      await Promise.allSettled(
        this.plugins.map(async (plugin) => await plugin.onServerInformationUpdate())
      );
    } catch (err) {
      Logger.verbose('SquadServer', 1, 'Failed to update server information.', err);
    }

    Logger.verbose('SquadServer', 1, `Updated server information.`);

    this.updateA2SInformationTimeout = setTimeout(
      this.updateA2SInformation,
      this.updateA2SInformationInterval
    );
  }

  async getPlayerByCondition(condition, forceUpdate = false, retry = true) {
    let matches;

    if (!forceUpdate) {
      matches = this.players.filter(condition);
      if (matches.length === 1) return matches[0];

      if (!retry) return null;
    }

    await this.updatePlayerList();

    matches = this.players.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  async getSquadByCondition(condition, forceUpdate = false, retry = true) {
    let matches;

    if (!forceUpdate) {
      matches = this.squads.filter(condition);
      if (matches.length === 1) return matches[0];

      if (!retry) return null;
    }

    await this.updateSquadList();

    matches = this.squads.filter(condition);
    if (matches.length === 1) return matches[0];

    return null;
  }

  async getSquadByID(teamID, squadID) {
    if (squadID === null) return null;
    return this.getSquadByCondition(
      (squad) => squad.teamID === teamID && squad.squadID === squadID
    );
  }

  /**
   * @deprecated Kept for backwards compatibility with custom plugins.
   */
  async getPlayerBySteamID(steamID, forceUpdate) {
    return this.getPlayerByCondition((player) => player.steamID === steamID, forceUpdate);
  }

  async getPlayerByEOSID(eosID, forceUpdate) {
    return this.getPlayerByCondition((player) => player.eosID === eosID, forceUpdate);
  }

  async getPlayerByAnyID(anyID, forceUpdate) {
    return this.getPlayerByCondition(
      (player) =>
        Object.entries(player).filter(([parm, val]) => parm.endsWith('ID') && val === anyID).length,
      forceUpdate
    );
  }

  async getPlayerByName(name, forceUpdate) {
    return this.getPlayerByCondition((player) => player.name === name, forceUpdate);
  }

  async getPlayerByNameSuffix(suffix, forceUpdate) {
    return this.getPlayerByCondition((player) => player.suffix === suffix, forceUpdate, false);
  }

  async getPlayerByController(controller, forceUpdate) {
    return this.getPlayerByCondition(
      (player) => player.playercontroller === controller,
      forceUpdate
    );
  }

  getMatchStartTimeByPlaytime(playtime) {
    return new Date(Date.now() - +playtime * 1000);
  }

  async mountPlugin(plugin) {
    // Tell the plugin it is being mounted.
    await plugin.mount();

    // Add the plugin to the list of mounted plugins.
    this.plugins.push(plugin);
  }
}
