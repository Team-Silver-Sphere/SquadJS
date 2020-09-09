import { SquadLayerFilter } from 'core/squad-layers';
import { COPYRIGHT_MESSAGE } from 'core/constants';
import { NEW_GAME, CHAT_MESSAGE } from 'squad-server/events';

import MapVote from './mapvote.js';

export default {
  name: 'mapvote-123',
  description:
    'The `mapvote-123` plugin provides map voting functionality. This variant of map voting allows admins to specify ' +
    'a small number of maps which are numbered and announced in admin broadcasts. Players can then vote for the map ' +
    'their choice by typing the corresponding map number into chat.' +
    '\n\n' +
    'Player Commands:\n' +
    ' * `!mapvote help` - Show other commands players can use.\n' +
    ' * `!mapvote results` - Show the results of the current map vote.\n' +
    ' * `<layer number>` - Vote for a layer using the layer number.\n' +
    '\n\n' +
    'Admin Commands (Admin Chat Only):\n' +
    ' * `!mapvote start <layer name 1>, <layer name 2>, ...` - Start a new map vote with the specified maps.\n' +
    ' * `!mapvote restart` - Restarts the map vote with the same layers.\n' +
    ' * `!mapvote end` - End the map vote and announce the winner.\n' +
    ' * `!mapvote destroy` - End the map vote without announcing the winner.\n',

  defaultEnabled: false,
  optionsSpec: {
    minVoteCount: {
      type: 'Integer',
      required: false,
      default: null,
      description: 'The minimum number of votes required for the vote to succeed.'
    }
  },

  init: async (server, options) => {
    let mapvote = null;

    server.on(NEW_GAME, () => {
      mapvote = null;
    });

    server.on(CHAT_MESSAGE, async (info) => {
      const voteMatch = info.message.match(/^([0-9])/);
      if (voteMatch) {
        if (!mapvote) return;
        try {
          const layerName = await mapvote.makeVoteByNumber(info.steamID, parseInt(voteMatch[1]));
          await server.rcon.warn(info.steamID, `You voted for ${layerName}.`);
        } catch (err) {
          await server.rcon.warn(info.steamID, err.message);
        }
        await server.rcon.warn(info.steamID, `Powered by: ${COPYRIGHT_MESSAGE}`);
      }

      const commandMatch = info.message.match(/^!mapvote ?(.*)/);
      if (commandMatch) {
        if (commandMatch[1].startsWith('start')) {
          if (info.chat !== 'ChatAdmin') return;

          if (mapvote) {
            await server.rcon.warn(info.steamID, 'A mapvote has already begun.');
          } else {
            mapvote = new MapVote(
              server,
              SquadLayerFilter.buildFromDidYouMeanList(
                commandMatch[1].replace('start ', '').split(', ')
              ),
              { minVoteCount: options.minVoteCount }
            );

            mapvote.on('NEW_WINNER', async (results) => {
              await server.rcon.broadcast(
                `New Map Vote Winner: ${results[0].layer.layer}. Participate in the map vote by typing "!mapvote help" in chat.`
              );
            });

            await server.rcon.broadcast(
              `A new map vote has started. Participate in the map vote by typing "!mapvote help" in chat. Map options to follow...`
            );
            await server.rcon.broadcast(
              mapvote.squadLayerFilter
                .getLayerNames()
                .map((layerName, key) => `${key + 1} - ${layerName}`)
                .join(', ')
            );
          }
          return;
        }

        if (!mapvote) {
          await server.rcon.warn(info.steamID, 'A map vote has not begun.');
          return;
        }

        if (commandMatch[1] === 'restart') {
          if (info.chat !== 'ChatAdmin') return;

          mapvote = new MapVote(server, mapvote.squadLayerFilter, {
            minVoteCount: options.minVoteCount
          });

          mapvote.on('NEW_WINNER', async (results) => {
            await server.rcon.broadcast(
              `New Map Vote Winner: ${results[0].layer}. Participate in the map vote by typing "!mapvote help" in chat.`
            );
          });

          await server.rcon.broadcast(
            `A new map vote has started. Participate in the map vote by typing "!mapvote help" in chat. Map options to follow...`
          );
          await server.rcon.broadcast(
            mapvote.squadLayerFilter
              .getLayerNames()
              .map((layerName, key) => `${key + 1} - ${layerName}`)
              .join(', ')
          );
          return;
        }

        if (commandMatch[1] === 'end') {
          if (info.chat !== 'ChatAdmin') return;

          const results = mapvote.getResults();

          if (results.length === 0)
            await server.rcon.broadcast(`No layer gained enough votes to win.`);
          else
            await server.rcon.broadcast(`${mapvote.getResults()[0].layer.layer} won the mapvote!`);

          mapvote = null;
          return;
        }

        if (commandMatch[1] === 'destroy') {
          if (info.chat !== 'ChatAdmin') return;
          mapvote = null;
          return;
        }

        if (commandMatch[1] === 'help') {
          await server.rcon.warn(info.steamID, 'To vote type the layer number into chat:');
          for (const layer of mapvote.squadLayerFilter.getLayers()) {
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
};
