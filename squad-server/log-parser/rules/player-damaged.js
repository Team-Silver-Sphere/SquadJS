import { LOG_PARSER_PLAYER_DAMAGED } from '../../events/log-parser.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) caused by ([A-z_0-9]+)_C/,
  onMatch: async (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victim: await logParser.server.getPlayerByName(args[3]),
      damage: parseFloat(args[4]),
      attacker: await logParser.server.getPlayerByName(args[5]),
      weapon: args[6]
    };

    data.teamkill = data.victim.teamID === data.attacker.teamID;
    data.suicide = data.victim.steamID === data.attacker.steamID;

    logParser.eventStore[args[3]] = data;

    logParser.server.emit(LOG_PARSER_PLAYER_DAMAGED, data);
  }
};
