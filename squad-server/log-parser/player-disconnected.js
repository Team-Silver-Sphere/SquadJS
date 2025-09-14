export default {
  regex:
    /^\[([\d.:-]+)]\[([ \d]*)]LogNet: UChannel::Close: Sending CloseBunch\..+RemoteAddr: ([\d.]+).+PC: (\w+PlayerController(?:|.+)_C_\d+),.+UniqueId: RedpointEOS:([\d\w]+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      ip: args[3],
      playerController: args[4],
      eosID: args[5]
    };

    logParser.eventStore.disconnected[data.eosID] = true;

    logParser.emit('PLAYER_DISCONNECTED', data);
  }
};
