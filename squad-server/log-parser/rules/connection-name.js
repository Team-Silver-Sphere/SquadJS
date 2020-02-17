export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join succeeded: (.+)/,
  action: (args, logParser) => {
    logParser.connectionHandler.newName(args, logParser);
  }
};
