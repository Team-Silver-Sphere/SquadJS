import { CHAT_MESSAGE, NEW_GAME } from 'squad-server/events';

export default {
  name: 'skipmap',
  description:
    'The `skipmap` plugin will allow players to vote via `+/-` if they wish to skip the map',

  defaultEnabled: true,
  optionsSpec: {
    command: {
      required: true,
      description: 'The name of the command to be used in chat.',
      default: '!skipmap'
    },

    voteDuration: {
      required: false,
      description: 'How long the vote should go.',
      default: 5 * 60 * 1000
    },

    startTimer: {
      required: false,
      description: 'Time to wait before allowing the vote to go through.',
      default: 15 * 60 * 1000
    },

    pastVoteTimer: {
      required: false,
      description: 'Time that needs to have passed since the last vote.',
      default: 10 * 60 * 1000
    },

    endTimer: {
      required: false,
      description: 'Time before the end timer of the round where the votes are no longer valid.',
      default: 15 * 60 * 1000
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

  init: async (server, options) => {
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
      if (!info.message.chat.startsWith(options.command)) return;
      // check if enough time has passed since start of round and if not, inform the player
      if (server.layerHistory[0].time < options.startTimer) {
        const min = Math.floor(
          ((options.startTimer - server.layerHistory[0].time) % (1000 * 60 * 60)) / (1000 * 60)
        );
        const sec = Math.floor(
          (options.startTimer - server.layerHistory[0].time) % ((1000 * 60) / 1000)
        );
        server.rcon.warn(
          info.steamID,
          'Not enough time has passed since the start of the match. Please try again in ' +
            min +
            'm ' +
            sec +
            's'
        );
        return;
      }
      // check if enough time remains in the round, if not, inform player
      if (server.layerHistory[0].time < 2 * 60 * 60 * 1000 - options.endTimer) {
        server.rcon.warn(info.steamID, 'Too close to expected end of match.');
        return;
      }

      // check if enough time has passed since the last vote
      if (timeLastVote - new Date() < options.pastVoteTimer) {
        server.rcon.warn(info.steamID, 'Not enough time has passed since the last vote.');
        return;
      }

      // Actual vote
      playerVotes = {};
      voteActive = true;
      votePos = 1;
      playerVotes[info.steamID] = info.message;
      voteNeg = 0;
      // Set reminders
      intervalReminderBroadcasts = setInterval(() => {
        server.broadcast(
          'A vote to skip the current map has started. Please vote in favour with + or against with -.'
        );
        server.broadcast('Current counter is: ' + votePos + ' in favour, ' + voteNeg + ' against.');
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
            'Not enough people voted in favour of skipping the match. ' +
              votePos +
              ' voted in favour, ' +
              voteNeg +
              'against.'
          );
        }
      }, options.voteDuration);

      // As a vote happened, stop any further votes from happening until enough time has passed
      timeLastVote = new Date();
    });

    // Clear timeouts and intervals when new game starts
    server.on(NEW_GAME, (info) => {
      clearInterval(intervalReminderBroadcasts);
      clearTimeout(timeoutVote);
    });

    // Record votes
    server.on(CHAT_MESSAGE, (info) => {
      if (!voteActive) return;

      // Check if player has voted previously, if yes, remove their vote
      if (playerVotes[info.steamID]) {
        if (playerVotes[info.steamID] === '+') votePos--;
        else voteNeg--;
      }

      // Record player vote
      if (info.message.startsWith('+')) votePos++;
      else if (info.message.startsWith('-')) voteNeg--;
      playerVotes[info.steamID] = info.message;
    });
  }
};
