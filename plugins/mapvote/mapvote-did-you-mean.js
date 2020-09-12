import { COPYRIGHT_MESSAGE } from 'core/constants';
import { NEW_GAME, CHAT_MESSAGE } from 'squad-server/events';

import MapVote from './mapvote.js';

export default {
  name: 'mapvote-did-you-mean',
  description:
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
    ' * <code>!mapvote destroy</code> - End the map vote without announcing the winner.\n',

  defaultEnabled: false,
  optionsSpec: {
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
  },

  init: async (server, options) => {
    let mapvote;
    let manuallyCreated;

    async function newMapvote(manuallyCreatedOption = true) {
      mapvote = new MapVote(server, options.layerFilter, {
        minVoteCount: options.minVoteCount
      });

      manuallyCreated = manuallyCreatedOption;

      mapvote.on('NEW_WINNER', async (results) => {
        await server.rcon.broadcast(
          `New Map Vote Winner: ${results[0].layer.layer}. Participate in the map vote by typing "!mapvote help" in chat.`
        );
      });

      if (manuallyCreated)
        await server.rcon.broadcast(
          `A new map vote has started. Participate in the map vote by typing "!mapvote help" in chat.`
        );
    }

    if (options.alwaysOn) newMapvote(false);

    server.on(NEW_GAME, () => {
      if (options.alwaysOn) {
        newMapvote(false);
      } else {
        mapvote = null;
      }
    });

    server.on(CHAT_MESSAGE, async (info) => {
      const match = info.message.match(/^!mapvote ?(.*)/);
      if (!match) return;

      if (match[1] === 'help') {
        await server.rcon.warn(info.steamID, 'You may use any of the following commands in chat:');
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

      if (match[1] === 'start') {
        if (info.chat !== 'ChatAdmin') return;

        if (mapvote) {
          await server.rcon.warn(info.steamID, 'A mapvote has already begun.');
        } else {
          await newMapvote();
        }
        return;
      }

      if (!mapvote) {
        await server.rcon.warn(info.steamID, 'A map vote has not begun.');
        return;
      }

      if (match[1] === 'restart') {
        if (info.chat !== 'ChatAdmin') return;
        await newMapvote();
        return;
      }

      if (match[1] === 'end') {
        if (info.chat !== 'ChatAdmin') return;

        const results = mapvote.getResults(true);

        if (results.length === 0)
          await server.rcon.broadcast(`No layer gained enough votes to win.`);
        else await server.rcon.broadcast(`${mapvote.getResults()[0].layer.layer} won the mapvote!`);

        mapvote = null;
        return;
      }

      if (match[1] === 'destroy') {
        if (info.chat !== 'ChatAdmin') return;
        mapvote = null;
        return;
      }

      if (match[1] === 'results') {
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

      if (!manuallyCreated && server.players.length < options.minPlayerCount) {
        await server.rcon.warn(info.steamID, 'Not enough players online to vote.');
        return;
      }

      try {
        const layerName = await mapvote.makeVoteByDidYouMean(info.steamID, match[1]);
        await server.rcon.warn(info.steamID, `You voted for ${layerName}.`);
      } catch (err) {
        await server.rcon.warn(info.steamID, err.message);
      }
      await server.rcon.warn(info.steamID, COPYRIGHT_MESSAGE);
    });
  }
};
