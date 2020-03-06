<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Teamkill
</div>

## About
The Discord Teamkill plugin logs teamkill information to a Discord channel.

## Requirements
 * Discord bot setup & login token placed in `core/config.js` file.

## Installation
Place the following into your `index.js` file. The options below are optional and can be removed without affecting functionality, however, the default values are shown below for reference.
```js
await discordTeamkill(
  server, 
  'discordChannelID', 
  { // options
    color: 16761867 // color of embed
  }
);
```
