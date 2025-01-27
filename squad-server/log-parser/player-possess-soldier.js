import SoldierLookup from './lookup/soldier-lookup.js';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQPlayerController::)?OnPossess\(\): PC=(.+) \(Online IDs: EOS: ([A-z0-9_]+) steam: ([0-9]+)\) Pawn=((?:BP_Soldier_|Default__BP_Soldier_)([a-zA-Z]+)_[a-zA-Z0-9]+)+_C_([0-9]+) FullPath=.+/,
  onMatch: (args, logParser) => {
    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerName: args[3],
      playerEOSID: args[4],
      playerSteamID: args[5],
	  playerSoldier: args[6],
      playerTeam: SoldierLookup[args[7]]
    };
	
	logParser.eventStore.session[args[3]] = args[2];
	
    if (logParser.eventStore.players[data.playerEOSID]) {logParser.eventStore.players[data.playerEOSID][teamName] = playerTeam;}

    logParser.emit('PLAYER_POSSESS_SOLDIER', data);
  }
};
