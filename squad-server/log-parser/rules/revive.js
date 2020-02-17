export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquad: (.+) has revived (.+)./,
  action: (args, logParser) => {
    logParser.injuryHandler.newRevive(args, logParser);
  }
};
