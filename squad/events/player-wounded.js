import LogEvent from '../../core/log-event.js';

export default class PlayerWounded extends LogEvent {
  constructor(server, data = {}) {
    super(server, data);

    this.victim = data.victim;
    this.attacker = data.attacker;
    this.weapon = data.weapon;
    this.damage = data.damage;
  }
}
