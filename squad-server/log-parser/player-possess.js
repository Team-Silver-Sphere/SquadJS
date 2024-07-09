import { iterateIDs, capitalID } from 'core/id-parser';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnPossess\(\): PC=(.+) \(Online IDs:([^)]+)\) Pawn=([A-z0-9_]+)_C/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerSuffix: args[3],
      possessClassname: args[5]
    };

    logParser.eventStore.session[args[3]] = args[2];
    iterateIDs(args[4]).forEach((platform, id) => {
      data['player' + capitalID(platform)] = id;
    });
    data.pawn = data.playerSteamID; // deprecated? never used in code

    logParser.emit('PLAYER_POSSESS', data);
  }
};
