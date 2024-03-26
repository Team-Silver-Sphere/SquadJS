import { iterate, capitalID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) \(Online IDs:([^|]+)\| Player Controller ID: ([^ ]+)\)caused by ([A-z_0-9-]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      damage: parseFloat(args[4]),
      attackerName: args[5],
      attackerController: args[7],
      weapon: args[8]
    };
    iterate(args[6]).forEach((platform, id) => {
      data['attacker' + capitalID(platform)] = id;
    });

    logParser.eventStore.session[args[3]] = data;

    if (!logParser.eventStore.players[data.attackerSteamID])
      logParser.eventStore.players[data.attackerSteamID] = {};
    logParser.eventStore.players[data.attackerSteamID].controller = data.attackerController;

    logParser.emit('PLAYER_DAMAGED', data);
  }
};
