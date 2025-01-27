import VehiclesLookup from './lookup/vehicles-lookup.js';
import FactionSides from './lookup/factions-lookup.js';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQVehicleSeat::)?TraceAndMessageClient\(\): ([A-z0-9_]+)_C_[0-9]+: ([0-9.]+) damage taken by causer ([A-z0-9_]+)_C_[0-9]+ instigator \(Online Ids: (.+)\) EOS: ([A-z0-9_]+) steam: ([0-9]+) health remaining (-?[0-9.]+)/,
  onMatch: (args, logParser) => {
	const data = {
		raw: args[0],
		time: args[1],
		chainID: args[2],
		vehicle: args[3],
		damage: parseFloat(args[4]),
		weapon: args[5],
		attackerName: args[6],
		attackerEOSID: args[7],
		attackerSteamID: args[8],
		healthRemaining: parseFloat(args[9]),
		vehicleTeams: VehiclesLookup[args[3]],
		teamkill: null
	};
	
	const isTeamkill = (() => {
		const vehicleTeamsCheck = data.vehicleTeams;
		const player = logParser.eventStore.players[data.attackerEOSID];
		if (!(player && player.teamName && vehicleTeamsCheck?.length)) return null;
		const playerSide = FactionSides[player.teamName];
		if (!playerSide) return null;
		const vehicleSide = [];
		for (const vehTeam of vehicleTeamsCheck) {
			const vehSide = FactionSides[vehTeam];
			if (vehSide && !vehicleSide.includes(vehSide)) vehicleSide.push(vehSide);
		}
		if (vehicleSide.includes(playerSide)) return 1.0 / vehicleSide.length > 0.5; // teamkill confidence
		else return false; // not in team list
	})();
	
	data.teamkill = isTeamkill;
    
    logParser.emit('VEHICLE_DAMAGED', data);
  }
};
