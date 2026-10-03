import { iterateIDs, capitalID } from '../../core/id-parser.js';

// Example:
// [2026.10.01-12.00.00:000][123]LogSquad: Player SomeName (Team: 1; ID: 76561198000000000) placed a new map marker for team 1 : Type: Enemy Infantry ; Location: X=1.0 Y=2.0 Z=3.0
export default {
  regex:
    /^\[([\d.:-]+)\]\[(\d+)]LogSquad: Player (.+) \(Team: (\d+); ID: ([^)]+)\) placed a new map marker for team (\d+)\s*:\s*Type:\s*(.+?)\s*;\s*Location:\s*(.*)/,
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
