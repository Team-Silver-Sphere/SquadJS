import Event from '../../core/event.js';

export default class ChatMessage extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
    this.chat = data.chat;
    this.message = data.message;
  }
}
