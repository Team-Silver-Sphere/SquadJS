<div align="center">

<img src="assets/squadjs-logo-white.png#gh-dark-mode-only" alt="Logo" width="500"/>
<img src="assets/squadjs-logo.png#gh-light-mode-only" alt="Logo" width="500"/>

#### SquadJS

[![GitHub release](https://img.shields.io/github/release/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/releases)
[![GitHub contributors](https://img.shields.io/github/contributors/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/graphs/contributors)
[![GitHub release](https://img.shields.io/github/license/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/blob/master/LICENSE)

<br>

[![GitHub issues](https://img.shields.io/github/issues/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/pulls)
[![GitHub issues](https://img.shields.io/github/stars/Team-Silver-Sphere/SquadJS.svg?style=flat-square)](https://github.com/Team-Silver-Sphere/SquadJS/stargazers)
[![Discord](https://img.shields.io/discord/266210223406972928.svg?style=flat-square&logo=discord)](https://discord.gg/9F2Ng5C)

<br><br>
</div>

## **About**
SquadJS is a powerful scripting framework designed to streamline Squad server management. By handling all server communication and data collection, SquadJS eliminates the complexities of RCON and log parsing. This allows developers to focus on creating sophisticated plugins without the underlying infrastructure headaches. Build your next Squad scripting project on a solid foundation with SquadJS.

<br>

## **Using SquadJS**
SquadJS relies on being able to access the Squad server log directory in order to parse logs live to collect information. Thus, SquadJS must be hosted on the same server box as your Squad server or be connected to your Squad server via FTP or SFTP.

#### Prerequisites
* Git
* [Node.js](https://nodejs.org/en/) (14.x) - [Download](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/) (Version 1.22.0+) - [Download](https://classic.yarnpkg.com/en/docs/install)
* Some plugins may have additional requirements.

#### Installation
1. [Download SquadJS](https://github.com/Team-Silver-Sphere/SquadJS/releases/latest) and unzip the download.
2. Open the unzipped folder in your terminal.
3. Install the dependencies by running `yarn install` in your terminal. Due to the use of Yarn Workspaces it is important to use `yarn install` and **not** `npm install` as this will not work and will break stuff.
4. Configure the `config.json` file. See below for more details.
5. Start SquadJS by running `node index.ts` in your terminal.

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
    "ftp": {
      "port": 21,
      "user": "FTP Username",
      "password": "FTP Password"
    },
    "sftp": {
      "host": "xxx.xxx.xxx.xxx",
      "port": 21,
      "username": "SFTP Username",
      "password": "SFTP Password"
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
SquadJS plugins unlock the framework's full potential by giving you access to its extensive data.  These powerful tools can automate a wide range of tasks, from warmly welcoming new players to meticulously collecting player statistics.

A thriving community of developers creates and shares a wealth of open-source plugins, like the ones listed below. Remember, these third-party plugins may vary in quality and compatibility.

 * [SquadJS API Plugin](./plugins/squadjs-api-plugin) (Installed by Default)
 * [SquadJS Command Plugin](./plugins/squadjs-command-plugin) (Installed by Default)

Want to join the fun and build your own plugin? Check out the comprehensive guide [here](./plugin-development.md).

## Statement on Accuracy
Some information SquadJS collects from Squad servers was never intended or designed to be collected. As a result, it is impossible for any framework to collect the same information with 100% accuracy. SquadJS aims to get as close as possible to that figure, however, it acknowledges that this is not possible in some specific scenarios.

Below is a list of scenarios we know may cause some information to be inaccurate:
* Use of Realtime Server and Player Information - We update server and player information periodically every 30 seconds (by default) or when we know that it requires an update. As a result, some information about the server or players may be up to 30 seconds out of date or greater if an error occurs whilst updating this information.
* SquadJS Restarts - If SquadJS is started during an active Squad game some information will be lost or not collected correctly:
    - The current state of players will be lost. For example, if a player was wounded prior to the bot starting and then is revived/gives up after the bot is started information regarding who originally wounded them will not be known.
    - The accurate collection of some server log events will not occur. SquadJS collects players' "suffix" name, i.e. their Steam name without the clan tag added via the game settings, when they join the server and uses this to identify them in certain logs that do not include their full name. As a result, for players connecting prior to SquadJS starting some log events associated with their actions will show the player as `null`.
* Duplicated Player Names - If two or more players have the same name or suffix name (see above) then SquadJS will be unable to identify them in the logs. When this occurs event logs will show the player as `null`. Be on the watch for groups of players who try to abuse this in order to TK or complete other malicious actions without being detected by SquadJS plugins.

## Versions and Releases
Whilst installing SquadJS you may do the following to obtain slightly different versions:
* Download the [latest release](https://github.com/Team-Silver-Sphere/SquadJS/releases/latest) - To get the latest **stable** version of SquadJS.
* Download/clone the [`master` branch](https://github.com/Team-Silver-Sphere/SquadJS/) - To get the most up to date version of SquadJS.

All changes proposed to SquadJS will be merged into the `master` branch prior to being released in the next stable version to allow for a period of larger-scale testing to occur. Therefore, we only recommend individuals who are willing to update regularly and partake in testing/bug reporting use the `master` branch. Please note, updates to the `master` branch will not be advertised in the SquadJS startup information, however, notifications of merged pull requests into the `master` branch may be found in our [Discord](https://discord.gg/9F2Ng5C). Once the `master` branch is deemed stable a release will be published and advertised via the SquadJS startup information and our [Discord](https://discord.gg/9F2Ng5C).

Releases will be given a version number with the format `v{major}.{minor}.{patch}`, e.g. `v3.1.4`. Changes to `{major}`/`{minor}`/`{patch}` will imply the following:
* `{major}` - The release contains a new/updated feature that is (potentially) breaking, e.g. changes to event outputs that may cause custom plugins to break.
* `{minor}` - The release contains a new/updated feature.
* `{patch}` - The release contains a bug fix.

Please note, `{minor}`/`{patch}` releases may still break SquadJS installations, however, this may be prevented with configuration changes and should not require custom plugins to be updated.

Release version numbers and changelogs are managed by [Release Drafter](https://github.com/marketplace/actions/release-drafter) which relies on the appropriate labels being applied to pull requests. Version numbers are updated in the `package.json` file manually prior to publishing the release draft.

The above policy was written and put into effect after the release of SquadJS v2.0.5. A major version bump to SquadJS v3.0.0 was made to signify this policy taking affect and to draw a line under the previous poor management of releases and version numbers.

## Credits
SquadJS would not be possible without the support of so many individuals and organisations. Our thanks goes out to:
* [SquadJS's contributors](https://github.com/Team-Silver-Sphere/SquadJS/graphs/contributors).
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
