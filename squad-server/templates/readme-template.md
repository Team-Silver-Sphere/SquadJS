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

## **About**
SquadJS is a scripting framework, designed for Squad servers, that aims to handle all communication and data collection to and from the servers. Using SquadJS as the base to any of your scripting projects allows you to easily write complex plugins without having to worry about the hassle of RCON or log parsing. However, for your convenience SquadJS comes shipped with multiple plugins already built for you allowing you to experience the power of SquadJS right away.

<br>

## **Using SquadJS**
SquadJS relies on being able to access the Squad server log directory in order to parse logs live to collect information. Thus, SquadJS must be hosted on the same server box as your Squad server or be connected to your Squad server via FTP.

#### Prerequisites
* Git
* [Node.js](https://nodejs.org/en/) (14.x) - [Download](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/) (Version 1.22.0+) - [Download](https://classic.yarnpkg.com/en/docs/install)
* Some plugins may have additional requirements.

#### Installation
1. [Download SquadJS](https://github.com/Thomas-Smyth/SquadJS/releases/latest) and unzip the download.
2. Open the unzipped folder in your terminal.
3. Install the dependencies by running `yarn install` in your terminal. Due to the use of Yarn Workspaces it is important to use `yarn install` and **not** `npm install` as this will not work and will break stuff.
4. Configure the `config.json` file. See below for more details.
5. Start SquadJS by running `node index.js` in your terminal.

**Note** - If you are interested in testing versions of SquadJS not yet released please download/clone the `master` branch. Please also see [here](#versions-and-releases) for more information on our versions and release procedures.

<br>

## **Configuring SquadJS**
SquadJS can be configured via a JSON configuration file which, by default, is located in the SquadJS and is named [config.json](./config.json).

The config file needs to be valid JSON syntax. If an error is thrown saying the config cannot be parsed then try putting the config into a JSON syntax checker (there's plenty to choose from that can be found via Google).

<details>
  <summary>Server</summary>

## Server Configuration

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
    "ftp":{
      "port": 21,
      "user": "FTP Username",
      "password": "FTP Password",
      "useListForSize": false
    },
    "adminLists": [
      {
        "type": "local",
        "source": "C:/Users/Administrator/Desktop/Servers/sq_arty_party/SquadGame/ServerConfig/Admins.cfg",
      },
      {
        "type": "remote",
        "source": "http://yourWebsite.com/Server1/Admins.cfg",
      }
    ]
  },
  ```
* `id` - An integer ID to uniquely identify the server.
* `host` - The IP of the server.
* `queryPort` - The query port of the server.
* `rconPort` - The RCON port of the server.
* `rconPassword` - The RCON password of the server.
* `logReaderMode` - `tail` will read from a local log file. `ftp` will read from a remote log file using the FTP protocol.
* `logDir` - The folder where your Squad logs are saved. Most likely will be `C:/servers/squad_server/SquadGame/Saved/Logs`.
* `ftp:port` - The FTP port of the server. Only required for `ftp` `logReaderMode`.
* `ftp:user` - The FTP user of the server. Only required for `ftp` `logReaderMode`.
* `ftp:password` - The FTP password of the server. Only required for `ftp` `logReaderMode`.
* `adminLists` - Sources for identifying an admins on the server, either remote or local.

  ---
</details>


<details>
  <summary>Connectors</summary>

## Connector Configuration

Connectors allow SquadJS to communicate with external resources.
  ```json
  "connectors": {
    "discord": "Discord Login Token",
  },
  ```
Connectors should be named, for example the above is named `discord`, and should have the associated config against it. Configs can be specified by name in plugin options. Should a connector not be needed by any plugin then the default values can be left or you can remove it from your config file.

See below for more details on connectors and their associated config.

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
    - `historyResetTime` - After this number of milliseconds the layer history is no longer considered.
    - `layerHistoryTolerance` - A layer can only be played again after this number of layers.
    - `mapHistoryTolerance` - A map can only be played again after this number of layers.
    - `gamemodeHistoryTolerance` - A gamemode can only be played again after this number of layers. Gamemodes can be specified individually inside the object. If they are not listed then the filter is not applied.
    - `gamemodeRepetitiveTolerance` - A gamemode can only be played this number of times in a row. Gamemodes can be specified individually inside the object. If they are not listed then the filter is not applied.
    - `playerCountComplianceEnabled` - Filter layers by player count.
    - `factionComplianceEnabled` - Filter layers so that a team cannot play the same faction twice in a row.
    - `factionHistoryTolerance` - A faction can only be played again after this number of layers. Factions can be specified individually inside the object. If they are not listed then the filter is not applied.
    - `factionRepetitiveTolerance` - A faction can only be played this number of times in a row. Factions can be specified individually inside the object. If they are not listed then the filter is not applied.

##### Discord
Connects to Discord via `discord.js`.
  ```json
  "discord": "Discord Login Token",
  ```
Requires a Discord bot login token.


##### Databases
SquadJS uses [Sequelize](https://sequelize.org/) to connect and use a wide range of SQL databases.

The connector should be configured using any of Sequelize's single argument configuration options.

For example:
  ```json
  "mysql": "mysql://user:pass@example.com:5432/dbname"
  ```

or:
  ```json
  "sqlite": {
      "dialect": "sqlite",
      "storage": "path/to/database.sqlite"
  }
  ```

See [Sequelize's documentation](https://sequelize.org/master/manual/getting-started.html#connecting-to-a-database) for more details.

  ---
</details>

<details>
  <summary>Plugins</summary>

## Plugin Configuration

The `plugins` section in your config file lists all plugins built into SquadJS
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

  ---
</details>

<details>
  <summary>Verboseness</summary>

## Console Output Configuration

The `logger` section configures how verbose a module of SquadJS will be as well as the displayed color.
  ```json
    "logger": {
      "verboseness": {
        "SquadServer": 1,
        "LogParser": 1,
        "RCON": 1
      },
      "colors": {
        "SquadServer": "yellowBright",
        "SquadServerFactory": "yellowBright",
        "LogParser": "blueBright",
        "RCON": "redBright"
      }
    }
  ```
The larger the number set in the `verboseness` section for a specified module the more it will print to the console.

  ---
</details>

<br>

## **Plugins**
The following is a list of plugins built into SquadJS, you can click their title for more information:

Interested in creating your own plugin? [See more here](./squad-server/plugins/readme.md)

//PLUGIN-INFO//

<br>

## Statement on Accuracy
Some information SquadJS collects from Squad servers was never intended or designed to be collected. As a result, it is impossible for any framework to collect the same information with 100% accuracy. SquadJS aims to get as close as possible to that figure, however, it acknowledges that this is not possible in some specific scenarios.

Below is a list of scenarios we know may cause some information to be inaccurate:
* Use of Realtime Server and Player Information - We update server and player information periodically every 30 seconds (by default) or when we know that it requires an update. As a result, some information about the server or players may be up to 30 seconds out of date or greater if an error occurs whilst updating this information.
* SquadJS Restarts - If SquadJS is started during an active Squad game some information will be lost or not collected correctly:
    - The current state of players will be lost. For example, if a player was wounded prior to the bot starting and then is revived/gives up after the bot is started information regarding who originally wounded them will not be known.
    - The accurate collection of some server log events will not occur. SquadJS collects players' "suffix" name, i.e. their Steam name without the clan tag added via the game settings, when they join the server and uses this to identify them in certain logs that do not include their full name. As a result, for players connecting prior to SquadJS starting some log events associated with their actions will show the player as `null`.
* Duplicated Player Names - If two or more players have the same name or suffix name (see above) then SquadJS will be unable to identify them in the logs. When this occurs event logs will show the player as `null`. Be on the watch for groups of players who try to abuse this in order to TK or complete other malicious actions without being detected by SquadJS plugins.

## SquadJS API
SquadJS pings the following data to the [SquadJS API](https://github.com/Thomas-Smyth/SquadJS-API/) at regular intervals to assist with its development:
* Squad server IP, query port, name & player count (including queue size).
* SquadJS version.
* Log reader mode, i.e. `tail` or `ftp`.
* Plugin configuration.

At this time, this cannot be disabled.

Please note, plugin configurations do **not** and should **not** contain any sensitive information which allows us to collect this information. Any sensitive information, e.g. Discord login tokens, should be included in the `connectors` section of the config which is not sent to our API. It is important that developers of custom plugins maintain this approach to avoid submitting confidential information to our API.

## Versions and Releases
Whilst installing SquadJS you may do the following to obtain slightly different versions:
* Download the [latest release](https://github.com/Thomas-Smyth/SquadJS/releases/latest) - To get the latest **stable** version of SquadJS.
* Download/clone the [`master` branch](https://github.com/Thomas-Smyth/SquadJS/) - To get the most up to date version of SquadJS.

All changes proposed to SquadJS will be merged into the `master` branch prior to being released in the next stable version to allow for a period of larger-scale testing to occur. Therefore, we only recommend individuals who are willing to update regularly and partake in testing/bug reporting use the `master` branch. Please note, updates to the `master` branch will not be advertised in the SquadJS startup information, however, notifications of merged pull requests into the `master` branch may be found in our [Discord](https://discord.gg/9F2Ng5C). Once the `master` branch is deemed stable a release will be published and advertised via the SquadJS startup information and our [Discord](https://discord.gg/9F2Ng5C).

Releases will be given a version number with the format `v{major}.{minor}.{patch}`, e.g. `v3.1.4`. Changes to `{major}`/`{minor}`/`{patch}` will imply the following:
* `{major}` - The release contains a new/updated feature that is (potentially) breaking, e.g. changes to event outputs that may cause custom plugins to break.
* `{minor}` - The release contains a new/updated feature.
* `{patch}` - The release contains a bug fix.

Please note, `{minor}`/`{patch}` releases may still break SquadJS installations, however, this may be prevented with configuration changes and should not require custom plugins to be updated.

Release version numbers and changelogs are managed by [Release Drafter](https://github.com/marketplace/actions/release-drafter) which relies on the appropriate labels being applied to pull requests. Version numbers are updated in the `package.json` file manually prior to publishing the release draft.

## Credits
SquadJS would not be possible without the support of so many individuals and organisations. Our thanks goes out to:
* [SquadJS's contributors](https://github.com/Thomas-Smyth/SquadJS/graphs/contributors).
* [Thomas Smyth's GitHub sponsors](https://github.com/sponsors/Thomas-Smyth).
* subtlerod for proposing the initial log parsing idea, helping to design the log parsing process and for providing multiple servers to test with.
* Shanomac99 and the rest of the Squad Wiki team for providing us with [layer information](https://github.com/Squad-Wiki-Editorial/squad-wiki-pipeline-map-data).
* Fourleaf, Mex, various members of ToG / ToG-L and others that helped to stage logs and participate in small scale tests.
* Various Squad servers/communities for participating in larger scale tests and for providing feedback on plugins.
* Everyone in the [Squad RCON Discord](https://discord.gg/9F2Ng5C) and others who have submitted bug reports, suggestions, feedback and provided logs.

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
