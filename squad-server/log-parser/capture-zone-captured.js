// Example:
// [2026.10.01-12.00.00:000][123]LogSquad: Capture zone 03-Village was fully captured by team 2
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]Log\w+: .*?Capture zone (.+?) was fully captured by team (\d+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      flagName: args[3],
      teamID: args[4]
    };

    logParser.emit('CAPTURE_ZONE_CAPTURED', data);
  }
};
