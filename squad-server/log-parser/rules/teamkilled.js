export default {
  regex: /\[([0-9.:-]+)]\[([ 0-9]*)]LogSquadScorePoints: Verbose: ScorePointsDelayed: Points: ([-0-9.]+) ScoreEvent: TeamKilled (.+)/,
  action: (args, logParser) => {
    logParser.injuryManager.newTeamKilled(args, logParser);
  },
  noMatchAction: logParser => {
    logParser.injuryManager.onNonTeamKilled(logParser);
  }
};
