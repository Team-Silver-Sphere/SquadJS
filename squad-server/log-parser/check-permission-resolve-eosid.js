export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadCommon: SQCommonStatics Check Permissions, UniqueId:([\da-f]+)$/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      eosID: args[3]
    };

    logParser.eventStore.joinRequests[data.chainID].eosID = data.eosID;
    logParser.emit('RESOLVED_EOS_ID', { ...logParser.eventStore.joinRequests[data.chainID] });
  }
};
