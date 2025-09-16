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
SquadJS is a scripting framework, designed for Squad servers, that aims to handle all communication and data collection to and from the servers. Using SquadJS as the base to any of your scripting projects allows you to easily write complex plugins without having to worry about the hassle of RCON or log parsing. However, for your convenience SquadJS comes shipped with multiple plugins already built for you allowing you to experience the power of SquadJS right away.

<br>

## **Using SquadJS**
SquadJS relies on being able to access the Squad server log directory in order to parse logs live to collect information. Thus, SquadJS must be hosted on the same server box as your Squad server or be connected to your Squad server via FTP.

#### Prerequisites
* Git
* [Node.js](https://nodejs.org/en/) (18.x) - [Download](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/) (Version 1.22.0+) - [Download](https://classic.yarnpkg.com/en/docs/install)
* Some plugins may have additional requirements.

#### Installation
1. [Download SquadJS](https://github.com/Team-Silver-Sphere/SquadJS/releases/latest) and unzip the download.
2. Open the unzipped folder in your terminal.
3. Install the dependencies by running `yarn install --ignore-engines` in your terminal. Due to the use of Yarn Workspaces it is important to use `yarn install --ignore-engines` and **not** `npm install` as this will not work and will break stuff.
Documentation has been altered slightly from the `yarn install` normal install flow. This is a stop gap until the orignal issue is corrected.
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
    "ftp": {
      "host": "xxx.xxx.xxx.xxx",
      "port": 21,
      "user": "FTP Username",
      "password": "FTP Password"
    },
    "sftp": {
      "host": "xxx.xxx.xxx.xxx",
      "port": 22,
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
      },
      {
        "type": "ftp",
        "source": "ftp://<user>:<password>@<host>:<port>/<url-path>",
      }
    ]
  },
  ```
* `id` - An integer ID to uniquely identify the server.
* `host` - The IP of the server.
* `queryPort` - The query port of the server.
* `rconPort` - The RCON port of the server.
* `rconPassword` - The RCON password of the server.
* `logReaderMode` - `tail` will read from a local log file, `ftp` will read from a remote log file using the FTP protocol, `sftp` will read from a remote log file using the SFTP protocol.
* `logDir` - The folder where your Squad logs are saved. Most likely will be `C:/servers/squad_server/SquadGame/Saved/Logs`.
* `ftp` - FTP configuration for reading logs remotely.
* `sftp` - SFTP configuration for reading logs remotely.
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
           <pre><code>Join a squad, you are unassigned and will be kicked</code></pre></li>
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
          <ul><li><h4>attackerMessage</h4>
           <h6>Description</h6>
           <p>The message to warn attacking players with.</p>
           <h6>Default</h6>
           <pre><code>Please apologise for ALL TKs in ALL chat!</code></pre></li>
<li><h4>victimMessage</h4>
           <h6>Description</h6>
           <p>The message that will be sent to the victim.</p>
           <h6>Default</h6>
           <pre><code>null</code></pre></li></ul>
        </details>

<details>
          <summary>CBLInfo</summary>
          <h2>CBLInfo</h2>
          <p>The <code>CBLInfo</code> plugin alerts admins when a harmful player is detected joining their server based on data from the <a href="https://communitybanlist.com/">Community Ban List</a>.</p>
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
           <p>Admins will be alerted when a player has this or more reputation points. For more information on reputation points, see the <a href="https://communitybanlist.com/faq">Community Ban List's FAQ</a></p>
           <h6>Default</h6>
           <pre><code>6</code></pre></li></ul>
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

Grafana:
<ul><li> <a href="https://grafana.com/">Grafana</a> is a cool way of viewing server statistics stored in the database.</li>
<li>Install Grafana.</li>
<li>Add your database as a datasource named <code>SquadJS</code>.</li>
<li>Import the <a href="https://github.com/Team-Silver-Sphere/SquadJS/blob/master/squad-server/templates/SquadJS-Dashboard-v2.json">SquadJS Dashboard</a> to get a preconfigured MySQL only Grafana dashboard.</li>
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
<li><h4>pingHere</h4>
           <h6>Description</h6>
           <p>Ping @here. Great if Admin Requests are posted to a Squad Admin ONLY channel, allows pinging only Online Admins.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li>
<li><h4>pingDelay</h4>
           <h6>Description</h6>
           <p>Cooldown for pings in milliseconds.</p>
           <h6>Default</h6>
           <pre><code>60000</code></pre></li>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li>
<li><h4>warnInGameAdmins</h4>
           <h6>Description</h6>
           <p>Should in-game admins be warned after a players uses the command and should we tell how much admins are active in-game right now.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li>
<li><h4>showInGameAdmins</h4>
           <h6>Description</h6>
           <p>Should players know how much in-game admins there are active/online?</p>
           <h6>Default</h6>
           <pre><code>true</code></pre></li></ul>
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
          <summary>DiscordFOBHABExplosionDamage</summary>
          <h2>DiscordFOBHABExplosionDamage</h2>
          <p>The <code>DiscordFOBHABExplosionDamage</code> plugin logs damage done to FOBs and HABs by explosions to help identify engineers blowing up friendly FOBs and HABs.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log FOB/HAB explosion damage to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embeds.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordKillFeed</summary>
          <h2>DiscordKillFeed</h2>
          <p>The <code>DiscordKillFeed</code> plugin logs all wounds and related information to a Discord channel for admins to review.</p>
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
<li><h4>disableCBL</h4>
           <h6>Description</h6>
           <p>Disable Community Ban List information.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
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
           <pre><code>!placeholder</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The bot will only answer with a placeholder on this channel</p>
           <h6>Default</h6>
           <pre><code></code></pre></li></ul>
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
          <summary>DiscordRoundEnded</summary>
          <h2>DiscordRoundEnded</h2>
          <p>The <code>DiscordRoundEnded</code> plugin will send the round winner to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log round end events to.</p>
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
          <p>The <code>DiscordServerStatus</code> plugin can be used to get the server status in Discord.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>messageStore (Required)</h4>
           <h6>Description</h6>
           <p>Sequelize connector name.</p>
           <h6>Default</h6>
           <pre><code>sqlite</code></pre></li>
<li><h4>command</h4>
           <h6>Description</h6>
           <p>Command name to get message.</p>
           <h6>Default</h6>
           <pre><code>!status</code></pre></li>
<li><h4>disableSubscriptions</h4>
           <h6>Description</h6>
           <p>Whether to allow messages to be subscribed to automatic updates.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li>
<li><h4>updateInterval</h4>
           <h6>Description</h6>
           <p>How frequently to update the time in Discord.</p>
           <h6>Default</h6>
           <pre><code>60000</code></pre></li>
<li><h4>setBotStatus</h4>
           <h6>Description</h6>
           <p>Whether to update the bot's status with server information.</p>
           <h6>Default</h6>
           <pre><code>true</code></pre></li></ul>
        </details>

<details>
          <summary>DiscordSquadCreated</summary>
          <h2>DiscordSquadCreated</h2>
          <p>The <code>SquadCreated</code> plugin will log Squad Creation events to a Discord channel.</p>
          <h3>Options</h3>
          <ul><li><h4>discordClient (Required)</h4>
           <h6>Description</h6>
           <p>Discord connector name.</p>
           <h6>Default</h6>
           <pre><code>discord</code></pre></li>
<li><h4>channelID (Required)</h4>
           <h6>Description</h6>
           <p>The ID of the channel to log Squad Creation events to.</p>
           <h6>Default</h6>
           <pre><code></code></pre></li><h6>Example</h6>
           <pre><code>667741905228136459</code></pre>
<li><h4>color</h4>
           <h6>Description</h6>
           <p>The color of the embed.</p>
           <h6>Default</h6>
           <pre><code>16761867</code></pre></li>
<li><h4>useEmbed</h4>
           <h6>Description</h6>
           <p>Send message as Embed</p>
           <h6>Default</h6>
           <pre><code>true</code></pre></li></ul>
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
<li><h4>disableCBL</h4>
           <h6>Description</h6>
           <p>Disable Community Ban List information.</p>
           <h6>Default</h6>
           <pre><code>false</code></pre></li></ul>
        </details>

<details>
          <summary>FogOfWar</summary>
          <h2>FogOfWar</h2>
          <p>The <code>FogOfWar</code> plugin can be used to automate setting fog of war mode.</p>
          <h3>Options</h3>
          <ul><li><h4>mode</h4>
           <h6>Description</h6>
           <p>Fog of war mode to set.</p>
           <h6>Default</h6>
           <pre><code>1</code></pre></li>
<li><h4>delay</h4>
           <h6>Description</h6>
           <p>Delay before setting fog of war mode.</p>
           <h6>Default</h6>
           <pre><code>10000</code></pre></li></ul>
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
           <pre><code>Live!</code></pre></li>
<li><h4>waitOnNewGames</h4>
           <h6>Description</h6>
           <p>Should the plugin wait to be executed on NEW_GAME event.</p>
           <h6>Default</h6>
           <pre><code>true</code></pre></li>
<li><h4>waitTimeOnNewGame</h4>
           <h6>Description</h6>
           <p>The time to wait before check player counts in seconds.</p>
           <h6>Default</h6>
           <pre><code>30</code></pre></li></ul>
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
    </code></pre>If you need more documentation about socket.io please go ahead and read the following;<br />General Socket.io documentation: <a href="https://socket.io/docs/v3" target="_blank">Socket.io Docs</a><br />Authentication and securing your websocket: <a href="https://socket.io/docs/v3/middlewares/#Sending-credentials" target="_blank">Sending-credentials</a><br />How to use, install and configure a socketIO-client: <a href="https://github.com/11TStudio/SocketIO-Examples-for-SquadJS" target="_blank">Usage Guide with Examples</a></p>
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
Some information SquadJS collects from Squad servers was never intended or designed to be collected. As a result, it is impossible for any framework to collect the same information with 100% accuracy. SquadJS aims to get as close as possible to that figure, however, it acknowledges that this is not possible in some specific scenarios.

Below is a list of scenarios we know may cause some information to be inaccurate:
* Use of Realtime Server and Player Information - We update server and player information periodically every 30 seconds (by default) or when we know that it requires an update. As a result, some information about the server or players may be up to 30 seconds out of date or greater if an error occurs whilst updating this information.
* SquadJS Restarts - If SquadJS is started during an active Squad game some information will be lost or not collected correctly:
    - The current state of players will be lost. For example, if a player was wounded prior to the bot starting and then is revived/gives up after the bot is started information regarding who originally wounded them will not be known.
    - The accurate collection of some server log events will not occur. SquadJS collects players' "suffix" name, i.e. their Steam name without the clan tag added via the game settings, when they join the server and uses this to identify them in certain logs that do not include their full name. As a result, for players connecting prior to SquadJS starting some log events associated with their actions will show the player as `null`.
* Duplicated Player Names - If two or more players have the same name or suffix name (see above) then SquadJS will be unable to identify them in the logs. When this occurs event logs will show the player as `null`. Be on the watch for groups of players who try to abuse this in order to TK or complete other malicious actions without being detected by SquadJS plugins.

## SquadJS API
SquadJS pings the following data to the [SquadJS API](https://github.com/Team-Silver-Sphere/SquadJS-API/) at regular intervals to assist with its development:
* Squad server IP, query port, name & player count (including queue size).
* SquadJS version.
* Log reader mode, i.e. `tail` or `ftp`.
* Plugin configuration.

At this time, this cannot be disabled.

Please note, plugin configurations do **not** and should **not** contain any sensitive information which allows us to collect this information. Any sensitive information, e.g. Discord login tokens, should be included in the `connectors` section of the config which is not sent to our API. It is important that developers of custom plugins maintain this approach to avoid submitting confidential information to our API.

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
