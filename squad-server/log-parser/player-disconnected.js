export default {
    regex: /^\[([0-9.:-]+)]\[([ 0-9]*)]LogEasyAntiCheatServer: \[[0-9:]+]\[[A-z]+]\[EAC Server] \[Info]\[UnregisterClient] Client: ([A-z0-9]+) PlayerGUID: ([0-9]{17})/,
    onMatch: (args, logParser) => {
        const playerTrackerObjectName = `player-name-tracker-${args[4]}`;

        const data = {
            raw: args[0],
            time: args[1],
            chainID: args[2],
            playerSuffix: logParser.eventStore[playerTrackerObjectName] ? logParser.eventStore[playerTrackerObjectName] : 'Unknown',
            steamID: args[4]
        };

        if (logParser.eventStore[playerTrackerObjectName])
            delete logParser.eventStore[playerTrackerObjectName];

        logParser.emit('PLAYER_DISCONNECTED', data);
    }
};