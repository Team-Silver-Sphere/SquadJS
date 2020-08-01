<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord RCON
</div>

## About
The Discord RCON plugin allows you to run RCON commands through a Discord channel.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordRCON } from 'plugins';

// Place the following two lines in your index.js file before using a Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordRCON(
  server,
  discordClient,
  'discordChannelID'
); 
```
