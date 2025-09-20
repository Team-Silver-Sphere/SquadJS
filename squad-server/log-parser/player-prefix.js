import { iterateIDs, lowerID } from 'core/id-parser';

export default {
  regex:
  /^\[([\d.:-]+)\]\[([ \d]*)\]LogSquadCommon: SQCommonStatics Check Permissions, UniqueId:(\w+)/,
  onMatch: (args, logParser) => {
    const eosID = args[3];
    const player = logParser.eventStore.players[eosID];
    if (!player || !player.playerSuffix || player.seen)
      return;
    player.seen = true;

    const data = {
      raw: args[0],
      time: args[1],
      chainID: +args[2],
      ...player
    };

    logParser.emit('PLAYER_PREFIX', data);
  }
};
