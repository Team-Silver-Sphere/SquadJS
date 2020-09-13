import { ROUND_WINNER } from '../../events.js';

export default {
  regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer]ASQGameMode::DetermineMatchWinner\(\): (.+) won on (.+)/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      winner: args[3],
      layer: args[4]
    };

    logParser.server.emit(ROUND_WINNER, data);
  }
};
