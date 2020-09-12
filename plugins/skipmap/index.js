import { CHAT_MESSAGE } from 'squad-server/events';

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

    reminderAmount: {
      required: false,
      description: 'The amount of reminders broadcasted.',
      default: 5
    },

    reminderInterval: {
      required: false,
      description: 'The time between individual reminders.',
      default: 2 * 60 * 1000
    }
  },

  /*
  TODO:
  - Check Start Conditions
    - Start Timer
    - End Timer
    - No previous vote failed within past X minutes, as set by options
  - Check Vote End Conditions
    - Enough Votes
  - Voting
    - Chat listener, add/subtract from counter
      -> If counter positive in the end, skip map
    - Broadcast reminders, as set by options
  -
   */

  init: async (server, options) => {
    server.on(CHAT_MESSAGE, (info) => {
      if (info.message.chat.startsWith(options.command)) {
      }
    });
  }
};
