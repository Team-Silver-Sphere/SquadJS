import { CHAT_MESSAGE, NEW_GAME } from 'squad-server/events';
import { COPYRIGHT_MESSAGE } from 'core/constants';

export default {
  name: 'skipmap',
  description:
    'The <code>skipmap</code> plugin will allow players to vote via <code>+</code>/<code>-</code> if they wish to skip the current map',

  defaultEnabled: false,
  optionsSpec: {
    command: {
      required: false,
      description: 'The name of the command to be used in chat.',
      default: '!skipmap'
    },

    voteDuration: {
      required: false,
      description: 'How long the vote should go on for.',
      default: 5 * 60 * 1000
    },

    startTimer: {
      required: false,
      description: 'Time before voting is allowed.',
      default: 15 * 60 * 1000
    },

    endTimer: {
      required: false,
      description: 'Time before voting is no longer allowed.',
      default: 30 * 60 * 1000
    },

    pastVoteTimer: {
      required: false,
      description: 'Time that needs to have passed since the last vote.',
      default: 10 * 60 * 1000
    },

    minimumVotes: {
      required: false,
      description: 'The minimum required amount of votes for the vote to go through',
      default: 20
    },

    reminderInterval: {
      required: false,
      description: 'The time between individual reminders.',
      default: 2 * 60 * 1000
    }
  },

  init: (server, options) => {
    let votePos = 0;
    let voteNeg = 0;
    let intervalReminderBroadcasts;
    let timeoutVote;
    let timeLastVote;
    let voteActive;
    let playerVotes = {};

    server.on(CHAT_MESSAGE, (info) => {
      // Run through conditions
      // check if message is command
      if (!info.message.startsWith(options.command)) return;

      // check if enough time has passed since start of round and if not, inform the player
      if (
        server.layerHistory.length > 0 &&
        server.layerHistory[0].time < Date.now() - options.startTimer
      ) {
        const min = Math.floor(
          ((options.startTimer - server.layerHistory[0].time) % (1000 * 60 * 60)) / (1000 * 60)
        );
        const sec = Math.floor(
          (options.startTimer - server.layerHistory[0].time) % ((1000 * 60) / 1000)
        );
        server.rcon.warn(
          info.steamID,
          `Not enough time has passed since the start of the match. Please try again in ${min}min ${sec}s`
        );
        return;
      }

      // check if enough time remains in the round, if not, inform player
      if (
        server.layerHistory.length > 0 &&
        server.layerHistory[0].time > Date.now() - options.endTimer
      ) {
        server.rcon.warn(info.steamID, 'Match has progressed too far.');
        return;
      }

      // check if enough time has passed since the last vote
      if (timeLastVote < Date.now() - options.pastVoteTimer) {
        server.rcon.warn(info.steamID, 'Not enough time has passed since the last vote.');
        return;
      }

      // Actual vote
      playerVotes = {};
      voteActive = true;
      votePos = 1;
      playerVotes[info.steamID] = '+';
      voteNeg = 0;
      // Set reminders
      intervalReminderBroadcasts = setInterval(async () => {
        await server.rcon.broadcast(
          'A vote to skip the current map is in progress. Please vote in favour of skipping the map with + or against with -.'
        );
        await server.rcon.broadcast(
          `Currently ${votePos} people voted in favour and ${voteNeg} against skipping the current map.`
        );
      }, options.reminderInterval);

      // End vote
      // Disable recording of new votes, stop further broadcasts
      timeoutVote = setTimeout(() => {
        voteActive = false;
        clearInterval(intervalReminderBroadcasts);
        // Check if enough people voted
        if (voteNeg + votePos < options.minVoteCount) {
          server.rcon.broadcast('Not enough people voted for the vote to go through.');
          return;
        }
        if (votePos > voteNeg) {
          server.rcon.execute('AdminEndMatch');
        } else {
          server.rcon.broadcast(
            `Not enough people voted in favour of skipping the match. ${votePos} voted in favour, ${voteNeg} against.`
          );
        }
        // As a vote happened, stop any further votes from happening until enough time has passed
        timeLastVote = new Date();
      }, options.voteDuration);
    });

    // Clear timeouts and intervals when new game starts
    server.on(NEW_GAME, (info) => {
      clearInterval(intervalReminderBroadcasts);
      clearTimeout(timeoutVote);
      voteActive = false;
    });

    // Record votes
    server.on(CHAT_MESSAGE, async (info) => {
      if (!voteActive) return;

      // Check if player has voted previously, if yes, remove their vote
      if (playerVotes[info.steamID]) {
        if (playerVotes[info.steamID] === '+') votePos--;
        else voteNeg--;
      }

      // Record player vote
      if (playerVotes[info.steamID] === '+') {
        votePos++;
        await server.rcon.warn(info.steamID, 'Your vote in favour has been saved.');
        await server.rcon.warn(info.steamID, COPYRIGHT_MESSAGE);
      } else if (playerVotes[info.steamID] === '-') {
        voteNeg--;
        await server.rcon.warn(info.steamID, 'Your vote against has been saved.');
        await server.rcon.warn(info.steamID, COPYRIGHT_MESSAGE);
      }
      playerVotes[info.steamID] = info.message;
    });
  }
};
