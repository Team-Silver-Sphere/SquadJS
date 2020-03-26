export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQSoldier::)*Die\(\): Player:(.+) KillingDamage=(?:-)*([0-9.]+) from ([A-z_0-9]+) caused by ([A-z_0-9]+)/,
  action: (args, logParser) => {
    logParser.injuryHandler.newDie(args, logParser);
  }
};
