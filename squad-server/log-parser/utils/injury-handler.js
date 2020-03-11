import {
  LOG_PARSER_PLAYER_DAMAGE,
  LOG_PARSER_PLAYER_WOUND,
  LOG_PARSER_PLAYER_DIE,
  LOG_PARSER_TEAMKILL,
  LOG_PARSER_REVIVE
} from '../../events/log-parser.js';

class InjuryHandler {
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
      victim: {
        name: args[3],
        ...logParser.emitter.getPlayerByName(args[3])
      },
      damage: parseFloat(args[4]),
      attacker: {
        name: args[5],
        ...logParser.emitter.getPlayerByName(args[5])
      },
      weapon: args[6]
    };

    logParser.emitter.emit(LOG_PARSER_PLAYER_DAMAGE, this.lastDamage);
  }

  newWound(args, logParser) {
    let wound = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: {
        name: args[3],
        ...logParser.emitter.getPlayerByName(args[3])
      },
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

    this.wounds[wound.victim.name] = wound;
    this.lastWoundDieEvent = [LOG_PARSER_PLAYER_WOUND, wound];
  }

  newDie(args, logParser) {
    let die = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: {
        name: args[3],
        ...logParser.emitter.getPlayerByName(args[3])
      },
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
    } else if (this.wounds[die.victim.name]) {
      /* Otherwise, the player should have been wounded first, so add wound info */
      die = {
        ...this.wounds[die.victim.name],
        ...die,
        woundTime: this.wounds[die.victim.name].time
      };
    }

    this.lastWoundDieEvent = [LOG_PARSER_PLAYER_DIE, die];
  }

  newTeamKilled(args, logParser) {
    if (this.lastWoundDieEvent === null) return;

    this.lastWoundDieEvent[1].teamkill = true;
    logParser.emitter.emit(...this.lastWoundDieEvent);

    this.lastWoundDieEvent[0] = LOG_PARSER_TEAMKILL;
    logParser.emitter.emit(...this.lastWoundDieEvent);

    this.lastWoundDieEvent = null;
  }

  onNonTeamKilled(logParser) {
    if (this.lastWoundDieEvent) {
      this.lastWoundDieEvent[1].teamkill = false;
      logParser.emitter.emit(...this.lastWoundDieEvent);
    }
    this.lastWoundDieEvent = null;
  }

  newRevive(args, logParser) {
    let revive = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      reviver: {
        name: args[3],
        ...logParser.emitter.getPlayerByName(args[3])
      },
      victim: {
        name: args[4],
        ...logParser.emitter.getPlayerByName(args[3])
      }
    };

    /* Add the information of wound event if we have it */
    if (this.wounds[revive.victim.name]) {
      revive = {
        ...this.wounds[revive.victim.name],
        ...revive,
        woundTime: this.wounds[revive.victim.name].time
      };

      delete this.wounds[revive.victim.name];
    }

    logParser.emitter.emit(LOG_PARSER_REVIVE, revive);
  }

  woundMatchesLastDamage(wound) {
    return this.lastDamage && wound.victim.name === this.lastDamage.victim.name;
  }

  dieMatchesLastDamage(die) {
    return this.lastDamage && die.victim.name === this.lastDamage.victim.name;
  }
}

export default InjuryHandler;
