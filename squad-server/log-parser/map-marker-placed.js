import { iterateIDs, capitalID } from 'core/id-parser';

export default {
  regex:
    /^\[([\d.:-]+)\]\[ *(\d+)]LogSquad: Player (.+) \(Team: (\d+); ID: ([^)]+)\) placed a new map marker for team (\d+)\s*:\s*Type:\s*(.+?)\s*;\s*Location:\s*(.*)/,
  onMatch: (args, logParser) => {
    const numbers = (args[8].match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) || []).map(parseFloat);

    const data = {
      raw: args[0],
      time: args[1],
      chainID: args[2],
      playerName: args[3],
      playerTeamID: args[4],
      markerTeamID: args[6],
      markerType: args[7],
      location: { x: numbers[0], y: numbers[1], z: numbers[2] }
    };

    iterateIDs(args[5]).forEach((platform, id) => {
      data['player' + capitalID(platform)] = id;
    });

    logParser.emit('MAP_MARKER_PLACED', data);
  }
};
