import BasePlugin from './base-plugin.js';

export default class MapVote extends BasePlugin {
  static get description() {
    return 'The <code>MapVote</code> plugin allows to start mapvotes to choose next layer';
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);
    this.mapVoteResult = null;
    this.onChatMessage = this.onChatMessage.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      minimumVotes: {
        required: false,
        default: 10,
        description: 'Minimum number of votes for mapvote to succeed'
      },
      autoStartMapVoteSeconds: {
        required: false,
        default: 0,
        description:
          'Number of seconds after round startet to begin auto mapvote (if 0 - only manual start)'
      }
    };
  }

  async mount() {
    this.server.on('CHAT_MESSAGE', this.onChatMessage);
    this.server.on('NEW_GAME', this.onNewGame);
  }

  async unmount() {
    this.server.removeEventListener('CHAT_MESSAGE', this.onChatMessage);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
  }

  async onChatMessage(info) {
    if (info.chat !== 'ChatAdmin') return; // only listen to admin chat
    if (info.message.match(/!mapvote/)) {
      await this.server.rcon.broadcast('Mapvote triggered');
    }
  }

  async onNewGame() {
    this.mapVoteResult = null;
  }
}
