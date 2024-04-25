export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: ADMIN COMMAND: Message broadcasted <(.+)> from (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      message: args[3],
      from: args[4]
    };

    logParser.emit('ADMIN_BROADCAST', data);
  }
};
