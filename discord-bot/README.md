# Discord Bot Guides

## Setting up a bot application

> This guide will help you fill out the `"discord": {...}` section in our `config.json` file.

1. Setting up a bot application, you can follow the offical DiscordJS guide: [https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot). After, click **Reset Token** & copy the whole text string, this will fill out our `"token": "Discord Login Token"` section in our `config.json` file.
2. In the [Discord developer portal](https://discord.com/developers/applications) select your Bot then under **General Information**, click the **Copy** button from the **APPLICATION ID** section. This will fill out our `"clientID": "Discord Application ID"` section in our `config.json` file.
3. (OPTIONAL) In the Discord client under **USER SETTINGS** > **Advanced**, enable **Developer Mode**.
   1. Navigate to your desired Discord server, right-click then select **Copy Server ID**. This will fill out our `"guidID": "Discord Server ID"` section in our `config.json` file.

**Result:**

```json
{
  "connectors": {
    "discord": {
      "clientID": "Paste Application ID from 2.",
      "guidID": "Paste Server ID from 3.",
      "intents": ["Guilds", "GuildMessages", "MessageContent"],
      "token": "Paste Token from 1."
    }
  }
}
```

## Required Gateway Intents

> Please leave `"intents": [...]` as is unless you know what you are doing!

You can find more information about **Gateway Intents** from the offical DiscordJS guide: [https://discordjs.guide/popular-topics/intents.html#privileged-intents]

**Enabling Gateway Intents for your Discord Bot:**

1. In the [Discord developer portal](https://discord.com/developers/applications), select your Bot then under **Bot** > **Privileged Gateway Intents**, enable the following:
   1. **Message Content Intent** - For general functionality
   2. **Server Members Intent** - For functionality in your desired Discord server

## Generating a Invite link for your Discord Bot

- You can find **Permissions Integer** from the **Bot Permissions** section. (Administrator permission is 8)
  - Bot Page: `https://discord.com/developers/applications/<Your Discord Bots clientID>/bot`
  - Example: `https://discord.com/developers/applications/1234567890/bot`
- Invite URL: `https://discord.com/api/oauth2/authorize?client_id=<Your Discord Bots clientID>&permissions=<Permissions Integer>&scope=applications.commands%20bot`
  - Example: `https://discord.com/api/oauth2/authorize?client_id=1234567890&permissions=8&scope=applications.commands%20bot`

## Creating Slash Commands

> You can follow the offical DiscordJS guide: [https://discordjs.guide/slash-commands/response-methods.html](https://discordjs.guide/slash-commands/response-methods.html)

To create your own Slash Commands you need basic knowledge of JavaScript.

**Basic Layout:**

- `interaction` = CommandInteraction
- `server` = Squad server

```js
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder().setName('name').setDescription('description'),
  async execute(interaction, server) {}
};
```

**Basic Example:**

- File: `SquadJS/discord-bot/global-commands/getplayer.js`

```js
import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('getplayer')
    .setDescription('Get in-game Player using Steam ID')
    .addStringOption((option) => option.setName('steamid').setDescription('Steam 64 ID')),
  async execute(interaction, server) {
    // If our Discord bot is connected to the Squad server
    if (server === null) {
      // Response to the executor & hide response message from everyone but the executor of the slash command
      await interaction.reply({
        content: 'Squad server not connected',
        ephemeral: true
      });
      return;
    }
    const cmd = interaction.options.getString('steamid') ?? 'No Steam ID provided';
    if (cmd === 'No Steam ID provided') {
      // Response to the executor & hide response message from everyone but the executor of the slash command
      await interaction.reply({
        content: cmd,
        ephemeral: true
      });
      return;
    }
    const steamID = await server.getPlayerBySteamID(cmd);
    await interaction.reply({
      content: JSON.stringify(steamID, null, ' '),
      ephemeral: false
    });
  }
};
```

## Creating Events

> You can follow the offical DiscordJS guide: [https://discordjs.guide/creating-your-bot/event-handling.html#individual-event-files](https://discordjs.guide/creating-your-bot/event-handling.html#individual-event-files)

To create your own Event you need basic knowledge of JavaScript.

**Basic Layout:**

- `server` = Squad server
- `event` = DiscordJS Event

```js
import { Events } from 'discord.js';

export default {
  // Execute everytime
  on: true,
  // Only execute once
  // once: false,
  // Pass the Squad server Object to the event
  server: true,
  // Type of Event
  event: Events,
  // Function
  async execute(server, event) {}
};
```

**Basic Example:**

- File: `SquadJS/discord-bot/events/ready.js`

```js
import { Events } from 'discord.js';

export default {
  // Only execute once
  once: true,
  // Does not pass the Squad server Object to the event
  server: false,
  // On client ready
  event: Events.ClientReady,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
  }
};
```
