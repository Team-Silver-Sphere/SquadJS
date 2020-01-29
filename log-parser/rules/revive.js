export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) has revived (.+)./,
  action: (args, logParser) => {
    logParser.injuryManager.newRevive(args, logParser);
  }
};
