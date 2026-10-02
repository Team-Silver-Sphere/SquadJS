// Example:
// [2026.10.01-12.00.00:000][123]LogSquad: Capture zone 03-Village was neutralized by team 2 (was owned by team 1)
export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]Log\w+: .*?Capture zone (.+?) was neutralized by team (\d+) \(was owned by team (\d+)\)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      flagName: args[3],
      teamID: args[4],
      previousOwnerTeamID: args[5]
    };

    logParser.emit('CAPTURE_ZONE_NEUTRALIZED', data);
  }
};
