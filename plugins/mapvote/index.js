import didYouMean from 'didyoumean';

import { COPYRIGHT_MESSAGE } from 'core/config';

import SquadLayers from 'connectors/squad-layers';

import { RCON_CHAT_MESSAGE } from 'squad-server/events/rcon';
import { SERVER_LAYER_CHANGE } from 'squad-server/events/server';

export default function(server, layerFilter = {}, options = {}) {
  if (!server)
    throw new Error('Mapvote must be provided with a reference to the server.');

  const command = options.command || '!mapvote';
  const commandRegex = new RegExp(`^${command} ([A-z0-9'_ ]*)`, 'i');
  const rotation = SquadLayers.getFilteredLayers(layerFilter);

  let voteCounts = {};
  let votes = {};
  let currentWinner = null;

  function getResults() {
    let results;

    results = Object.keys(voteCounts).map(layer => {
      return {
        layer: layer,
        voteCount: voteCounts[layer]
      };
    });

    results = results.sort((a, b) => {
      if (a.voteCount > b.voteCount) return -1;
      if (a.voteCount < b.voteCount) return 1;
      else return Math.random() < 0.5 ? 1 : -1;
    });

    return results;
  }

  server.on(SERVER_LAYER_CHANGE, () => {
    voteCounts = {};
    votes = {};
    currentWinner = null;
  });

  server.on(RCON_CHAT_MESSAGE, info => {
    const match = info.message.match(commandRegex);
    if (!match) return;

    if (match[1] === 'help') {
      // show help options
      server.rcon.execute(
        `AdminWarn "${info.steamID}" You may use any of the following commands in chat:`
      );
      server.rcon.execute(
        `AdminWarn "${info.steamID}" !mapvote results - View the current vote counts.`
      );
      server.rcon.execute(
        `AdminWarn "${info.steamID}" !mapvote <layer name> - Vote for the specified layer.`
      );
      server.rcon.execute(
        `AdminWarn "${info.steamID}" When inputting a layer name, we autocorrect any miss spelling.`
      );
    } else if (match[1] === 'results') {
      // display results to player
      const results = getResults();

      if (results.length === 0) {
        server.rcon.execute(
          `AdminWarn "${info.steamID}" No one has voted yet.`
        );
      } else {
        server.rcon.execute(
          `AdminWarn "${info.steamID}" The current vote counts are as follows:`
        );
        for (const result of results) {
          if (result.voteCount === 0) continue;

          server.rcon.execute(
            `AdminWarn "${info.steamID}" ${result.layer} - ${
              result.voteCount
            } vote${result.voteCount > 1 ? 's' : ''}.`
          );
        }
      }
    } else {
      const layer = didYouMean(match[1], SquadLayers.getLayerNames());

      // check layer is valid
      if (layer === null) {
        server.rcon.execute(
          `AdminWarn "${info.steamID}" ${match[1]} is not a valid layer name.`
        );
        return;
      }

      if (!rotation.includes(layer)) {
        server.rcon.execute(
          `AdminWarn "${info.steamID}" ${layer} is not in the rotation.`
        );
        return;
      }

      if (
        !SquadLayers.isHistoryCompliant(server.layerHistory, layer, options)
      ) {
        server.rcon.execute(
          `AdminWarn "${info.steamID}" ${layer} has been played too recently.`
        );
        return;
      }

      // remove existing votes
      if (info.steamID in votes) voteCounts[votes[info.steamID]]--;

      // add new vote
      if (layer in voteCounts) voteCounts[layer]++;
      else voteCounts[layer] = 1;

      // save what layer they votes for
      votes[info.steamID] = layer;

      // info them of their vote
      server.rcon.execute(
        `AdminWarn "${info.steamID}" You voted for ${layer}.`
      );
      server.rcon.execute(
        `AdminWarn "${info.steamID}" Powered by: ${COPYRIGHT_MESSAGE}`
      );

      // check for new winner
      const newWinner = getResults()[0].layer;

      if (currentWinner !== newWinner) {
        server.rcon.execute(`AdminSetNextMap ${newWinner}`);
        server.rcon.execute(`AdminBroadcast New Map Vote Winner: ${newWinner}`);
        server.rcon.execute(
          `AdminBroadcast Participate in the map vote by typing "!mapvote help" in chat.`
        );
        currentWinner = newWinner;
      }
    }
  });
}
