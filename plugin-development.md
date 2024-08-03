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
SquadJS plugins unlock the framework's full potential by giving you access to its extensive data. These powerful tools can automate a wide range of tasks, from warmly welcoming new players to meticulously collecting player statistics. A thriving community of developers creates and shares a wealth of open-source plugins. In this guide, we will show you how to join the fun and build your own plugin.

## **Pre-Requisites**
This guide assumes you have some basic skills in Git and Node.js programming.

## **Getting Started**
Follow the steps below to get started.

1. Create a new folder in the `./plugins` folder.
   * We will use this folder to store your plugin's resources.
   * We recommend that use Git (and GitHub) to manage versions of your plugin. This will also allow you to back you work up and/or share it with others.

2. Copy the contents of the `./plugins/squadjs-command` folder into your new folder.
   * We will use this plugin as a template.
   * Do not forget to rename things and update the documentation appropriately.

3. Implement your plugin by modifying the `index.ts` file.
   * Plugins are structured as classes. As documented below, you can implement various methods to trigger your plugin's logic at relevant times.
   * Your plugin will be automatically imported from this file by SquadJS. Do not rename the file and keep your plugin as its default export.
   * Feel free to create additional `.js`/`.ts` files if you wish to organise your plugin's code across multiple files.

4. To install dependencies, run `npm install ...` or `yarn add ...` in your new folder.

## **Plugin Constructor**
Some SquadJS plugins may have some preliminary logic that must be executed before the plugin is enabled. For instance, the plugin may need to initialise a dependency. Plugins can complete this logic through the constructor.

```ts
import SquadServer from '../../squad-server';
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class ConstructorPlugin extends Plugin {
   public constructor(server: SquadServer) {
      super(server);
      
      // Do preliminary logic.
   }
}
```

## **`mount()` Method**
Some SquadJS plugins may have some preliminary logic that must be executed asynchronously before the plugin is enabled. For instance, the plugin may need to connect to a database. Plugins can complete this logic through the `mount()` method.

```ts
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class MountPlugin extends Plugin {
  async mount(): Promise<void> {
     // Do something.
  }
}
```

## **Event-Driven Plugins**
Most SquadJS plugins are event-driven, responding to specific actions within the game. For example, the SquadJS Command Plugin listens for chat messages containing the `!squadjs` command and responds with a warning message. 

Plugins can react to various events by implementing corresponding methods. To handle chat messages, you would use the `onChatMessage` method. A comprehensive list of other available methods is provided [here](./src/plugin-system/plugin-interface.ts). Event data, such as the content of a chat message, is passed to the method as an object containing multiple properties. The exact structure of this event data will be documented soon.

```ts
import { SQUADJS_VERSION } from '../../squad-server/utils/constants.js';
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class ChatEventPlugin extends Plugin {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async onChatMessage(data: any): Promise<void> {
    // Respond to the event.
  }
}
```

## **Time-Triggered Plugins**
Some SquadJS plugins are time-triggered. For example, the SquadJS API Plugin sends analytics data to the SquadJS API every few minutes. Plugins can operate both event-driven and time-triggered. Additionally, event-driven plugins can initiate time-based actions, such as executing a task a set time after an event occurs.

Plugins can trigger their own methods at regular intervals using the `setInterval` as seen below.

```ts
import SquadServer from '../../squad-server';
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class IntervalCommand extends Plugin {
  private instance: ReturnType<typeof setInterval>;
  private readonly interval: number = 5 * 60 * 1000;

  public constructor(server: SquadServer) {
    super(server);

    // Bind the ping method so this is accessible.
    this.ping = this.ping.bind(this);
  }

  // Start the intervals when the plugin is mounted to the SquadServer.
  async mount(): Promise<void> {
    this.instance = setInterval(this.ping, this.interval);
  }

  async ping(): Promise<void> {
    // Do something.
  }
}
```

Plugins can also trigger their own methods at after a delay using the `setTimeout` function as seen below.

```ts
import SquadServer from '../../squad-server';
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class TimeoutCommand extends Plugin {
  private instance: ReturnType<typeof setInterval>;
  private readonly delay: number = 5 * 60 * 1000;

  public constructor(server: SquadServer) {
    super(server);

    // Bind the ping method so this is accessible.
    this.ping = this.ping.bind(this);
  }

   // Start the timeout when the plugin is mounted to the SquadServer.
  async mount(): Promise<void> {
    this.instance = setTimeout(this.ping, this.delay);
  }

  async ping(): Promise<void> {
    // Do something.
  }
}
```

## **Communication with the Squad Server**
Plugins have access to the Squad server through the `server` property. This allows them to access data, e.g. a list of players, and complete actions, e.g. kick players. A list of data and actions available will be documented soon.

```ts
import { Plugin } from '../../src/plugin-system';

// Define the plugin.
export default class PlayerCountCommandPlugin extends Plugin {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   async onChatMessage(data: any): Promise<void> {
      // Check whether the message contained the playercount command.
      const command = data.message.match(/!playercount/);

      // Handle uses of the command.
      if (command) {
         // Send the response to the command.
         await this.server.rcon.warn(
                 data.player.eosID,
                 `There are ${this.server.players.length} players online.`
         );
      }
   }
}
```

## **Struggling?**
Struggling to write your own plugin? Or simply want to engage with thriving community of plugin developers? Check out [our Discord](https://discord.gg/9F2Ng5C)!