import {
  LOG_PARSER_PLAYER_DAMAGE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_TEAMKILL,
  LOG_PARSER_REVIVE
} from '../../events/log-parser.js';

class InjuryManager {
  constructor() {
    this.lastDamage = null;
    this.lastWoundDieEvent = null;
    this.wounds = {};
  }

  newDamage(args, logParser) {
    this.lastDamage = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: args[3],
      damage: parseFloat(args[4]),
      attacker: args[5],
      weapon: args[6]
    };

    logParser.emit(LOG_PARSER_PLAYER_DAMAGE, this.lastDamage);
  }

  newWound(args) {
    let wound = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: args[3],
      damage: parseFloat(args[4]),
      attackerPlayerObj: args[5],
      weapon: args[6]
    };

    /* Check that the wound is as a result of the last damage */
    if (this.woundMatchesLastDamage(wound)) {
      wound = {
        ...this.lastDamage,
        ...wound
      };
    }

    this.wounds[wound.victim] = wound;
    this.lastWoundDieEvent = [LOG_PARSER_PLAYER_WOUND, wound];
  }

  newDie(args) {
    let die = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: args[3],
      damage: parseFloat(args[4]),
      attackerObj: args[5],
      weapon: args[6]
    };

    if (this.dieMatchesLastDamage(die)) {
      /* If the last damage matches the die log, then it was an instant death, so add damage info */
      die = {
        ...this.lastDamage,
        ...die
      };
    } else if (this.wounds[die.victim]) {
      /* Otherwise, the player should have been wounded first, so add wound info */
      die = {
        ...this.wounds[die.victim],
        ...die,
        woundTime: this.wounds[die.victim].time
      };
    }

    this.lastWoundDieEvent = [LOG_PARSER_PLAYER_DIE, die];
  }

  newTeamKilled(args, logParser) {
    if (this.lastWoundDieEvent === null) return;

    this.lastWoundDieEvent[1].teamkill = true;
    logParser.emit(...this.lastWoundDieEvent);

    this.lastWoundDieEvent[0] = LOG_PARSER_TEAMKILL;
    logParser.emit(...this.lastWoundDieEvent);

    this.lastWoundDieEvent = null;
  }

  onNonTeamKilled(logParser) {
    if (this.lastWoundDieEvent) {
      this.lastWoundDieEvent[1].teamkill = false;
      logParser.emit(...this.lastWoundDieEvent);
    }
    this.lastWoundDieEvent = null;
  }

  newRevive(args, logParser) {
    let revive = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      reviver: args[3],
      victim: args[4]
    };

    /* Add the information of wound event if we have it */
    if (this.wounds[revive.victim]) {
      revive = {
        ...this.wounds[revive.victim],
        ...revive
      };

      delete this.wounds[revive.victim];
    }

    logParser.emit(LOG_PARSER_REVIVE, revive);
  }

  woundMatchesLastDamage(wound) {
    return this.lastDamage && wound.victim === this.lastDamage.victim;
  }

  dieMatchesLastDamage(die) {
    return this.lastDamage && die.victim === this.lastDamage.victim;
  }
}

export default InjuryManager;
