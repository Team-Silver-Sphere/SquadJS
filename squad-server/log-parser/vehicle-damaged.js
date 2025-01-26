import WeaponsLookup from './lookup/weapons-lookup.js';
import VehiclesLookup from './lookup/vehicles-lookup.js';

export default {
  regex:
    /^\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadTrace: \[DedicatedServer](?:ASQVehicleSeat::)?TraceAndMessageClient\(\): ([A-z0-9_]+)_C_[0-9]+: ([0-9.]+) damage taken by causer ([A-z0-9_]+)_C_[0-9]+ instigator \(Online Ids: (.+)\) EOS: ([A-z0-9_]+) steam: ([0-9]+) health remaining (-?[0-9.]+)/,
  onMatch: (args, logParser) => {
	const isTeamkill = (() => {
		const attackerWeapon = WeaponsLookup[args[5]];
		const targetVehicle = VehiclesLookup[args[3]];
		const teamkillPresumption = 0;
		if (attackerWeapon && targetVehicle) {
			for (const targetTeam of targetVehicle) { // performed against targetVehicle, since most of them are 1-long arrays, unlike weapons
				if (attackerWeapon.includes(targetTeam)) {teamkillPresumption = teamkillPresumption + 1;}
			}
			return teamkillPresumption === 0;
		}
		return false;
	})();
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
	  teamkill: isTeamkill
    };

    logParser.eventStore.session[args[3]] = data;

    logParser.emit('VEHICLE_DAMAGED', data);
  }
};
