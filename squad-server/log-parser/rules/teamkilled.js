export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadScorePoints: Verbose: ScorePointsDelayed: Points: ([-0-9.]+) ScoreEvent: TeamKilled (.+)/,
  action: (args, logParser) => {
    logParser.injuryHandler.newTeamKilled(args, logParser);
  },
  noMatchAction: logParser => {
    logParser.injuryHandler.onNonTeamKilled(logParser);
  }
};
