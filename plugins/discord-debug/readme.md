<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Discord Debug
</div>

## About
The Discord Debug plugin logs all server events in a raw format for monitoring/debugging/testing purposes.

## Requirements
 * Discord bot setup & login token placed in `core/config.js` file.

## Installation
Place the following into your `index.js` file.
```js
await discordChat(
  server, 
  'discordChannelID', 
  [EVENTS] // an array of events to log
); 
```
