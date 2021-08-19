import Event from '../../core/event.js';

export default class PlayerPossessedAdminCamera extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.player = data.player;
  }
}
