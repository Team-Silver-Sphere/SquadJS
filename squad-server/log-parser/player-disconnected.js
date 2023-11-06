export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: UChannel::Close: Sending CloseBunch\. ChIndex == [0-9]+\. Name: \[UChannel\] ChIndex: [0-9]+, Closing: [0-9]+ \[UNetConnection\] RemoteAddr: ([0-9a-f]{32}):[0-9]+, Name: SteamNetConnection_[0-9]+, Driver: GameNetDriver SteamNetDriver_[0-9]+, IsServer: YES, PC: ([^ ]+PlayerController_C_[0-9]+), Owner: [^ ]+PlayerController_C_[0-9]+/,
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
