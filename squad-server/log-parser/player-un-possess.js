import { iterateIDs, capitalID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnUnPossess\(\): PC=(.+) \(Online IDs:([^)]+)\)/,
  onMatch: (args, logParser) => {
    if (args[4].includes('INVALID')) return; // bail in case of bad IDs.
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3]
    };
    iterateIDs(args[4]).forEach((platform, id) => {
      data['player' + capitalID(platform)] = id;
    });
    const eosID = data.playerEOSID;
    data.switchPossess =
      eosID in logParser.eventStore.session && logParser.eventStore.session[eosID] === data.chainID;
    delete logParser.eventStore.session[data.playerSuffix];

    logParser.emit('PLAYER_UNPOSSESS', data);
  }
};
