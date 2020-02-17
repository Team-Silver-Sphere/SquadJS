export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: Player:(.+) ActualDamage=([0-9.]+) from (.+) caused by ([A-z_0-9]+)/,
  action: (args, logParser) => {
    logParser.injuryHandler.newDamage(args, logParser);
  }
};
