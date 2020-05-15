import { LOG_PARSER_PLAYER_DIED } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)?Die\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) caused by ([A-z_0-9]+)_C/,
  onMatch: async (args, logParser) => {
    const data = {
      ...logParser.eventStore[args[3]],
      raw: args[0],
      time: args[1],
      woundTime: args[1],
      chainID: args[2],
      victim: await logParser.server.getPlayerByName(args[3]),
      damage: parseFloat(args[4]),
      attackerPlayerController: args[5],
      weapon: args[6]
    };

    data.teamkill = data.victim.teamID === data.attacker.teamID;

    logParser.eventStore[args[3]] = data;

    logParser.server.emit(LOG_PARSER_PLAYER_DIED, data);
  }
};
