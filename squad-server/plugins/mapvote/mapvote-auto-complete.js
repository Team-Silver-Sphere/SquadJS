import BasePlugin from 'squad-server/plugins/base';
import MapvoteLayerEngine from './components/mapvote-layer-engine.js';
import MapvoteVoteEngine from './components/mapvote-vote-engine.js';
import { NEW_GAME, CHAT_MESSAGE } from 'squad-server/server-events';
import { MAPVOTE_COMMANDS } from './core/plugin-command.js';
import { MAP_VOTE_NEW_WINNER, MAP_VOTE_START, MAP_VOTE_END } from 'mapvote/constants';
import { COPYRIGHT_MESSAGE, CHATS_ADMINCHAT } from 'squad-server/constants';

export default class MapVoteAutoComplete extends BasePlugin {
  static get description() {
    return (
      'The <code>mapvote-did-you-mean</code> plugin provides map voting functionality. This variant of map voting uses a "Did you ' +
      'mean?" algorithm to allow players to easily select one of a large pool of layers by typing it\'s name into ' +
      'the in-game chat.' +
      '\n\n' +
      'Player Commands:\n' +
      ' * <code>!mapvote help</code> - Show other commands players can use.\n' +
      ' * <code>!mapvote results</code> - Show the results of the current map vote.\n' +
      ' * <code>!mapvote <layer name></code> - Vote for the specified layer. Misspelling will be corrected where possible.\n' +
      '\n\n' +
      'Admin Commands (Admin Chat Only):\n' +
      ' * <code>!mapvote start</code> - Start a new map vote\n' +
      ' * <code>!mapvote restart</code> - Restarts the map vote.\n' +
      ' * <code>!mapvote end</code> - End the map vote and announce the winner.\n' +
      ' * <code>!mapvote destroy</code> - End the map vote without announcing the winner.\n'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      layerFilter: {
        required: false,
        description: 'The layers players can choose from.',
        default: 'layerFilter'
      },
      alwaysOn: {
        required: false,
        description: 'If true then the map voting system will always be live.',
        default: true
      },
      minPlayerCount: {
        required: false,
        description: 'The minimum number of players required for the vote to succeed.',
        default: null,
        example: 10
      },
      minVoteCount: {
        required: false,
        description: 'The minimum number of votes required for the vote to succeed.',
        default: null,
        example: 5
      }
    };
  }

  constructor(server, options, optionsRaw) {
    super(server, options, optionsRaw);

    const mapvote = this.buildMapVote(server, options);

    // Setup event callbacks
    mapvote.on(MAP_VOTE_NEW_WINNER, async (results) => {
      await server.rcon.broadcast(
        `New Map Vote Winner: ${results[0].layer.layer}. Participate in the map vote by typing "!mapvote help" in chat.`
      );
    });

    mapvote.on(MAP_VOTE_START, async () => {
      await server.rcon.broadcast(
        `A new map vote has started. Participate in the map vote by typing "!mapvote help" in chat.`
      );
    });

    mapvote.on(MAP_VOTE_END, async (results) => {
      if (results.length === 0) {
        await server.rcon.broadcast(`No layer gained enough votes to win.`);
      } else {
        await server.rcon.broadcast(`${mapvote.getResults()[0].layer.layer} won the mapvote!`);
      }
    });

    // If always life, initialise vote
    if (options.alwaysOn) {
      setTimeout(() => {
        mapvote.initializeVote();
      }, 1000);
    }

    server.on(NEW_GAME, () => {
      mapvote.cleanupVoteProps();

      // If alway life, start it instantly
      if (options.alwaysOn) {
        mapvote.initializeVote();
      }
    });

    server.on(CHAT_MESSAGE, async (info) => {
      const commandMatch = info.message.match(MAPVOTE_COMMANDS.common.mapvote.pattern);

      if (commandMatch) {
        if (info.chat === CHATS_ADMINCHAT) {
          if (commandMatch[1].startsWith('start')) {
            if (mapvote.isVoteInProgress()) {
              await server.rcon.warn(info.steamID, 'A mapvote has already begun.');
            } else {
              // Start vote
              mapvote.initializeVote();
            }
            return;
          }
          if (commandMatch[1] === 'restart') {
            mapvote.initializeVote();

            return;
          }
          if (commandMatch[1] === 'end') {
            mapvote.endVote();
            return;
          }

          if (commandMatch[1] === 'destroy') {
            mapvote.cleanupVoteProps();
            return;
          }
        }

        if (!mapvote) {
          await server.rcon.warn(info.steamID, 'A map vote has not begun.');
          return;
        }

        if (commandMatch[1] === 'help') {
          await server.rcon.warn(
            info.steamID,
            'You may use any of the following commands in chat:'
          );
          await server.rcon.warn(info.steamID, '!mapvote results - View the current vote counts.');
          await server.rcon.warn(
            info.steamID,
            '!mapvote <layer name> - Vote for the specified layer.'
          );
          await server.rcon.warn(
            info.steamID,
            'When inputting a layer name, we autocorrect any miss spelling.'
          );

          if (options.minVoteCount !== null)
            await server.rcon.warn(
              info.steamID,
              `${options.minVoteCount} votes need to be made for a winner to be selected.`
            );

          return;
        }

        if (commandMatch[1] === 'results') {
          const results = mapvote.getResults();

          if (results.length === 0) {
            await server.rcon.warn(info.steamID, 'No one has voted yet.');
          } else {
            await server.rcon.warn(info.steamID, 'The current vote counts are as follows:');
            for (const result of results) {
              await server.rcon.warn(
                info.steamID,
                `${result.layer.layer} - ${result.votes} vote${result.votes > 1 ? 's' : ''}`
              );
            }
            return;
          }
        }

        // Is it needed?
        // if (!manuallyCreated && server.players.length < options.minPlayerCount) {
        //     await server.rcon.warn(info.steamID, 'Not enough players online to vote.');
        //     return;
        // }

        if (mapvote.isVoteInProgress()) {
          try {
            const layerName = await mapvote.makeVoteByDidYouMean(info.steamID, commandMatch[1]);
            await server.rcon.warn(info.steamID, `You voted for ${layerName}.`);
          } catch (err) {
            await server.rcon.warn(info.steamID, err.message);
          }
          await server.rcon.warn(info.steamID, COPYRIGHT_MESSAGE);
        }
      }
    });
  }

  buildMapVote(server, options) {
    const layerEngine = new MapvoteLayerEngine(server, { layerFilter: options.layerFilter });
    return new MapvoteVoteEngine(layerEngine, options);
  }
}
