export default {
  regex:
  /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: AddClientConnection: Added client connection: \[UNetConnection\] RemoteAddr: ([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+:[0-9]+), Name: (EOSIpNetConnection_[0-9]+), Driver: GameNetDriver (EOSNetDriver_[0-9]+), IsServer: YES, PC: NULL, Owner: NULL, UniqueId: INVALID/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      steamID: args[3],
      connection: args[4],
      driver: args[5]
    };
    /* This is Called when unreal engine adds a client connection
      First Step in Adding a Player to server
      */
    logParser.eventStore.clients[args[4]] = args[3];
    logParser.emit('CLIENT_CONNECTED', data);
  }
};
