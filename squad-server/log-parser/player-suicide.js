export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Warning: Suicide (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      ...logParser.eventStore[args[3]],
      raw: args[0],
      time: args[1],
      chainID: args[2],
      victimName: args[3],
      weapon: 'suicide' // easy to filter for DB
    };

    logParser.eventStore[args[3]] = data;

    logParser.emit('PLAYER_SUICIDE', data);
  }
};
