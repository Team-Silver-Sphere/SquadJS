<div align="center">

<img src="../../assets/squadjs-logo.png" alt="Logo" width="500"/>

#### SquadJS - Auto Teamkill Warning
</div>

## About
Automatically sends a warning to players who teamkill to remind them to apologise in all chat.

## Installation
```js
// Place the following line at the top of your index.js file.
import { autoTKWarn } from 'plugins';

// Place the following lines after all of the above.
await discordAdminCamLogs(
  server,
  { // options - the options included below display the defaults and can be removed for simplicity.
    message: 'Please apologise for ALL TKs in ALL chat!' // warning to send
  }
); 
```