export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: UNetConnection::Close: \[UNetConnection\] RemoteAddr: ([0-9]{17}):[0-9]+, Name: SteamNetConnection_[0-9]+, Driver: GameNetDriver SteamNetDriver_[0-9]+, IsServer: YES, PC: (BP_PlayerController_C_[0-9]+), Owner: BP_PlayerController_C_[0-9]+, UniqueId: Steam:UNKNOWN \[.*\], Channels: [0-9]+, Time: [0-9.:-]+/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      steamID: args[3],
      playerController: args[4]
    };

    logParser.eventStore.disconnected[data.steamID] = true;
    logParser.emit('PLAYER_DISCONNECTED', data);
  }
};
