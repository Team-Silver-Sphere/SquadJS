import { iterate, lowerID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: PostLogin: NewPlayer: BP_PlayerController_C .+PersistentLevel\.([^\s]+) \(IP: ([\d.]+) \| Online IDs:([^)|]+)\)/,
  onMatch: (args, logParser) => {
    const IDs = {};
    iterate(args[5]).forEach((platform, id) => {
      IDs[lowerID(platform)] = id;
    });

    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      playercontroller: args[3],
      ip: args[4],
      ...IDs
    };

    const player = {
      playercontroller: data.playercontroller,
      ip: data.ip,
      ...IDs
    };

    logParser.eventStore.joinRequests[data.chainID] = player;
    logParser.eventStore.players[data.steamID] = player;

    // Handle Reconnecting players
    if (logParser.eventStore.disconnected[data.steamID]) {
      delete logParser.eventStore.disconnected[data.steamID];
    }

    logParser.emit('PLAYER_CONNECTED', data);
  }
};
