import BasePlugin from './base-plugin.js';
import Logger from 'core/logger';

export default class AutoKickAFK extends BasePlugin {
  static get description() {
    return 'The <code>AutoKickAFK</code> plugin will automatically kick players that are not in a squad after a specified ammount of time.';
  }

  static get defaultEnabled() {
    return true;
  }

  static get optionsSpecification() {
    return {
      warningMessage: {
        required: false,
        description: 'Message SquadJS will send to players warning them they will be kicked',
        default: 'Join a squad, you are are unassigned and will be kicked'
      },
      kickMessage: {
        required: false,
        description: 'Message to send to players when they are kicked',
        default: 'Unassigned - automatically removed'
      },
      frequencyOfWarnings: {
        required: false,
        description: 'How often in seconds should we warn the player about being AFK?',
        default: 30
      },
      afkTimer: {
        required: false,
        description: 'How long in minutes to wait before a player that is AFK is kicked',
        default: 6
      },
      playerThreshold: {
        required: false,
        description:
          'Player count required for Auto Kick to start kicking players to disable set to -1 to disable',
        default: 93
      },
      queueThreshold: {
        required: false,
        description:
          'The number of players in the queue before Auto Kick starts kicking players set to -1 to disable',
        default: -1
      },
      roundStartDelay: {
        required: false,
        description:
          'Time delay in minutes from start of the round before auto AFK starts kicking again',
        default: 15
      },
      ignoreAdmins: {
        required: false,
        description: 'Whether or not admins will be auto kicked for being unassigned',
        default: false
      }
    };
  }

  /**
   * trackedPlayers[<steam64ID>] = <tracker>
   *
   *  <tracker> = {
   *         player: <playerObj>
   *       warnings: <int>
   *      startTime: <Epoch Date>
   *    warnTimerID: <intervalID>
   *    kickTimerID: <timeoutID>
   *  }
   */
  constructor(server, options) {
    super();

    this.server = server;
    this.options = options;

    this.kickTimeout = options.afkTimer * 60 * 1000;
    this.warningInterval = options.frequencyOfWarnings * 1000;
    this.gracePeriod = options.roundStartDelay * 60 * 1000;

    this.trackingListUpdateFrequency = 1 * 60 * 1000; // 1min
    this.cleanUpFrequency = 20 * 60 * 1000; // 20min

    this.betweenRounds = false;

    this.trackedPlayers = {};

    server.on('NEW_GAME', async (info) => {
      this.betweenRounds = true;
      this.updateTrackingList();
      setTimeout(async () => {
        this.betweenRounds = false;
      }, this.gracePeriod);
    });

    server.on('PLAYER_SQUAD_CHANGE', async (player) => {
      if (player.steamID in this.trackedPlayers && player.squadID !== null) {
        this.untrackPlayer(player.steamID);
      }
    });

    // tracking list update loop
    setInterval(this.updateTrackingList.bind(this), this.trackingListUpdateFrequency);

    // clean up every 20 minutes, removes players no longer on the server that may be stuck in the tracking dict
    const cleanupMS = 20 * 60 * 1000;
    setInterval(() => {
      for (const steamID of Object.keys(this.trackedPlayers))
        if (!(steamID in server.players.map((p) => p.steamID))) this.untrackPlayer(steamID);
    }, cleanupMS);
  }

  runConditions() {
    // return true; // force run for testing
    const queueMet =
      this.options.queueThreshold > 0 < this.server.publicQueue + this.server.reserveQueue;
    const countMet = this.options.playerCountThreshold > 0 < this.server.players.count;
    return !this.betweenRounds && (queueMet || countMet);
  }

  async updateTrackingList(forceUpdate = false) {
    if (!this.runConditions()) {
      // clear all tracked players if run conditions are not met.
      for (const steamID of Object.keys(this.trackedPlayers)) this.untrackPlayer(steamID);
      return;
    }

    if (forceUpdate) await this.server.updatePlayerList();

    // loop through players on server and start tracking players not in a squad
    for (const player of this.server.players) {
      const isTracked = player.steamID in this.trackedPlayers;
      const isUnassigned = player.squadID === null;
      const isAdmin =
        player.steamID in this.server.admins.map((a) => a.steamID) && this.options.ignoreAdmins;

      // start tracking player
      if (isUnassigned && !isTracked && !isAdmin)
        this.trackedPlayers[player.steamID] = this.trackPlayer(player);

      // tracked player joined a squad remove them (redundant afer adding PLAYER_SQUAD_CHANGE, keeping for now)
      if (!isUnassigned && isTracked) this.untrackPlayer(player.steamID);
    }
  }

  msFormat(ms) {
    // take in generic # of ms and return formatted MM:SS
    const min = Math.floor((ms / 1000 / 60) << 0);
    const sec = Math.floor((ms / 1000) % 60);
    return `${min}:${sec}`;
  }

  trackPlayer(player) {
    Logger.verbose('AutoAFK', 1, `Tracking: ${player.name}`);

    const tracker = {
      player: player,
      warnings: 0,
      startTime: Date.now()
    };

    // continuously warn player at rate set in options
    tracker.warnTimerID = setInterval(async () => {
      const timeLeft = this.msFormat(this.kickTimeout - (Date.now() - tracker.startTime));

      this.server.rcon.warn(player.steamID, `${this.options.warningMessage} - ${timeLeft}`);
      Logger.verbose('AutoAFK', 1, `Warning: ${player.name} (${timeLeft})`);
      tracker.warnings++;
    }, this.warningInterval);

    // set timeout to kick player
    tracker.kickTimerID = setTimeout(async () => {
      // ensures player is still afk
      await this.updateTrackingList(true);

      this.server.rcon.kick(player.steamID, this.options.kickMessage);
      this.server.emit('PLAYER_AFK_KICKED', tracker);
      Logger.verbose('AutoAFK', 1, `Kicked: ${player.name}`);
      this.untrackPlayer(player.steamID);
    }, this.kickTimeout);
    return tracker;
  }

  untrackPlayer(steamID) {
    const tracker = this.trackedPlayers[steamID];
    // clear player warning interval
    clearInterval(tracker.warnTimerID);
    // clear player kick timeout
    clearTimeout(tracker.kickTimerID);
    // remove player tracker
    delete this.trackedPlayers[steamID];
    Logger.verbose('AutoAFK', 1, `[AutoAFK] unTrack: ${tracker.player.name}`);
  }
}
