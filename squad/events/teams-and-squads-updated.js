import Event from '../../core/event.js';

export default class TeamsAndSquadsUpdated extends Event {
  constructor(server, data = {}) {
    super(server, data);

    this.teams = data.teams;
    this.squads = data.squads;
  }
}
