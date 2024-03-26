import { iterate, lowerID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: PostLogin: NewPlayer: BP_PlayerController_C .+PersistentLevel\.([^\s]+) \(IP: ([\d.]+) \| Online IDs:([^)|]+)\)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      playercontroller: args[3],
      ip: args[4]
    };

    iterate(args[5]).forEach((platform, id) => {
      data[lowerID(platform)] = id;
    });

    const joinRequestData = logParser.eventStore.joinRequests[+args[2]];
    data.connection = joinRequestData.connection;
    data.playerSuffix = joinRequestData.suffix;

    if (!logParser.eventStore.players[data.steamID])
      logParser.eventStore.players[data.steamID] = {};
    logParser.eventStore.players[data.steamID].controller = data.playercontroller;

    logParser.emit('PLAYER_CONNECTED', data);
  }
};
