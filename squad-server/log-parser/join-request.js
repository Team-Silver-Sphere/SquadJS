export default {
    regex:
        /^\[([0-9.:-]+)]\[([ 0-9]*)]LogNet: Join request: .+\?Name=(.+)\?SplitscreenCount=\d$/,
    onMatch: (args, logParser) => {
        const data = {
            raw: args[ 0 ],
            time: args[ 1 ],
            chainID: +args[ 2 ],
            suffix: args[ 3 ],
        };

        logParser.eventStore.joinRequests[ data.chainID ] = data;
        // console.log(logParser.eventStore.loginRequests[ data.chainID ])
        logParser.emit('CLIENT_JOIN_REQUEST', data);
    }
};
