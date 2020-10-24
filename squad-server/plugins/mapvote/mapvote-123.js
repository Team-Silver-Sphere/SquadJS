import BasePlugin from 'squad-server/plugins/base';
import MapvoteLayerEngine from './components/mapvote-layer-engine.js';
import MapvoteVoteEngine from './components/mapvote-vote-engine.js';
import { NEW_GAME, CHAT_MESSAGE } from 'squad-server/server-events';
import { MAPVOTE_COMMANDS } from './core/plugin-command.js';
import { MAP_VOTE_NEW_WINNER, MAP_VOTE_START, MAP_VOTE_END } from 'mapvote/constants';
import { COPYRIGHT_MESSAGE, CHATS_ADMINCHAT } from 'squad-server/constants';

export default class MapVote123 extends BasePlugin {
  static get description() {
    return (
      'The <code>MapVote123</code> plugin provides map voting functionality. This variant of map voting allows admins to specify ' +
      'a small number of maps which are numbered and announced in admin broadcasts. Players can then vote for the map ' +
      'their choice by typing the corresponding map number into chat.' +
      '\n\n' +
      'Player Commands:\n' +
      ' * <code>!mapvote help</code> - Show other commands players can use.\n' +
      ' * <code>!mapvote results</code> - Show the results of the current map vote.\n' +
      ' * <code><layer number></code> - Vote for a layer using the layer number.\n' +
      '\n\n' +
      'Admin Commands (Admin Chat Only):\n' +
      ' * <code>!mapvote start <layer name 1>, <layer name 2>, ...</code> - Start a new map vote with the specified maps.\n' +
      ' * <code>!mapvote restart</code> - Restarts the map vote with the same layers.\n' +
      ' * <code>!mapvote end</code> - End the map vote and announce the winner.\n' +
      ' * <code>!mapvote destroy</code> - End the map vote without announcing the winner.\n'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      minVoteCount: {
        required: false,
        description: 'The minimum number of votes required for the vote to succeed.',
        default: null,
        example: 3
      }
    };
  }

  constructor(server, options, optionsRaw) {
    super(server, options, optionsRaw);

    let mapvote = null;

    server.on(NEW_GAME, () => {
      mapvote = null;
    });

    server.on(CHAT_MESSAGE, async (info) => {
      const voteMatch = info.message.match(MAPVOTE_COMMANDS.common.vote.pattern);

      if (voteMatch) {
        if (!mapvote) {
          await server.rcon.warn(info.steamID, 'No vote in progress');
        }

        try {
          const layerName = await mapvote.makeVoteByNumber(info.steamID, parseInt(voteMatch[1]));
          await server.rcon.warn(info.steamID, `You voted for ${layerName}.`);
        } catch (err) {
          await server.rcon.warn(info.steamID, err.message);
        }
        await server.rcon.warn(info.steamID, COPYRIGHT_MESSAGE);
      }

      const commandMatch = info.message.match(MAPVOTE_COMMANDS.common.mapvote.pattern);

      if (commandMatch) {
        if (info.chat === CHATS_ADMINCHAT) {
          if (commandMatch[1].startsWith('start')) {
            if (mapvote) {
              await server.rcon.warn(info.steamID, 'A mapvote has already begun.');
            } else {
              // Build map vote
              mapvote = this.buildMapVote(
                server,
                commandMatch[1].replace('start ', '').split(', '),
                options
              );

              // Setup event callbacks
              mapvote.on(MAP_VOTE_NEW_WINNER, async (results) => {
                await server.rcon.broadcast(
                  `New Map Vote Winner: ${results[0].layer.layer}. Participate in the map vote by typing "!mapvote help" in chat.`
                );
              });

              mapvote.on(MAP_VOTE_START, async () => {
                await server.rcon.broadcast(
                  `A new map vote has started. Participate in the map vote by typing "!mapvote help" in chat. Map options to follow...`
                );

                await server.rcon.broadcast(
                  mapvote.layerEngine.layerPool.layerNames
                    .map((layerName, key) => `${key + 1} - ${layerName}`)
                    .join(', ')
                );
              });

              mapvote.on(MAP_VOTE_END, async (results) => {
                if (results.length === 0) {
                  await server.rcon.broadcast(`No layer gained enough votes to win.`);
                } else {
                  await server.rcon.broadcast(
                    `${mapvote.getResults()[0].layer.layer} won the mapvote!`
                  );
                }
              });

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

            mapvote = null;
            return;
          }

          if (commandMatch[1] === 'destroy') {
            mapvote = null;
            return;
          }
        }

        if (!mapvote) {
          await server.rcon.warn(info.steamID, 'A map vote has not begun.');
          return;
        }

        if (commandMatch[1] === 'help') {
          await server.rcon.warn(info.steamID, 'To vote type the layer number into chat:');
          for (const layer of mapvote.layerEngine.layerPool.layerNames) {
            await server.rcon.warn(info.steamID, `${layer.layerNumber} - ${layer.layer}`);
          }

          if (options.minVoteCount !== null)
            await server.rcon.warn(
              info.steamID,
              `${options.minVoteCount} votes need to be made for a winner to be selected.`
            );

          await server.rcon.warn(
            info.steamID,
            'To see current results type into chat: !mapvote results'
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
                `${result.layer.layerNumber} - ${result.layer.layer} (${result.votes} vote${
                  result.votes > 1 ? 's' : ''
                })`
              );
            }
          }
        }
      }
    });
  }

  buildMapVote(server, mapList, options) {
    const layerEngine = new MapvoteLayerEngine(server, { maps: mapList });
    return new MapvoteVoteEngine(layerEngine, options);
  }
}
