<div align="center">

<img src="assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS

[![GitHub release](https://img.shields.io/github/release/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/graphs/contributors)
[![GitHub release](https://img.shields.io/github/license/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/blob/master/LICENSE)

<br>

[![GitHub issues](https://img.shields.io/github/issues/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/pulls)
[![GitHub issues](https://img.shields.io/github/stars/Thomas-Smyth/SquadJS.svg?style=flat-square)](https://github.com/Thomas-Smyth/SquadJS/stargazers)
[![Discord](https://img.shields.io/discord/266210223406972928.svg?style=flat-square&logo=discord)](https://discord.gg/9F2Ng5C)

<br><br>
</div>

## About
SquadJS is a scripting framework, designed for Squad servers, that aims to handle all communication and data collection to and from the servers. Using SquadJS as the base to any of your scripting projects allows you to easily write complex plugins without having to worry about the hassle of RCON or log parsing. However, for your convenience SquadJS comes shipped with multiple plugins already built for you allowing you to experience the power of SquadJS right away.

## Using SquadJS
SquadJS relies on being able to access the Squad server log directory in order to parse logs live to collect information. Thus, SquadJS must be hosted on the same server box as your Squad server.

### Prerequisites
 * Git
 * [Node.js](https://nodejs.org/en/) (Current) - [Download](https://nodejs.org/en/)
 * [Yarn](https://yarnpkg.com/) (Version 1.22.0+) - [Download](https://classic.yarnpkg.com/en/docs/install)
 * Some plugins may have additional requirements.
 
### Installation
1. Clone the repository: `git clone https://github.com/Thomas-Smyth/SquadJS`
2. Install the dependencies: `yarn install`
3. Configure the `config.json` file. See below for more details.
4. Start SquadJS: `node index.js`.

### Configuring SquadJS
SquadJS can be configured via a JSON configuration file which, by default, is located in the SquadJS and is named [config.json](https://github.com/Thomas-Smyth/SquadJS/blob/master/config.json).

The config file needs to be valid JSON syntax. If an error is thrown saying the config cannot be parsed then try putting the config into a JSON syntax checker (there's plenty to choose from that can be found via Google).

#### Server
The following section of the configuration contains information about your Squad server.
```json
"server": {
  "id": 1,
  "host": "xxx.xxx.xxx.xxx",
  "queryPort": 27165,
  "rconPort": 21114,
  "rconPassword": "password",
  "logReaderMode": "tail",
  "logDir": "C:/path/to/squad/log/folder",
  "ftpPort": 21,
  "ftpUser": "FTP Username",
  "ftpPassword": "FTP Password",
  "rconVerbose": false
},
```
 * `id` - An integer ID to uniquely identify the server.
 * `host` - The IP of the server.
 * `queryPort` - The query port of the server.
 * `rconPort` - The RCON port of the server.
 * `rconPassword` - The RCON password of the server.
 * `logReaderMode` - `tail` will read from a local log file. `ftp` will read from a remote log file.
 * `ftpPort` - The FTP port of the server. Only required for `ftp` `logReaderMode`.
 * `ftpUser` - The FTP user of the server. Only required for `ftp` `logReaderMode`.
 * `ftpPassword` - The FTP password of the server. Only required for `ftp` `logReaderMode`.
 * `rconVerbose` - Enable verbose logging for RCON.
 
#### Connectors
Connectors allow SquadJS to communicate with external resources.
```json
"connectors": {
  "discord": "Discord Login Token",
},
```
Connectors should be named, for example the above is named `discord`, and should have the associated config against it. Configs can be specified by name in plugin options. Should a connector not be needed by any plugin then the default values can be left or you can remove it from your config file.

See below for more details on connectors and their associated config.

##### Discord
Connects to Discord via `discord.js`.
```json
"discord": "Discord Login Token",
```
Requires a Discord bot login token.

##### Squad Layer Filter
Connects to a filtered list of Squad layers and filters them either by an "initial filter" or an "active filter" that depends on current server information, e.g. player count.
```js
"layerFilter": {
  "type": "buildPoolFromFilter",
  "filter": {
    "whitelistedLayers": null,
    "blacklistedLayers": null,
    "whitelistedMaps": null,
    "blacklistedMaps": null,
    "whitelistedGamemodes": null,
    "blacklistedGamemodes": [
      "Training"
    ],
    "flagCountMin": null,
    "flagCountMax": null,
    "hasCommander": null,
    "hasTanks": null,
    "hasHelicopters": null
  },
  "activeLayerFilter": {
    "historyResetTime": 18000000,
    "layerHistoryTolerance": 8,
    "mapHistoryTolerance": 4,
    "gamemodeHistoryTolerance": {
      "Invasion": 4
    },
    "gamemodeRepetitiveTolerance": {
      "Invasion": 4
    },
    "playerCountComplianceEnabled": true,
    "factionComplianceEnabled": true,
    "factionHistoryTolerance": {
      "RUS": 4
    },
    "factionRepetitiveTolerance": {
      "RUS": 4
    }
  }
},
```
 * `type` - The type of filter builder to use. `filter` will depend on this type.
   - `buildPoolFromFilter` - Builds the Squad layers list from a list of filters. An example `filter` with default values for this type is show above.
     - `whitelistedLayers` - List of layers to consider.
     - `blacklistLayers` -  List of layers to not consider.
     - `whitelistedMaps` - List of maps to consider.
     - `blacklistedMaps` - List of maps to not consider.
     - `whitelistedGamemodes` - List of gamemodes to consider.
     - `blacklistedGamemodes` - List of gamemodes to not consider.
     - `flagCountMin` - Minimum number of flags the layer may have.
     - `flagCountMax` - Maximum number of flags the layer may have.
     - `hasCommander` - Layer must/most not have a commander. `null` for either.
     - `hasTanks` - Layer must/most not have a tanks. `null` for either.
     - `hasHelicopters` - Layer must/most not have a helicopters. `null` for either.
   - `buildPoolFromFile` - Builds the Squad layers list from a Squad layer config file. `filter` should be the filename of the config file.
   - `buildPoolFromLayerNames` - Builds the Squad layers list from a list of layers. `filter` should be a list of layers, e.g. `"filter": ["Sumari AAS v1", "Fool's Road AAS v1"]`.
 * `filter` - Described above.
 * `activeLayerFilter` - Filters layers live as server information updates, e.g. if the player count exceeds a certain amount a layer may no longer be in the filter.
   - `historyResetTime` - After this number of miliseconds the layer history is no longer considered.
   - `layerHistoryTolerance` - A layer can only be played again after this number of layers.
   - `mapHistoryTolerance` - A map can only be played again after this number of layers.
   - `gamemodeHistoryTolerance` - A gamemode can only be played again after this number of layers. Gamemodes can be specified individually inside the object. If they are not listed then the filter is not applied.
   - `gamemodeRepetitiveTolerance` - A gamemode can only be played this number of times in a row. Gamemodes can be specified individually inside the object. If they are not listed then the filter is not applied.  
   - `playerCountComplianceEnabled` - Filter layers by player count.
   - `factionComplianceEnabled` - Filter layers so that a team cannot play the same faction twice in a row.
   - `factionHistoryTolerance` - A faction can only be played again after this number of layers. Factions can be specified individually inside the object. If they are not listed then the filter is not applied.
   - `factionRepetitiveTolerance` - A faction can only be played this number of times in a row. Factions can be specified individually inside the object. If they are not listed then the filter is not applied.  

##### MySQL
Connects to a MySQL database.
```json
"mysql": {
  "connectionLimit": 10,
  "host": "host",
  "port": 3306,
  "user": "squadjs",
  "password": "password",
  "database": "squadjs"
}
```
The config is a set of pool connection options as listed in the [Node.js mysql](https://www.npmjs.com/package/mysql) documentation.

#### Plugins
The `plugins` section in your config file lists all plugins built into SquadJS, e.g.:
```json
  "plugins": [
    {
      "plugin": "auto-tk-warn",
      "disabled": false,
      "message": "Please apologise for ALL TKs in ALL chat!"
    }
  ]
```

The `disabled` field can be toggled between `true`/ `false` to enabled/disable the plugin. 

Plugin options are also specified. A full list of plugin options can be seen below.

## Plugins
The following is a list of plugins built into SquadJS, you can click their title for more information:

//PLUGIN-INFO//
 
## Creating Your Own Plugins
To create your own plugin you need a basic knowledge of JavaScript.

Typical plugins are functions that take the server as an argument in order to allow the plugin to access information about the server or manipulate it in some way:
```js
function aPluginToLogServerID(server){
  console.log(server.id);
}
```

Stored in the server object are a range of different properties that store information about the server.
 * `id` - ID of the server.
 * `serverName` - Name of the server.
 * `maxPlayers` - Maximum number of players on the server.
 * `publicSlots` - Maximum number of public slots.
 * `reserveSlots` - Maximum number of reserved slots.
 * `publicQueue` - Length of the public queue.
 * `reserveQueue` - Length of the reserved queue.
 * `matchTimeout` - Time until match ends?
 * `gameVersion` - Game version.
 * `layerHistory` - Array history of layers used with most recent at the start. Each entry is an object with layer info in.
 * `currentLayer` - The current layer.
 * `nextLayer` - The next layer.
 * `players` - Array of players. Each entry is a PlayerObject with various bits of info in.

One approach to making a plugin would be to run an action periodically, in the style of the original SquadJS:
```js
function aPluginToLogPlayerCountEvery60Seconds(server){
  setInterval(() => {
    console.log(server.players.length);
  }, 60 * 1000);
}
```

A more common approach in this version of SquadJS is to react to an event happening:
```js
function aPluginToLogTeamkills(server){
  server.on(TEAMKILL, info => {
    console.log(info);
  });
}
```

A complete list of events that you can listen for and the information included within each is found [here](https://github.com/Thomas-Smyth/SquadJS/blob/master/squad-server/events.js).

Various actions can be completed in a plugin. Most of these will involve outside system, e.g. Discord.js to run a Discord bot, so they are not documented here. However, you may run RCON commands using `server.rcon.execute("Command");`.

If you're struggling to create a plugin, the existing [`plugins`](https://github.com/Thomas-Smyth/SquadJS/tree/master/plugins) are a good place to go for examples or feel free to ask for help in the Squad RCON Discord. 
 
## Statement on Accuracy
Some of the information SquadJS collects from Squad servers was never intended or designed to be collected. As a result, it is impossible for any framework to collect the same information with 100% accuracy. SquadJS aims to get as close as possible to that figure, however, it acknowledges that this is not possible in some specific scenarios.

Below is a list of scenarios we know may cause some information to be inaccurate:
 * Use of Realtime Server and Player Information - We update server and player information periodically every 30 seconds (by default) or when we know that it requires an update. As a result, some information about the server or players may be up to 30 seconds out of date.
 * SquadJS Restarts - If SquadJS is started during an active Squad game some information will be lost or not collected correctly:
     - The current state of players will be lost. For example, if a player was wounded prior to the bot starting and then is revived/gives up after the bot is started information regarding who originally wounded them will not be known.
     - The accurate collection of some server log events will not occur. SquadJS collects players' "suffix" name, i.e. their Steam name without the clan tag added via the game settings, when they join the server and uses this to identify them in certain logs that do not include their full name. As a result, for players connecting prior to SquadJS starting some log events associated with their actions will show the player as `null`. We aim to implement a solution to attempt to recover players' suffix names when this occurs, but the accuracy of correctly identifying players will be decreased.
 * Duplicated Player Names - If two or more players have the same name or suffix name (see above) then SquadJS will be unable to identify them in the logs. When this occurs event logs will show the player as `null`. Be on the watch for groups of players who try to abuse this in order to TK or complete other malicious actions without being detected by SquadJS plugins. 

## Credits
SquadJS would not be possible without the support of so many individuals and organisations. My thanks goes out to:
 * subtlerod for proposing the initial log parsing idea, helping to design the log parsing process and for providing multiple servers to test with.
 * Fourleaf, Mex and various other members of ToG / ToG-L for helping to stage logs and participate in small scale tests.
 * The Coalition community, including those that participate in Wednesday Fight Night, for participating in larger scale tests and for providing feedback on plugins.
 * My GitHub sponsors!
 * Everyone in the Squad RCON Discord and others who have submitted bug reports, suggestions and feedback.
 * iDronee for providing Linux Squad server logs to ensure log parsing regexes support the OS.

## License
```
Boost Software License - Version 1.0 - August 17th, 2003

Copyright (c) 2020 Thomas Smyth

Permission is hereby granted, free of charge, to any person or organization
obtaining a copy of the software and accompanying documentation covered by
this license (the "Software") to use, reproduce, display, distribute,
execute, and transmit the Software, and to prepare derivative works of the
Software, and to permit third-parties to whom the Software is furnished to
do so, all subject to the following:

The copyright notices in the Software and this entire statement, including
the above license grant, this restriction and the following disclaimer,
must be included in all copies of the Software, in whole or in part, and
all derivative works of the Software, unless such copies or derivative
works are solely in the form of machine-executable object code generated by
a source language processor.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, TITLE AND NON-INFRINGEMENT. IN NO EVENT
SHALL THE COPYRIGHT HOLDERS OR ANYONE DISTRIBUTING THE SOFTWARE BE LIABLE
FOR ANY DAMAGES OR OTHER LIABILITY, WHETHER IN CONTRACT, TORT OR OTHERWISE,
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```
