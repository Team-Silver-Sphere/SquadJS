import {
  LOG_PARSER_STEAM_ID_CONNECTED,
  LOG_PARSER_PLAYER_CONNECTED
} from '../../events/log-parser.js';

class ConnectionHandler {
  constructor() {
    // created when the Steam ID is found, but no name nor connection confirmed
    this.steamIDs = {};

    // created once name is found
    this.players = {};
  }

  newSteamID(args, logParser) {
    const connection = {
      connectionTime: args[1],
      operatingSystem: args[4],
      client: args[5],
      steamID: args[6],
      name: args[9]
    };

    this.steamIDs[args[2]] = connection;

    logParser.server.emit(LOG_PARSER_STEAM_ID_CONNECTED, connection);
  }

  newName(args, logParser) {
    const connection = {
      ...this.steamIDs[args[2]],
      name: args[3]
    };

    this.players[args[3]] = connection;

    logParser.server.emit(LOG_PARSER_PLAYER_CONNECTED, connection);
  }
}

export default ConnectionHandler;
