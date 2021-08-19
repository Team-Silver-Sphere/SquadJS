import CoreServer from '../core/server.js';

import Player from './player.js';
import Squad from './squad.js';
import Team from './team.js';

import AdminBroadcast from './events/admin-broadcast.js';
import ChatMessage from './events/chat-message.js';
import DeployableDamaged from './events/deployable-damaged.js';
import GeneralServerInformationUpdated from './events/general-server-information-updated.js';
import LayerChanged from './events/layer-changed.js';
import LayerInformationUpdated from './events/layer-information-updated.js';
import PlayerBanned from './events/player-banned.js';
import PlayerCreated from './events/player-created.js';
import PlayerDamaged from './events/player-damaged.js';
import PlayerDeleted from './events/player-deleted.js';
import PlayerDied from './events/player-died.js';
import PlayerKicked from './events/player-kicked.js';
import PlayerPossessedAdminCamera from './events/player-possessed-admin-camera.js';
import PlayerRevived from './events/player-revived.js';
import PlayerUnpossessedAdminCamera from './events/player-unpossessed-admin-camera.js';
import PlayerUpdated from './events/player-updated.js';
import PlayerWarned from './events/player-warned.js';
import PlayerWounded from './events/player-wounded.js';
import SquadCreated from './events/squad-created.js';
import SquadDeleted from './events/squad-deleted.js';
import SquadUpdated from './events/squad-updated.js';
import TeamsAndSquadsUpdated from './events/teams-and-squads-updated.js';
import TickRateUpdated from './events/tick-rate-updated.js';

import logger from '../utils/logger.js';

export default class SquadServer extends CoreServer {
  constructor(options = {}) {
    // Initialise parent class.
    super(options);

    // Initialise empty server information variables.
    this.name = null;
    this.version = null;

    this.playerSlots = null;
    this.publicSlots = null;
    this.reserveSlots = null;

    this.playerCount = null;
    this.publicQueueLength = null;
    this.reserveQueueLength = null;

    this.matchTimeout = null;

    this.currentLevel = null;
    this.currentLayer = null;
    this.nextLevel = null;
    this.nextLayer = null;

    this.teams = [];
    this.squads = [];
    this.players = [];

    // Define log parsing rules.
    this.logLineHandlers = [
      {
        name: 'Tick Rate',
        handles: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: USQGameState: Server Tick Rate: ([0-9.]+)/,
        handle: (match) => {
          this.emitEvent(
            new TickRateUpdated(this, {
              raw: match[0],
              time: match[1],
              chainID: parseInt(match[2]),
              tickRate: parseFloat(match[3])
            })
          );
        }
      },
      {
        name: 'Start Match',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogGameMode: Display: Match State Changed from WaitingToStart to InProgress/,
        handle: async () => {
          // Reset teams and squads from previous round.
          this.teams = [];
          this.squads = [];
          this.players.map((player) => {
            player.team = null;
            player.squad = null;
          });

          // Start collecting data again.
          await this.refreshLayerInformation();
          await this.refreshTeamsAndSquads();
          await this.refreshPlayers();
        }
      },
      {
        name: 'Post Match',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogGameMode: Display: Match State Changed from InProgress to WaitingPostMatch/,
        handle: () => {
          // Stop collecting data during map change.
          this.stopIntervaledTask('refreshLayerInformation');
          this.stopIntervaledTask('refreshTeamsAndSquads');
          this.stopIntervaledTask('refreshPlayers');
        }
      },
      {
        name: 'Squad Created',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) \(Steam ID: ([0-9]{17})\) has created Squad ([0-9]+) \(Squad Name: (.+)\) on (.+)/,
        handle: async () => {
          // Refresh the squads list if we detect a new squad being created.
          await this.refreshTeamsAndSquads();
        }
      },
      {
        name: 'Player Damaged',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) caused by ([A-z_0-9]+)/,
        handle: async (match) => {
          // Create the event.
          const event = new PlayerDamaged(this, {
            raw: match[0],
            time: match[1],
            chainID: parseInt(match[2]),
            victim: await this.getPlayerByName(match[3]),
            damage: match[4],
            attacker: await this.getPlayerByName(match[5]),
            weapon: match[6]
          });

          // Emit the event.
          this.emitEvent(event);

          // Store the event for subsequent events to pull data form.
          this.logEventStore[match[3]] = event;
        }
      },
      {
        name: 'Player Wounded',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Wound\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) caused by ([A-z_0-9]+)/,
        handle: (match) => {
          // Ignore the log line unless we have the damage line.
          if (!this.logEventStore[match[3]]) return;

          // Create the event.
          const event = new PlayerWounded(this, {
            ...this.logEventStore[match[3]],
            raw: match[0],
            time: match[1],
            chainID: parseInt(match[2])
          });

          // Emit the event.
          this.emitEvent(event);

          // Store the event for subsequent events to pull data form.
          this.logEventStore[match[3]] = event;
        }
      },
      {
        name: 'Player Died',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Die\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) caused by ([A-z_0-9]+)/,
        handle: (match) => {
          // Ignore the log line unless we have the damage/wound line.
          if (!this.logEventStore[match[3]]) return;

          // Emit the event.
          this.emitEvent(
            new PlayerDied(this, {
              ...this.logEventStore[match[3]],
              woundTime: this.logEventStore[match[3]]?.time,
              raw: match[0],
              time: match[1],
              chainID: parseInt(match[2])
            })
          );

          // Delete the stored event, we no longer need it.
          delete this.logEventStore[match[3]];
        }
      },
      {
        name: 'Played Revived',
        handles: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) has revived (.+)\./,
        handle: async (match) => {
          // Ignore the log line unless we have the damage/wound line.
          if (!this.logEventStore[match[4]]) return;

          // Emit the event.
          this.emitEvent(
            new PlayerRevived(this, {
              ...this.logEventStore[match[4]],
              woundTime: this.logEventStore[match[4]]?.time,
              raw: match[0],
              time: match[1],
              chainID: parseInt(match[2]),
              reviver: await this.getPlayerByName(match[3])
            })
          );

          // Delete the stored event, we no longer need it.
          delete this.logEventStore[match[4]];
        }
      },
      {
        name: 'Deployable Damaged',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQDeployable::)?TakeDamage\(\): ([A-z0-9_]+)_C_[0-9]+: ([0-9.]+) damage attempt by causer ([A-z0-9_]+)_C_[0-9]+ instigator (.+) with damage type ([A-z0-9_]+)_C health remaining ([0-9.]+)/,
        handle: async (match) => {
          this.emitEvent(
            new DeployableDamaged(this, {
              raw: match[0],
              time: match[1],
              chainID: parseInt(match[2]),
              deployable: match[3],
              damage: parseFloat(match[4]),
              weapon: match[5],
              damageType: match[7],
              healthRemaining: parseFloat(match[8])
            })
          );
        }
      },
      {
        name: 'Admin Broadcast',
        handles:
          /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: ADMIN COMMAND: Message broadcasted <(.+)> from (.+)/,
        handle: (match) => {
          this.emitEvent(
            new AdminBroadcast(this, {
              raw: match[0],
              time: match[1],
              chainID: parseInt(match[2]),
              message: match[3]
            })
          );
        }
      }
    ];

    // Define chat parsing rules.
    this.chatMessageHandlers = [
      {
        name: 'Chat Message',
        handles: /\[(ChatAll|ChatTeam|ChatSquad|ChatAdmin)] \[SteamID:([0-9]{17})] (.+?) : (.*)/,
        handle: async (match) => {
          // Emit the event.
          this.emitEvent(
            new ChatMessage(this, {
              chat: match[1],
              player: await this.getPlayerBySteamID(match[2]),
              message: match[4]
            })
          );
        }
      },
      {
        name: 'Player Warned',
        handles: /Remote admin has warned player (.*)\. Message was "(.*)"/,
        handle: async (match) => {
          this.emitEvent(
            new PlayerWarned(this, {
              player: await this.getPlayerByName(match[1]),
              message: match[2]
            })
          );
        }
      },
      {
        name: 'Player Kicked',
        handles: /Kicked player ([0-9]+)\. \[steamid=([0-9]{17})] (.*)/,
        handle: async (match) => {
          this.emitEvent(
            new PlayerKicked(this, {
              player: await this.getPlayerBySteamID(match[2])
            })
          );
        }
      },
      {
        name: 'Player Banned',
        handles: /Banned player ([0-9]+)\. \[steamid=([0-9]{17})] (.*) for interval (.*)/,
        handle: async (match) => {
          this.emitEvent(
            new PlayerBanned(this, {
              player: await this.getPlayerBySteamID(match[2]),
              duration: match[4]
            })
          );
        }
      },
      {
        name: 'Player Possessed Admin Camera',
        handles: /\[SteamID:([0-9]{17})] (.+?) has possessed admin camera./,
        handle: async (match) => {
          this.emitEvent(
            new PlayerPossessedAdminCamera(this, {
              player: await this.getPlayerBySteamID(match[1])
            })
          );
        }
      },
      {
        name: 'Player Unpossessed Admin Camera',
        handles: /\[SteamID:([0-9]{17})] (.+?) has unpossessed admin camera./,
        handle: async (match) => {
          this.emitEvent(
            new PlayerUnpossessedAdminCamera(this, {
              player: await this.getPlayerBySteamID(match[1])
            })
          );
        }
      }
    ];

    // Initialise intervaled tasks.
    this.initialiseIntervaledTask(
      'refreshGeneralServerInformation',
      this.refreshGeneralServerInformation,
      10 * 1000
    );
    this.initialiseIntervaledTask(
      'refreshLayerInformation',
      this.refreshLayerInformation,
      10 * 1000
    );
    this.initialiseIntervaledTask('refreshTeamsAndSquads', this.refreshTeamsAndSquads, 10 * 1000);
    this.initialiseIntervaledTask('refreshPlayers', this.refreshPlayers, 10 * 1000);

    // Internal variables/flags.
    this.getSquadCreator = false;

    this.logEventStore = {};
  }

  async refreshGeneralServerInformation() {
    this.stopIntervaledTask('refreshGeneralServerInformation');

    logger.info('Refreshing general server information...');
    try {
      // Fetch A2S information.
      const data = await this.a2s.getServerInformation();

      // Parse the information.
      const info = {
        name: data.name,
        version: data.version,

        playerSlots: parseInt(data.maxplayers),
        publicSlots: parseInt(data.raw.rules.NUMPUBCONN),
        reserveSlots: parseInt(data.raw.rules.NUMPRIVCONN),

        playerCount: parseInt(data.raw.rules.PlayerCount_i),
        publicQueueLength: parseInt(data.raw.rules.PublicQueue_i),
        reserveQueueLength: parseInt(data.raw.rules.ReservedQueue_i),

        matchTimeout: parseFloat(data.raw.rules.MatchTimeout_f)
      };

      // Update the server object with the data.
      this.name = info.name;
      this.version = info.version;

      this.playerSlots = info.playerSlots;
      this.publicSlots = info.publicSlots;
      this.reserveSlots = info.reserveSlots;

      this.playerCount = info.playerCount;
      this.publicQueueLength = info.publicQueueLength;
      this.reserveQueueLength = info.reserveQueueLength;

      this.matchTimeout = info.matchTimeout;

      // Emit event with the data.
      this.emitEvent(new GeneralServerInformationUpdated(this, info));

      logger.info('Refreshed general server information.');
    } catch (err) {
      logger.error('Failed to refresh general server information.');
    }

    this.startIntervaledTask('refreshGeneralServerInformation');
  }

  async refreshLayerInformation() {
    this.stopIntervaledTask('refreshLayerInformation');

    logger.info('Refreshing layer information...');
    try {
      // Fetch the layer information responses.
      const currentLayerResponse = await this.rcon.execute('ShowCurrentMap');
      const nextLayerResponse = await this.rcon.execute('ShowNextMap');

      // Extract current layer information from the response.
      const currentLayerMatch = currentLayerResponse.match(/Current level is (.*), layer is (.*)/);
      const nextLayerMatch = nextLayerResponse.match(/Next level is (.*), layer is (.*)/);

      // Parse the information.
      const info = {
        currentLevel: currentLayerMatch[1],
        currentLayer: currentLayerMatch[2],
        nextLevel: nextLayerMatch[1],
        nextLayer: nextLayerMatch[2]
      };

      // Check for changes.
      const oldValues = {};
      const newValues = {};
      for (const key of ['currentLevel', 'currentLayer', 'nextLevel', 'nextLayer']) {
        if (this[key] === info[key]) continue;

        oldValues[key] = this[key];
        newValues[key] = info[key];

        this[key] = info[key];
      }

      // Emit an event for current layer changes.
      if (this.currentLayer !== info.currentLayer)
        this.emitEvent(
          new LayerChanged(this, {
            ...info,
            oldValues: oldValues,
            newValues: newValues
          })
        );

      // Emit an event for any changes.
      if (Object.keys(newValues).length !== 0)
        this.emitEvent(
          new LayerInformationUpdated(this, {
            ...info,
            oldValues: oldValues,
            newValues: newValues
          })
        );

      logger.info('Refreshed layer information.');
    } catch (err) {
      logger.error('Failed to refresh layer information.');
    }

    this.startIntervaledTask('refreshLayerInformation');
  }

  async refreshTeamsAndSquads() {
    this.stopIntervaledTask('refreshTeamsAndSquads');

    logger.info('Refreshing teams and squads...');
    try {
      // Fetch the ListSquads response.
      const response = (await this.rcon.execute('ListSquads')).split('\n');

      // Create the list of teams at the start of each round.
      if (this.teams.length === 0) {
        // Create a new array to store the teams in.
        const teams = [];

        // Loop over each line of the response.
        for (const line of response) {
          // Extract team information from the line.
          const teamMatch = line.match(/^Team ID: ([0-9]+) \((.+)\)$/);

          // If no team information was found then skip the line.
          if (!teamMatch) continue;

          // Parse the information.
          const info = {
            id: parseInt(teamMatch[1]),
            name: teamMatch[2]
          };

          // Create the new team and push it to the list.
          teams.push(new Team(this, info));
        }

        // Update the array of teams.
        this.teams = teams;
      }

      // Create a new array to store the squads in.
      const squads = [];

      // Store the current team ID.
      let teamID;

      // Loop over each line of the response.
      for (const line of response) {
        // Extract team information from the line.
        const teamMatch = line.match(/^Team ID: ([0-9]+) \((.+)\)$/);

        // If the line contains team information update the current team ID and go to the next line.
        if (teamMatch) {
          teamID = parseInt(teamMatch[1]);
          continue;
        }

        // Extract squad information from the line.
        const squadMatch = line.match(
          /ID: ([0-9]+) \| Name: (.+) \| Size: ([0-9]+) \| Locked: (True|False) \| Creator Name: (.+) \| Creator Steam ID: ([0-9]{17})/
        );

        // If no squad information was found then skip the line.
        if (!squadMatch) continue;

        // Parse the information.
        const info = {
          id: parseInt(squadMatch[1]),
          name: squadMatch[2],
          size: parseInt(squadMatch[3]),
          locked: squadMatch[4] === 'True',
          creatorSteamID: squadMatch[6]
        };

        // Check if the squad already exists in the cache.
        let squad = await this.getSquadByID(teamID, info.id, 0);

        // Update the cache is necessary and emit event if so.
        if (squad) {
          const oldValues = {};
          const newValues = {};

          for (const key of ['locked']) {
            if (squad[key] === info[key]) continue;

            oldValues[key] = squad[key];
            newValues[key] = info[key];

            squad[key] = info[key];
          }

          if (Object.keys(newValues).length !== 0)
            this.emitEvent(
              new SquadUpdated(this, {
                squad: squad,
                oldValues: oldValues,
                newValues: newValues
              })
            );
        }

        // Otherwise, create a new squad and emit event.
        else {
          // Populate the team field when the squad is created.
          info.team = await this.getTeamByID(teamID, 0);

          // Populate the founder field when the squad is created.
          // Note, we flag that's what we are doing so refreshPlayers does not try to call
          // refreshTeamsAndSquads as the creator's squad does not exist yet, thus causing an
          // endless recursion of refreshes.
          this.getSquadCreator = true;
          info.creator = await this.getPlayerBySteamID(info.creatorSteamID);
          this.getSquadCreator = false;

          // Create the new squad.
          squad = new Squad(this, info);

          // Update the creator's squad as it will be blank currently.
          info.creator.squad = squad;

          // But this means we need to say we've updated the player...
          this.emitEvent(
            new PlayerUpdated(this, {
              player: info.creator,
              oldValues: { squad: null },
              newValues: { squad: squad }
            })
          );

          // Emit the squad created event.
          this.emitEvent(
            new SquadCreated(this, {
              squad: squad,
              oldValues: {
                team: null,
                id: null,
                name: null,
                locked: null,
                creator: null
              },
              newValues: {
                team: info.team,
                id: info.id,
                name: info.name,
                locked: info.locked,
                creator: info.creator
              }
            })
          );
        }

        // Store the squad in the new list.
        squads.push(squad);
      }

      // Emit events for deleted squads.
      const deletedSquads = await this.getSquadsByCondition(
        (squad) => !squads.some((s) => s.team.id === squad.team.id && s.id === squad.id)
      );
      for (const deletedSquad of deletedSquads)
        this.emitEvent(
          new SquadDeleted(this, {
            squad: deletedSquad,
            oldValues: {
              id: deletedSquad.id,
              name: deletedSquad.name,
              locked: deletedSquad.locked
            },
            newValues: {
              id: null,
              name: null,
              locked: null
            }
          })
        );

      // Update the array of squads.
      this.squads = squads;

      // Emit update event.
      this.emitEvent(
        new TeamsAndSquadsUpdated(this, {
          teams: this.teams,
          squads: this.squads
        })
      );

      logger.info('Refreshed teams and squads.');
    } catch (err) {
      logger.error('Failed to refresh teams and squads.');
    }

    this.startIntervaledTask('refreshTeamsAndSquads');
  }

  async refreshPlayers() {
    this.stopIntervaledTask('refreshPlayers');

    logger.info('Refreshing players...');
    try {
      // Fetch the ListPlayers response.
      const response = (await this.rcon.execute('ListPlayers')).split('\n');

      // Create a new array to store the players in.
      const players = [];

      // Loop over each line in the response.
      for (const line of response) {
        // Stop at the end of the active players list.
        if (line === '----- Recently Disconnected Players [Max of 15] -----') break;

        // Extract player information from the line.
        const playerMatch = line.match(
          /ID: ([0-9]+) \| SteamID: ([0-9]{17}) \| Name: (.+) \| Team ID: ([0-9]+) \| Squad ID: ([0-9]+|N\/A)/
        );

        // If no player information was found then skip the line.
        if (!playerMatch) continue;

        // Parse the information.
        const info = {
          id: parseInt(playerMatch[1]),
          steamID: playerMatch[2],
          name: playerMatch[3],
          teamID: parseInt(playerMatch[4]),
          squadID: playerMatch[5] === 'N/A' ? null : parseInt(playerMatch[5])
        };

        // Populate the team field.
        info.team = await this.getTeamByID(info.teamID);

        // Populate the squad field.
        info.squad =
          !this.getSquadCreator && info.squadID
            ? await this.getSquadByID(info.teamID, info.squadID)
            : null;

        // Check if the player already exists in the cache.
        let player = await this.getPlayerBySteamID(info.steamID, 0);

        // Update the cache is necessary and emit event if so.
        if (player) {
          const oldValues = {};
          const newValues = {};

          for (const key of ['name', 'team', 'squad']) {
            if (player[key] === info[key]) continue;

            oldValues[key] = player[key];
            newValues[key] = info[key];

            player[key] = info[key];
          }

          if (Object.keys(newValues).length !== 0)
            this.emitEvent(
              new PlayerUpdated(this, {
                player: player,
                oldValues: oldValues,
                newValues: newValues
              })
            );
        }

        // Otherwise, create a new squad and emit event.
        else {
          player = new Player(this, info);

          this.emitEvent(
            new PlayerCreated(this, {
              player: player,
              oldValues: {
                id: null,
                steamID: null,
                name: null,
                team: null,
                squad: null
              },
              newValues: {
                id: info.id,
                steamID: info.steamID,
                name: info.name,
                team: info.team,
                squad: info.squad
              }
            })
          );
        }

        players.push(player);
      }

      // Emit events for deleted players.
      const deletedPlayers = await this.getPlayersByCondition(
        (player) => !players.some((p) => p.steamID === player.steamID)
      );
      for (const deletedPlayer of deletedPlayers)
        this.emitEvent(
          new PlayerDeleted(this, {
            player: deletedPlayer,
            oldValues: {
              id: deletedPlayer.id,
              steamID: deletedPlayer.steamID,
              name: deletedPlayer.name,
              team: deletedPlayer.team,
              squad: deletedPlayer.squad
            },
            newValues: {
              id: null,
              steamID: null,
              name: null,
              team: null,
              squad: null
            }
          })
        );

      // Update the array of players.
      this.players = players;

      logger.info('Refreshed players.');
    } catch (err) {
      logger.error('Failed to refresh players.');
    }

    this.startIntervaledTask('refreshPlayers');
  }

  async getTeamByCondition(condition, mode) {
    return await this.getObjectByCondition('teams', this.refreshTeamsAndSquads, condition, mode);
  }

  async getTeamByID(id, mode) {
    return await this.getTeamByCondition((team) => team.id === id, mode);
  }

  async getTeamByName(name, mode) {
    return await this.getTeamByCondition(
      (team) => console.log(team.name, name, team.name === name) && team.name === name,
      mode
    );
  }

  async getTeamsByCondition(condition, mode) {
    return await this.getObjectsByCondition('teams', this.refreshTeamsAndSquads, condition, mode);
  }

  async getSquadByCondition(condition, mode) {
    return await this.getObjectByCondition('squads', this.refreshTeamsAndSquads, condition, mode);
  }

  async getSquadByID(teamID, squadID, mode) {
    return await this.getSquadByCondition(
      (squad) => squad.team.id === teamID && squad.id === squadID,
      mode
    );
  }

  async getSquadsByCondition(condition, mode) {
    return await this.getObjectsByCondition('squads', this.refreshTeamsAndSquads, condition, mode);
  }

  async getPlayerByCondition(condition, mode) {
    return await this.getObjectByCondition('players', this.refreshPlayers, condition, mode);
  }

  async getPlayerBySteamID(steamID, mode) {
    return await this.getPlayerByCondition((player) => player.steamID === steamID, mode);
  }

  async getPlayerByName(name, mode) {
    return await this.getPlayerByCondition((player) => player.name === name, mode);
  }

  async getPlayersByCondition(condition, mode) {
    return await this.getObjectsByCondition('players', this.refreshPlayers, condition, mode);
  }

  async watch() {
    await super.watch();

    // Start intervaled tasks with no delay.
    await this.refreshGeneralServerInformation();
    await this.refreshLayerInformation();
    await this.refreshTeamsAndSquads();
    await this.refreshPlayers();
  }

  async unwatch() {
    // Stop intervaled tasks.
    this.stopIntervaledTask('refreshGeneralServerInformation');
    this.stopIntervaledTask('refreshLayerInformation');
    this.stopIntervaledTask('refreshTeamsAndSquads');
    this.stopIntervaledTask('refreshPlayers');

    await super.unwatch();
  }
}
