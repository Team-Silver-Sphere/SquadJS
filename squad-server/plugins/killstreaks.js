//Plugin by PSG - Ignis - Press Start Gaming
import BasePlugin from './base-plugin.js';

export default class Killstreak extends BasePlugin {
  static get description() {
    return 'The <code>Killstreak</code> plugin broadcasts when players are on a killstreak.';
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      killstreakThreshold: {
        required: false,
        description: 'The number of kills required to be on a killstreak.',
        default: 10
      },
      allowChatCommand: {
        required: false,
        description: 'Allow players to check their current killstreak with a chat command.',
        default: false
      },
      chatCommand: {
        required: false,
        description: 'Chat Command for Players to see their Current Killstreak.',
        default: '!killstreak'
      },
      cmdCooldown: {
        required: false,
        description: 'How frequently in minutes a user can use the chat command.',
        default: 15
      },
      broadcastMessages: {
        required: false,
        description: 'The broadcast messages for each multiple of the killstreak threshold.',
        default: [
            "${attackerName} is on a 10 Killstreak, keep up the momentum!",
            "${attackerName} is on a 20 Killstreak, no one can touch you!",
            "${attackerName} is on a 30 Killstreak, you're on a killing spree!",
            "${attackerName} is on a 40 Killstreak, the battlefield trembles before you!",
            "${attackerName} is on a 50 Killstreak, your enemies are powerless to stop you!",
            "${attackerName} is on a 60 Killstreak, leave no survivors!",
            "${attackerName} is on a 70 Killstreak, the world quakes in fear!",
            "${attackerName} is on a 80 Killstreak, you're a force of nature!",
            "${attackerName} is on a 90 Killstreak, the battlefield is your domain!",
            "${attackerName} is on a 100 Killstreak, you're a living legend among warriors!",
            "${attackerName} is on a 110 Killstreak, you can turn those cheats off now!",
            "${attackerName} is on a 120 Killstreak, seriously, turn off the cheats!",
            "${attackerName} is on a 130 Killstreak, you're just showing off now!",
            "${attackerName} is on a 140 Killstreak, you're a god among mortals!",
            "${attackerName} is on a 150 Killstreak, you're a force of nature!",
          ]
      },
      buzzkillMessages: {
        required: false,
        description: 'The broadcast message when a player is killed while on a killstreak.',
        default: [
            'BUZZKILLER! ${attackerName} deleted ${victimName} who had a Killstreak of ${killstreak}!',
            'BUZZKILLER! ${attackerName} deleted ${victimName} who was on a ${killstreak} Killstreak!'
            ]
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.trackedKillstreaks = {};
    if (this.options.allowChatCommand) {
      this.onChatCommand = this.onChatCommand.bind(this);
    }
    this.onWound = this.onWound.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.onPlayerDisconnected = this.onPlayerDisconnected.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
  }

  async mount() {
    this.server.on('NEW_GAME', this.onNewGame);
    this.server.on('PLAYER_WOUNDED', this.onWound);
    this.server.on('PLAYER_DIED', this.onPlayerDied);
    this.server.on('PLAYER_DISCONNECTED', this.onPlayerDisconnected);
    if (this.options.allowChatCommand) {
      this.server.on(`CHAT_COMMAND:${this.options.chatCommand}`, this.onChatCommand);
    }
    this.verbose(1, 'Killstreaks Plugin was Mounted.');
  }

  async unmount() {
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('PLAYER_WOUNDED', this.onWound);
    this.server.removeEventListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeEventListener('PLAYER_DISCONNECTED', this.onPlayerDisconnected);
    if (this.options.allowChatCommand) {
      this.server.removeEventListener(`CHAT_COMMAND:${this.options.chatCommand}`, this.onChatCommand);
    }
    this.verbose(1, 'Killstreaks Plugin was Unmounted.');
  }

  async onWound(info) {
    if (!info.attacker) return;
    if (info.teamkill === true) return;

    // Get the attacker's Steam ID
    const eosID = info.attackerEOSID;

    // Check if this is the first time the attacker has made a killstreak
    if (!this.trackedKillstreaks.hasOwnProperty(eosID)) {
      // Set the player's initial killstreak to 0
      this.trackedKillstreaks[eosID] = 0;
    }

    // Increment the player's kill streak by 1
    this.trackedKillstreaks[eosID] += 1;

    // Get the current killstreak index and value for the attacker
    let killstreakIndex = this.trackedKillstreaks[eosID];

    // Log the current killstreak value for debugging purposes
    this.verbose(2, `KillstreakIndex for ${eosID}: ${killstreakIndex}`);

    // Check if the attacker has reached the killstreak threshold
    if (killstreakIndex % this.options.killstreakThreshold === 0) {
      // Get the index of the current killstreak multiple
      const multipleIndex = killstreakIndex / this.options.killstreakThreshold;

      // Get the message for the current multiple from the config.json file
      const messages = this.options.broadcastMessages || [];
      const message =
        messages[multipleIndex - 1] || `${attackerName} is on a ${killstreakIndex} Killstreak!`;
      const broadcastText = this.replaceVariables(message, { attackerName: info.attacker.name });

      this.server.rcon.broadcast(broadcastText);
    }
  }

  async onPlayerDied(info) {
    if (!info.victim.eosID) return;

    // GC Factions to Account for Driods instant death
    const gcDroidFactions = [
      'Droid Army',
      'Droid Army - Lego',
      'Droid Army - SpecOps',
      'Droid Army - Camo',
      'Droid Army - Snow',
      'Droid Army - Mech',
      'Droid Army - Halloween',
      'Droid Army - Geonosis'
    ];

    // If info.victim.squad.teamName is in gcDroidFactions
    if (gcDroidFactions.includes(info.victim.squad.teamName)) {
      this.verbose(2, `Droid Army Detected: ${info.victim.squad.teamName}`);
      // Call the onWound function with the info object
      this.onWound(info);
    }
    const eosID = info.victim.eosID;
    
    // Check if the victim has a killstreak
    if (this.trackedKillstreaks.hasOwnProperty(eosID)) {
      const killstreak = this.trackedKillstreaks[eosID];
      if (killstreak >= this.options.killstreakThreshold) {
        const killer = info.attacker;
        if (killer) {
          const messages = this.options.buzzkillMessages || [];
          const message = messages[Math.floor(Math.random() * messages.length)] || 'BUZZKILLER! ${attackerName} deleted ${victimName} who was on a ${killstreak} Killstreak!';
          const broadcastText = this.replaceVariables(message, { attackerName: killer.name, victimName: info.victim.name, killstreak: killstreak });
          this.server.rcon.broadcast(broadcastText);
        }
      }
      delete this.trackedKillstreaks[eosID];
    } else {
      delete this.trackedKillstreaks[eosID];
    }
    this.verbose(2, `KillstreakIndex reset for ${eosID} ${info.victim.name}`);
  }

  async onPlayerDisconnected(info) {
    if (!info.eosID) return;
    const eosID = info.eosID;
    delete this.trackedKillstreaks[eosID];
  }

  async onNewGame() {
    // Get an array of all the Steam IDs in the trackedKillstreaks object
    const eosIDs = Object.keys(this.trackedKillstreaks);

    // Loop through the array and delete each key-value pair
    for (const eosID of eosIDs) {
      delete this.trackedKillstreaks[eosID];
    }
  }

  async onChatCommand(info) {
    const currentTime = Date.now();
    const lastExecutedTimes = this.lastChatCommandExecutionTimes || {};
    const cooldownTime = this.options.cmdCooldown;
    const eosID = info.player.eosID;
    const lastExecutedTime = lastExecutedTimes[eosID] || 0;
    const timeSinceLastExecution = (currentTime - lastExecutedTime) / 1000;

    if (timeSinceLastExecution < cooldownTime) {
      await this.server.rcon.warn(
        eosID,
        `Please wait ${Math.ceil(
          cooldownTime - timeSinceLastExecution
        )} minute(s) before using this command again.`
      );
      return;
    }

    const currentKillstreak = this.trackedKillstreaks[eosID] || 0;

    await this.server.rcon.warn(
      eosID,
      `Current Killstreak: ${currentKillstreak}`
    );

    // Update last execution time
    lastExecutedTimes[eosID] = currentTime;
    this.lastChatCommandExecutionTimes = lastExecutedTimes;
  }

  replaceVariables(message, variables) {
    for (const [variableName, variableValue] of Object.entries(variables)) {
      const placeholder = '${' + variableName + '}';
      message = message.replace(placeholder, variableValue);
    }
    return message;
  }
}