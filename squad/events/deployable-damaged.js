import LogEvent from '../../core/log-event.js';

export default class DeployableDamaged extends LogEvent {
  constructor(server, data = {}) {
    super(server, data);

    this.deployable = data.deployable;
    this.weapon = data.weapon;
    this.damage = data.damage;
    this.damageType = data.damageType;
    this.healthRemaining = data.healthRemaining;
  }
}
