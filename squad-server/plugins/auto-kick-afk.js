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

  constructor(server, options) {
    super();

    this.kickTimeout = options.afkTimer * 60 * 1000;
    this.warningInterval = options.frequencyOfWarnings * 1000;
    this.gracePeriod = options.roundStartDelay * 60 * 1000;

    this.betweenRounds = false;

    this.trackedPlayers = {};

    server.on('NEW_GAME', async (info) => {
      this.betweenRounds = true;
      updateTrackingList();
      setTimeout(async () => {
        this.betweenRounds = false;
      }, this.gracePeriod);
    });

    server.on('PLAYER_SQUAD_CHANGE', async (player) => {
      if (player.steamID in this.trackedPlayers && player.squadID !== null) {
        untrackPlayer(player.steamID);
      }
    });

    const runConditions = () => {
      // return true; // force run for testing
      return (
        !this.betweenRounds ||
        options.playerCountThreshold > 0 < server.players.count ||
        options.queueThreshold > 0 < server.publicQueue + server.reserveQueue
      );
    };

    const updateTrackingList = async () => {
      if (!runConditions()) {
        // clear all tracked players if run conditions are not met.
        for (const steamID of Object.keys(this.trackedPlayers)) untrackPlayer(steamID);
        return;
      }

      // await server.updatePlayerList(); //possibly unneeded as updates to player list are already common

      // loop through players on server and start tracking players not in a squad
      for (const player of server.players) {
        const isTracked = player.steamID in this.trackedPlayers;
        const isUnassigned = player.squadID === null;
        const isAdmin =
          player.steamID in server.admins.map((a) => a.steamID) && options.ignoreAdmins;

        if (isUnassigned && !isTracked && !isAdmin)
          this.trackedPlayers[player.steamID] = trackPlayer(player); // start tracking player
        if (!isUnassigned && isTracked) untrackPlayer(player.steamID); // tracked player joined a squad remove them (redundant afer addming PLAYER_SQUAD_CHANGE, keeping for now)
      }
    };

    const msFormat = (ms) => {
      const min = Math.floor((ms / 1000 / 60) << 0);
      const sec = Math.floor((ms / 1000) % 60);
      return `${min}:${sec}`;
    };

    const trackPlayer = (player) => {
      Logger.verbose('AutoAFK', 1, `Tracking: ${player.name}`);
      const tracker = {};
      tracker.player = player;
      tracker.warnings = 0;
      tracker.startTime = Date.now();
      tracker.warnTimerID = setInterval(async () => {
        const timeLeft = msFormat(this.kickTimeout - (Date.now() - tracker.startTime));
        Logger.verbose('AutoAFK', 1, `Warning: ${player.name} (${timeLeft})`);
        server.rcon.warn(player.steamID, `${options.warningMessage} - ${timeLeft}`);
        tracker.warnings++;
      }, this.warningInterval);

      tracker.kickTimerID = setTimeout(async () => {
        Logger.verbose('AutoAFK', 1, `Kicked: ${player.name}`);
        server.rcon.kick(player.steamID, options.kickMessage);
        untrackPlayer(player.steamID);
      }, this.kickTimeout);
      return tracker;
    };

    const untrackPlayer = (steamID) => {
      const tracker = this.trackedPlayers[steamID];
      server.emit('PLAYER_AFK_KICKED', tracker);
      Logger.verbose('AutoAFK', 1, `[AutoAFK] unTrack: ${tracker.player.name}`);
      clearInterval(tracker.warnTimerID); // clears warning interval
      clearTimeout(tracker.kickTimerID); // clears kick timeout
      delete this.trackedPlayers[steamID];
    };

    setInterval(updateTrackingList, 1 * 60 * 1000); // tracking list update loop

    // clean up every 20 minutes, removes players no longer on the server that may be stuck in the tracking dict
    const cleanupMS = 20 * 60 * 1000;
    setInterval(() => {
      for (const steamID of Object.keys(this.trackedPlayers))
        if (!(steamID in server.players.map((p) => p.steamID))) untrackPlayer(steamID);
    }, cleanupMS);
  }
}
