<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Chat Plugin
</div>

## About
The Discord Chat plugin streams in-game chat to a Discord channel. It is useful to allow those out of game to monitor in-game chat as well as to log to permanent form. It can be configured to limit access to specific chats.

## Installation
```js
// Place the following two lines at the top of your index.js file.
import Discord from 'discord.js';
import { discordChat } from 'plugins';

// Place the following two lines in your index.js file before using an Discord plugins.
const discordClient = new Discord.Client();
await discordClient.login('Discord Login Token'); // insert your Discord bot's login token here.

// Place the following lines after all of the above.
await discordChat(
  server,
  discordClient,
  'discordChannelID', 
  { // options - the options included below display the defaults and can be removed for simplicity.
    ignoreChats: ['ChatSquad', 'ChatAdmin'], // an array of chats to not display.
    color: 16761867, // color of embed
    chatColors: { 'ChatAll': 16761867 } // change the color of chat types individually. Defaults to color above if not specified.
  }
); 
```
