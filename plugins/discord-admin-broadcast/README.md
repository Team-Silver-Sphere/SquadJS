<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Admin Broadcast Plugin
</div>

## About
The Discord Admin Broadcast plugin streams admin broadcasts logs to Discord. 

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordAdminBroadcast } from 'plugins';

// Place the following two lines in your index.js file before using an Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordAdminBroadcast(
  server,
  discordClient,
  'discordChannelID', 
  { // options - the options included below display the defaults and can be removed for simplicity.
    color: 16761867 // color of embed
  }
); 
```
