<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Seeding Message
</div>

## About
Displays a seeding message when player count is below a certain level and displays a live message when player count is slightly above that level. 

## Installation
Place the following into your `index.js` file. The options below are optional and can be removed without affecting functionality, however, the default options are shown for reference.
```js
seedingMessage(
  server,
  { // options - remove or edit the below options. The defaults are shown.
    mode: 'interval', // interval displays every x seconds, onjoin displays x seconds after a player joins the server
    interval: 150 * 1000, // how often the seeding message is displayed in milliseconds in interval mode
    delay: 45 * 1000, // delay between player connecting and seeding message in onjoin mode
    seedingThreshold: 50, // seeding messages are displayed when player count is below this number
    seedingMessage: 'Seeding Rules Active! Fight only over the middle flags! No FOB Hunting!', // message to display in seeding mode
    liveEnabled: true, // display live message
    liveThreshold: 2, // live message will display when player count exceeds seedingThreshold by up to this amount
    liveMessage: 'Live!' // message to display when server is live
  }
);
```
