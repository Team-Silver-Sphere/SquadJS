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
1. Clone the repository: `git clone https://github.com/Thomas-Smyth/SquadJS`
2. Install the dependencies: `yarn install`
3. Configure the `config.json` file. See below for more details.
4. Start SquadJS: `node index.js`.

**Note** - We use Yarn Workspaces so `npm install` will not work and will break stuff!

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

<details>
          <summary>AutoKickUnassigned</summary>
          <h2>AutoKickUnassigned</h2>
          <p>The <code>AutoKickUnassigned</code> plugin will automatically kick players that are not in a squad after a specified ammount of time.</p>
          <h3>Options</h3>
          <ul><li><h4>warningMessage</h4>
           <h6>Description</h6>
           <p>Message SquadJS will send to players warning them they will be kicked</p>
           <h6>Default</h6>
           <pre><code>Join a squad, you are are unassigned and will be kicked</code></pre></li>
<li><h4>kickMessage</h4>
           <h6>Description</h6>
           <p>Message to send to players when they are kicked</p>
           <h6>Default</h6>
           <pre><code>Unassigned - automatically removed</code></pre></li>
<li><h4>frequencyOfWarnings</h4>
           <h6>Description</h6>
           <p>How often in <b>Seconds</b> should we warn the player about being unassigned?</p>
           <h6>Default</h6>
           <pre><code>30</code></pre></li>
<li><h4>unassignedTimer</h4>
           <h6>Description</h6>
           <p>How long in <b>Seconds</b> to wait before a unassigned player is kicked</p>
           <h6>Default</h6>
           <pre><code>360</code></pre></li>
<li><h4>playerThreshold</h4>
           <h6>Description</h6>
           <p>Player count required for AutoKick to start kicking players, set to -1 to disable</p>
           <h6>Default</h6>
           <pre><code>93</code></pre></li>
<li><h4>roundStartDelay</h4>
           <h6>Description</h6>
           <p>Time delay in <b>Seconds</b> from start of the round before AutoKick starts kicking again</p>
           <h6>Default</h6>
           <pre><code>900</code></pre></li>
<li><h4>ignoreAdmins</h4>
           <h6>Description</h6>
           <p><ul><li><code>true</code>: Admins will <b>NOT</b> be kicked</li><li><code>false</code>: Admins <b>WILL</b> be kicked</li></ul></p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li>
<li><h4>ignoreWhitelist</h4>
           <h6>Description</h6>
           <p><ul><li><code>true</code>: Reserve slot players will <b>NOT</b> be kicked</li><li><code>false</code>: Reserve slot players <b>WILL</b> be kicked</li></ul></p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
        </details>

<details>
          <summary>AutoTKWarn</summary>
          <h2>AutoTKWarn</h2>
          <p>The <code>AutoTkWarn</code> plugin will automatically warn players with a message when they teamkill.</p>
          <h3>Options</h3>
          <ul><li><h4>message</h4>
           <h6>Description</h6>
           <p>The message to warn players with.</p>
           <h6>Default</h6>
           <pre><code>Please apologise for ALL TKs in ALL chat!</code></pre></li></ul>
        </details>

<details>
          <summary>ChatCommands</summary>
          <h2>ChatCommands</h2>
          <p>The <code>ChatCommands</code> plugin can be configured to make chat commands that broadcast or warn the caller with present messages.</p>
          <h3>Options</h3>
          <ul><li><h4>commands</h4>
           <h6>Description</h6>
           <p>An array of objects containing the following properties: <ul><li><code>command</code> - The command that initiates the message.</li><li><code>type</code> - Either <code>warn</code> or <code>broadcast</code>.</li><li><code>response</code> - The message to respond with.</li><li><code>ignoreChats</code> - A list of chats to ignore the commands in. Use this to limit it to admins.</li></ul></p>
           <h6>Default</h6>
           <pre><code>[
  {
    "command": "squadjs",
    "type": "warn",
    "response": "This server is powered by SquadJS.",
    "ignoreChats": []
  }
]</code></pre></li></ul>
        </details>

<details>
          <summary>DBLog</summary>
          <h2>DBLog</h2>
          <p>The <code>mysql-log</code> plugin will log various server statistics and events to a database. This is great for server performance monitoring and/or player stat tracking.

Grafana (NOT YET WORKING WITH V2):
<ul><li> <a href="https://grafana.com/">Grafana</a> is a cool way of viewing server statistics stored in the database.</li>
<li>Install Grafana.</li>
<li>Add your database as a datasource named <code>SquadJS</code>.</li>
<li>Import the <a href="https://github.com/Thomas-Smyth/SquadJS/blob/master/squad-server/templates/SquadJS-Dashboard-v2.json">SquadJS Dashboard</a> to get a preconfigured MySQL only Grafana dashboard.</li>
<li>Install any missing Grafana plugins.</li></ul></p>
          <h3>Options</h3>
          <ul><li><h4>database (Required)</h4>
           <h6>Description</h6>
           <p>The Sequelize connector to log server information to.</p>
           <h6>Default</h6>
           <pre><code>mysql</code></pre></li>
<li><h4>overrideServerID</h4>
           <h6>Description</h6>
           <p>A overridden server ID.</p>
           <h6>Default</h6>
           <pre><code>null</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordAdminBroadcast</summary>
          <h2>DiscordAdminBroadcast</h2>
          <p>The <code>DiscordAdminBroadcast</code> plugin will send a copy of admin broadcasts made in game to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log admin broadcasts to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordAdminCamLogs</summary>
          <h2>DiscordAdminCamLogs</h2>
          <p>The <code>DiscordAdminCamLogs</code> plugin will log in game admin camera usage to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log admin camera usage to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordAdminRequest</summary>
          <h2>DiscordAdminRequest</h2>
          <p>The <code>DiscordAdminRequest</code> plugin will ping admins in a Discord channel when a player requests an admin via the <code>!admin</code> command in in-game chat.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log admin broadcasts to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>ignoreChats</h4>
           <h6>Description</h6>
           <p>A list of chat names to ignore.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  "ChatSquad"
]</code></pre>
<li><h4>ignorePhrases</h4>
           <h6>Description</h6>
           <p>A list of phrases to ignore.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  "switch"
]</code></pre>
<li><h4>command</h4>
           <h6>Description</h6>
           <p>The command that calls an admin.</p>
           <h6>Default</h6>
           <pre><code>admin</code></pre></li>
<li><h4>pingGroups</h4>
           <h6>Description</h6>
           <p>A list of Discord role IDs to ping.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  "500455137626554379"
]</code></pre>
<li><h4>pingDelay</h4>
           <h6>Description</h6>
           <p>Cooldown for pings in milliseconds.</p>
           <h6>Default</h6>
           <pre><code>60000</code></pre></li>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordChat</summary>
          <h2>DiscordChat</h2>
          <p>The <code>DiscordChat</code> plugin will log in-game chat to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log admin broadcasts to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>chatColors</h4>
           <h6>Description</h6>
           <p>The color of the embed for each chat.</p>
           <h6>Default</h6>
           <pre><code>{}</code></pre></li><h6>Example</h6>
           <pre><code>{
  "ChatAll": 16761867
}</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li>
<li><h4>ignoreChats</h4>
           <h6>Description</h6>
           <p>A list of chat names to ignore.</p>
           <h6>Default</h6>
           <pre><code>[
  "ChatSquad"
]</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordDebug</summary>
          <h2>DiscordDebug</h2>
          <p>The <code>DiscordDebug</code> plugin can be used to help debug SquadJS by dumping SquadJS events to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log events to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>events (Required)</h4>
           <h6>Description</h6>
           <p>A list of events to dump.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  "PLAYER_DIED"
]</code></pre></ul>
        </details>

<details>
          <summary>DiscordPlaceholder</summary>
          <h2>DiscordPlaceholder</h2>
          <p>The <code>DiscordPlaceholder</code> plugin allows you to make your bot create placeholder messages that can be used when configuring other plugins.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>command</h4>
           <h6>Description</h6>
           <p>Command to create Discord placeholder.</p>
           <h6>Default</h6>
           <pre><code>!placeholder</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordRcon</summary>
          <h2>DiscordRcon</h2>
          <p>The <code>DiscordRcon</code> plugin allows a specified Discord channel to be used as a RCON console to run RCON commands.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>ID of channel to turn into RCON console.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>permissions</h4>
           <h6>Description</h6>
           <p><ul><li>Dictionary of roles and a list of the permissions they are allowed to use.<li>If dictionary is empty (<code>{}</code>) permissions will be disabled</li><li>A list of available RCON commands can be found here <a>https://squad.gamepedia.com/Server_Administration#Admin_Console_Commands</a>.</ul></p>
           <h6>Default</h6>
           <pre><code>{}</code></pre></li><h6>Example</h6>
           <pre><code>{
  "123456789123456789": [
    "AdminBroadcast",
    "AdminForceTeamChange",
    "AdminDemoteCommander"
  ]
}</code></pre>
<li><h4>prependAdminNameInBroadcast</h4>
           <h6>Description</h6>
           <p>Prepend admin names when making announcements.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordRoundWinner</summary>
          <h2>DiscordRoundWinner</h2>
          <p>The <code>DiscordRoundWinner</code> plugin will send the round winner to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log admin broadcasts to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordServerStatus</summary>
          <h2>DiscordServerStatus</h2>
          <p>The <code>DiscordServerStatus</code> plugin updates a message in Discord with current server information, e.g. player count.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>messageIDs (Required)</h4>
           <h6>Description</h6>
           <p>ID of messages to update.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  {
    "channelID": "667741905228136459",
    "messageID": "766688383043895387"
  }
]</code></pre>
<li><h4>updateInterval</h4>
           <h6>Description</h6>
           <p>How frequently to update the status in Discord.</p>
           <h6>Default</h6>
           <pre><code>60000</code></pre></li>
<li><h4>disableStatus</h4>
           <h6>Description</h6>
           <p>Disable the bot status.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordSubsystemRestarter</summary>
          <h2>DiscordSubsystemRestarter</h2>
          <p>The <code>DiscordSubSystemRestarter</code> plugin allows you to manually restart SquadJS subsystems in case an issues arises with them.<ul><li><code>!squadjs restartsubsystem rcon</code></li><li><code>!squadjs restartsubsystem logparser</code></li></ul></p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>role (Required)</h4>
           <h6>Description</h6>
           <p>ID of role required to run the sub system restart commands.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre></ul>
        </details>

<details>
          <summary>DiscordTeamkill</summary>
          <h2>DiscordTeamkill</h2>
          <p>The <code>DiscordTeamkill</code> plugin logs teamkills and related information to a Discord channel for admins to review.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log teamkills to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embeds.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li>
<li><h4>disableSCBL</h4>
           <h6>Description</h6>
           <p>Disable Squad Community Ban List information.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
        </details>

<details>
          <summary>IntervalledBroadcasts</summary>
          <h2>IntervalledBroadcasts</h2>
          <p>The <code>IntervalledBroadcasts</code> plugin allows you to set broadcasts, which will be broadcasted at preset intervals</p>
          <h3>Options</h3>
          <ul><li><h4>broadcasts</h4>
           <h6>Description</h6>
           <p>Messages to broadcast.</p>
           <h6>Default</h6>
           <pre><code>[]</code></pre></li><h6>Example</h6>
           <pre><code>[
  "This server is powered by SquadJS."
]</code></pre>
<li><h4>interval</h4>
           <h6>Description</h6>
           <p>Frequency of the broadcasts in milliseconds.</p>
           <h6>Default</h6>
           <pre><code>300000</code></pre></li></ul>
        </details>

<details>
          <summary>SCBLInfo</summary>
          <h2>SCBLInfo</h2>
          <p>The <code>SCBLInfo</code> plugin alerts admins when a harmful player is detected joining their server based on data from the <a href="https://squad-community-ban-list.com/">Squad Community Ban List</a>.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to alert admins through.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>threshold</h4>
           <h6>Description</h6>
           <p>Admins will be alerted when a player has this or more reputation points. For more information on reputation points, see the <a href="https://squad-community-ban-list.com/faq">Squad Community Ban List's FAQ</a></p>
           <h6>Default</h6>
           <pre><code>6</code></pre></li></ul>
        </details>

<details>
          <summary>SeedingMode</summary>
          <h2>SeedingMode</h2>
          <p>The <code>SeedingMode</code> plugin broadcasts seeding rule messages to players at regular intervals when the server is below a specified player count. It can also be configured to display "Live" messages when the server goes live.</p>
          <h3>Options</h3>
          <ul><li><h4>interval</h4>
           <h6>Description</h6>
           <p>Frequency of seeding messages in milliseconds.</p>
           <h6>Default</h6>
           <pre><code>150000</code></pre></li>
<li><h4>seedingThreshold</h4>
           <h6>Description</h6>
           <p>Player count required for server not to be in seeding mode.</p>
           <h6>Default</h6>
           <pre><code>50</code></pre></li>
<li><h4>seedingMessage</h4>
           <h6>Description</h6>
           <p>Seeding message to display.</p>
           <h6>Default</h6>
           <pre><code>Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!</code></pre></li>
<li><h4>liveEnabled</h4>
           <h6>Description</h6>
           <p>Enable "Live" messages for when the server goes live.</p>
           <h6>Default</h6>
           <pre><code>true</code></pre></li>
<li><h4>liveThreshold</h4>
           <h6>Description</h6>
           <p>Player count required for "Live" messages to not bee displayed.</p>
           <h6>Default</h6>
           <pre><code>52</code></pre></li>
<li><h4>liveMessage</h4>
           <h6>Description</h6>
           <p>"Live" message to display.</p>
           <h6>Default</h6>
           <pre><code>Live!</code></pre></li></ul>
        </details>

<details>
          <summary>SocketIOAPI</summary>
          <h2>SocketIOAPI</h2>
          <p>The <code>SocketIOAPI</code> plugin allows remote access to a SquadJS instance via Socket.IO<br />As a client example you can use this to connect to the socket.io server;<pre><code>
      const socket = io.connect('ws://IP:PORT', {
        auth: {
          token: "MySecretPassword"
        }
      })
    </code></pre>If you need more documentation about socket.io please go ahead and read the following;<br />General Socket.io documentation: <a href="https://socket.io/docs/v3" target="_blank">Socket.io Docs</a><br />Authentication and securing your websocket: <a href="https://socket.io/docs/v3/middlewares/#Sending-credentials" target="_blank">Sending-credentials</a></p>
          <h3>Options</h3>
          <ul><li><h4>websocketPort (Required)</h4>
           <h6>Description</h6>
           <p>The port for the websocket.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>3000</code></pre>
<li><h4>securityToken (Required)</h4>
           <h6>Description</h6>
           <p>Your secret token/password for connecting.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>MySecretPassword</code></pre></ul>
        </details>

<details>
          <summary>TeamRandomizer</summary>
          <h2>TeamRandomizer</h2>
          <p>The <code>TeamRandomizer</code> can be used to randomize teams. It's great for destroying clan stacks or for social events. It can be run by typing, by default, <code>!randomize</code> into in-game admin chat</p>
          <h3>Options</h3>
          <ul><li><h4>command</h4>
           <h6>Description</h6>
           <p>The command used to randomize the teams.</p>
           <h6>Default</h6>
           <pre><code>randomize</code></pre></li></ul>
        </details>

<br>

## Statement on Accuracy
Some of the information SquadJS collects from Squad servers was never intended or designed to be collected. As a result, it is impossible for any framework to collect the same information with 100% accuracy. SquadJS aims to get as close as possible to that figure, however, it acknowledges that this is not possible in some specific scenarios.

Below is a list of scenarios we know may cause some information to be inaccurate:
 * Use of Realtime Server and Player Information - We update server and player information periodically every 30 seconds (by default) or when we know that it requires an update. As a result, some information about the server or players may be up to 30 seconds out of date.
 * SquadJS Restarts - If SquadJS is started during an active Squad game some information will be lost or not collected correctly:
     - The current state of players will be lost. For example, if a player was wounded prior to the bot starting and then is revived/gives up after the bot is started information regarding who originally wounded them will not be known.
     - The accurate collection of some server log events will not occur. SquadJS collects players' "suffix" name, i.e. their Steam name without the clan tag added via the game settings, when they join the server and uses this to identify them in certain logs that do not include their full name. As a result, for players connecting prior to SquadJS starting some log events associated with their actions will show the player as `null`. We aim to implement a solution to attempt to recover players' suffix names when this occurs, but the accuracy of correctly identifying players will be decreased.
 * Duplicated Player Names - If two or more players have the same name or suffix name (see above) then SquadJS will be unable to identify them in the logs. When this occurs event logs will show the player as `null`. Be on the watch for groups of players who try to abuse this in order to TK or complete other malicious actions without being detected by SquadJS plugins. 

## Credits
SquadJS would not be possible without the support of so many individuals and organisations. Our thanks goes out to:
 * [SquadJS's contributors](https://github.com/Thomas-Smyth/SquadJS/graphs/contributors)
 * [Thomas Smyth's GitHub sponsors](https://github.com/sponsors/Thomas-Smyth)
 * subtlerod for proposing the initial log parsing idea, helping to design the log parsing process and for providing multiple servers to test with.
 * Fourleaf, Mex, various members of ToG / ToG-L and others that helped to stage logs and participate in small scale tests.
 * Various Squad servers/communities for participating in larger scale tests and for providing feedback on plugins.
 * Everyone in the Squad RCON Discord and others who have submitted bug reports, suggestions, feedback and provided logs.

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
