import BasePlugin from './base-plugin.js';

import Sequelize from 'sequelize';
import Discord from 'discord.js'
import fs from 'fs';
const { DataTypes } = Sequelize;

export default class DiscordStats extends BasePlugin {
    static get description() {
        return (
            'Basic Discord bot to display player stats'
        );
    }

    static get defaultEnabled() {
        return false;
    }

    static get optionsSpecification() {
        return {
            discordClient: {
                required: true,
                description: 'Discord connector name.',
                connector: 'discord',
                default: 'discord'
            },
            database: {
                required: true,
                connector: 'sequelize',
                description: 'The Sequelize connector to log server information to.',
                default: 'mysql'
            },
            channelID: {
                required: true,
                description: 'ID of channel to turn into RCON console.',
                default: '',
                example: '667741905228136459'
            },
            prefix: {
                required: true,
                description: 'Prefix to be used for commands.',
                default: ""
            },
        };
    }

    constructor(server, options, connectors) {
        super(server, options, connectors);

        this.models = {};

        this.createModel('Server', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING
            }
        });

        this.createModel('Match', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            dlc: {
                type: DataTypes.STRING
            },
            mapClassname: {
                type: DataTypes.STRING
            },
            layerClassname: {
                type: DataTypes.STRING
            },
            map: {
                type: DataTypes.STRING
            },
            layer: {
                type: DataTypes.STRING
            },
            startTime: {
                type: DataTypes.DATE,
                notNull: true
            },
            endTime: {
                type: DataTypes.DATE
            },
            winner: {
                type: DataTypes.STRING
            }
        });

        this.createModel('TickRate', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            time: {
                type: DataTypes.DATE,
                notNull: true
            },
            tickRate: {
                type: DataTypes.FLOAT,
                notNull: true
            }
        });

        this.createModel('PlayerCount', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            time: {
                type: DataTypes.DATE,
                notNull: true,
                defaultValue: DataTypes.NOW
            },
            players: {
                type: DataTypes.INTEGER,
                notNull: true
            },
            publicQueue: {
                type: DataTypes.INTEGER,
                notNull: true
            },
            reserveQueue: {
                type: DataTypes.INTEGER,
                notNull: true
            }
        });

        this.createModel(
            'Players',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                eosID: {
                    type: DataTypes.STRING,
                    unique: true
                },
                steamID: {
                    type: DataTypes.STRING,
                    notNull: true,
                    unique: true
                },
                lastName: {
                    type: DataTypes.STRING
                },
                lastIP: {
                    type: DataTypes.STRING
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci',
                indexes: [
                    {
                        fields: ['eosID']
                    },
                    {
                        fields: ['steamID']
                    }
                ]
            }
        );

        this.createModel(
            'Wound',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.createModel(
            'Death',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                woundTime: {
                    type: DataTypes.DATE
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.createModel(
            'Revive',
            {
                id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                time: {
                    type: DataTypes.DATE,
                    notNull: true
                },
                woundTime: {
                    type: DataTypes.DATE
                },
                victimName: {
                    type: DataTypes.STRING
                },
                victimTeamID: {
                    type: DataTypes.INTEGER
                },
                victimSquadID: {
                    type: DataTypes.INTEGER
                },
                attackerName: {
                    type: DataTypes.STRING
                },
                attackerTeamID: {
                    type: DataTypes.INTEGER
                },
                attackerSquadID: {
                    type: DataTypes.INTEGER
                },
                damage: {
                    type: DataTypes.FLOAT
                },
                weapon: {
                    type: DataTypes.STRING
                },
                teamkill: {
                    type: DataTypes.BOOLEAN
                },
                reviverName: {
                    type: DataTypes.STRING
                },
                reviverTeamID: {
                    type: DataTypes.INTEGER
                },
                reviverSquadID: {
                    type: DataTypes.INTEGER
                }
            },
            {
                charset: 'utf8mb4',
                collate: 'utf8mb4_unicode_ci'
            }
        );

        this.onMessage = this.onMessage.bind(this);
        if (!fs.existsSync("./linkedAccounts.json")) {
            fs.writeFileSync("./linkedAccounts.json", JSON.stringify([]));
        }
        this.linkedAccounts = JSON.parse(fs.readFileSync("./linkedAccounts.json"));
    }

    createModel(name, schema) {
        this.models[name] = this.options.database.define(`DBLog_${name}`, schema, {
            timestamps: false
        });
    }

    async prepareToMount() {
        await this.models.Server.sync();
        await this.models.Match.sync();
        await this.models.TickRate.sync();
        await this.models.PlayerCount.sync();
        await this.models.Players.sync();
        await this.models.Wound.sync();
        await this.models.Death.sync();
        await this.models.Revive.sync();
    }

    async mount() {
        this.options.discordClient.on('message', this.onMessage);
    }

    async unmount() {
        this.options.discordClient.removeEventListener('message', this.onMessage);
    }

    async onMessage(message) {
        const prefix = this.options.prefix;
        if (!message.content.startsWith(prefix)) return;
        if (message.author.bot) return;
        const cmd = message.content.split(" ")[0].slice(prefix.length);
        if (message.channel.id != this.options.channelID) return;
        switch (cmd) {
            case "link":
                {
                    await message.delete();
                    const steamID = message.content.split(" ")[1];
                    if (!steamID) {
                        message.reply("Please provide a steamID");
                        break;
                    }
                    const user = await this.findUser(steamID);
                    if (!user) {
                        message.reply("No user found with that steamID");
                        break;
                    }
                    if (this.linkedAccounts.find((x) => x.steamID == steamID || message.author.id == x.discordID)) return message.reply("Account already linked");
                    this.linkedAccounts.push({
                        discordID: message.author.id,
                        steamID: steamID
                    });
                    fs.writeFileSync("./linkedAccounts.json", JSON.stringify(this.linkedAccounts));
                    message.reply("Account successfully linked");
                    break;
                }

            case "unlink":
                {
                    await message.delete();
                    if (!this.linkedAccounts.find(x => x.discordID === message.author.id)) {
                        message.reply("Please link your account first");
                        break;
                    }
                    this.linkedAccounts = this.linkedAccounts.filter(x => x.discordID !== message.author.id);

                    fs.writeFileSync("./linkedAccounts.json", JSON.stringify(this.linkedAccounts));
                    message.reply("Account successfully unlinked");
                    break;
                }

            case "stats":
                {
                    const steamID = this.linkedAccounts.find(x => x.discordID === message.author.id)?.steamID;
                    if (!steamID) {
                        message.reply("Please link your account first");
                        break;
                    }
                    const user = await this.findUser(steamID);
                    if (!user) {
                        message.reply("No account found with this steamID");
                        break;
                    }
                    const content = await this.getUserStats(user);
                    message.reply(content);
                    break;

                }

            case "leaderboard":
                {
                    await this.showLeaderboard(message); // Call the showLeaderboard method
                    break;
                }


            case "help":
                {
                await this.showHelp(message);
                break;
                }

            case "ostats":
                {
                    const targetSteamID = message.content.split(" ")[1];
                    if (!targetSteamID) {
                        message.reply("Please provide the SteamID of the user whose stats you want to see.");
                        break;
                    }

                    // Find the user in the database using the provided SteamID
                    const user = await this.findUser(targetSteamID);
                    if (!user) {
                        message.reply("No user found with the provided SteamID.");
                        break;
                    }

                    // Fetch stats for the user
                    const content = await this.getUserStats(user);

                    // Send the stats as a message
                    message.channel.send(content);
                    break;
                }

            case "kd":
                {
                    const topPlayers = await this.models.Players.findAll({
                        attributes: [
                            [Sequelize.literal('Players.lastName'), 'username'], // Include the username from Players table
                            'steamID',
                            [Sequelize.fn('COUNT', Sequelize.col('kills')), 'totalKills'],
                            [Sequelize.fn('COUNT', Sequelize.col('deaths')), 'totalDeaths']
                        ],
                        include: [
                            { model: this.models.Players, as: 'Players', attributes: [] } // Join with Players table
                        ],
                        group: ['steamID'],
                        order: [[Sequelize.literal('(totalKills / NULLIF(totalDeaths, 0))'), 'DESC']], // Avoid division by zero
                        limit: 3
                    });

                    const leaderboardEmbed = new Discord.MessageEmbed()
                        .setTitle("Top 3 KD Leaders")
                        .setDescription("Here are the top 3 players with the highest KD ratios:")
                        .setColor("#FF0000");

                    topPlayers.forEach((entry, index) => {
                        const totalKills = entry.dataValues.totalKills || 0;
                        const totalDeaths = entry.dataValues.totalDeaths || 1; // Avoid division by zero
                        const kdRatio = (totalKills / totalDeaths).toFixed(2);
                        leaderboardEmbed.addField(`#${index + 1}`, `Player: ${entry.username} (${entry.steamID})\nKD Ratio: ${kdRatio}`);
                    });

                    message.channel.send(leaderboardEmbed);
                    break;
                }



            default:
                break;
        }
    }

    // Help immbed
    async showHelp(message) {
        const helpEmbed = new Discord.MessageEmbed()
            .setTitle("Command List")
            .setDescription("Here are the available commands:")
            .setColor("#0099ff")
            .addFields(
                { name: "!link [STEAMID]", value: "Link your Steam account to the bot." },
                { name: "!unlink", value: "Unlink your Steam account from the bot." },
                { name: "!stats", value: "View your stats." },
                { name: "!leaderboard", value: "View the top 3 players with the most kills." },
                { name: "!ostats [STEAMID]", value: "Veiw another person stats." },
                { name: ";link [STEAMID]", value: "Link your steam account to the GE bot." },
                { name: ";stats", value: "View your stats of the GE server." },
                { name: "!leaderboard", value: "View the top 3 players with the most kills on the GE server." }
            );

        message.channel.send(helpEmbed);
    }

    // Leaderboard
    async showLeaderboard(message) {
        try {
            const topKills = await this.models.Players.findAll({
                attributes: ['steamID', [Sequelize.fn('COUNT', Sequelize.col('steamID')), 'killCount']],
                group: ['steamID'],
                order: [[Sequelize.literal('killCount'), 'DESC']],
                limit: 3
            });

            const leaderboardEmbed = new Discord.MessageEmbed()
                .setTitle("Top 3 Kill Leaders")
                .setDescription("Here are the top 3 players with the most kills:")
                .setColor("#FF0000");

            // Fetch usernames for each player from the database
            for (let i = 0; i < topKills.length; i++) {
                const player = topKills[i];
                const steamID = player.steamID;
                const username = await this.getUsername(steamID);
                leaderboardEmbed.addField(`#${i + 1}`, `Player: ${username}\nKills: ${player.dataValues.killCount}`);
            }

            message.channel.send(leaderboardEmbed);
        } catch (error) {
            console.error("Error fetching leaderboard:", error);
            message.channel.send("An error occurred while fetching the leaderboard.");
        }
    }

    // KD leaderboard
    async showLeaderboardkd(message) {
        try {
            const topPlayers = await this.models.dblog_players.findAll({
                attributes: [
                    'steamID',
                    [Sequelize.fn('COUNT', Sequelize.col('kills')), 'totalKills'],
                    [Sequelize.fn('COUNT', Sequelize.col('deaths')), 'totalDeaths']
                ],
                include: [{
                    model: this.models.Match,
                    attributes: []
                }],
                group: ['steamID'],
                order: [[Sequelize.literal('totalKills / NULLIF(totalDeaths, 0)'), 'DESC']], // Avoid division by zero
                limit: 3
            });

            const leaderboardEmbed = new Discord.MessageEmbed()
                .setTitle("Top 3 KD Leaders")
                .setDescription("Here are the top 3 players with the highest KD ratios:")
                .setColor("#FF0000");

            // Fetch usernames for each player from the database
            for (let i = 0; i < topPlayers.length; i++) {
                const player = topPlayers[i];
                const steamID = player.steamID;
                const username = await this.getUsername(steamID);
                const totalKills = player.dataValues.totalKills || 0;
                const totalDeaths = player.dataValues.totalDeaths || 1; // Avoid division by zero
                const kdRatio = (totalKills / totalDeaths).toFixed(2);
                leaderboardEmbed.addField(`#${i + 1}`, `Player: ${username}\nKD Ratio: ${kdRatio}`);
            }

            message.channel.send(leaderboardEmbed);
        } catch (error) {
            console.error("Error fetching KD leaderboard:", error);
            message.channel.send("An error occurred while fetching the KD leaderboard.");
        }
    }



    async getUsername(steamID) {
        try {
            const user = await this.models.Players.findOne({
                where: {
                    steamID: steamID
                }
            });
            return user ? user.lastName : "Unknown"; // Return username or "Unknown" if not found
        } catch (error) {
            console.error("Error fetching username:", error);
            return "Unknown";
        }
    }


    async findUser(steamID) {
        return await this.models.Players.findOne({
            where: {
                steamID: steamID   
            }
        });
    }

    async getUserStats(user) {
        const kills = await this.models.Death.count({
            where: {
                attacker: user.steamID
            }
        });

        const deaths = await this.models.Death.count({
            where: {
                victim: user.steamID
            }
        });

        const revives = await this.models.Revive.count({
            where: {
                reviver: user.steamID
            }
        });

        const revived = await this.models.Revive.count({
            where: {
                victim: user.steamID
            }
        });

        const hits = await this.models.Wound.count({
            where: {
                attacker: user.steamID
            }
        });

        const wounded = await this.models.Wound.count({
            where: {
                victim: user.steamID
            }
        });

        const tks = await this.models.Death.count({
            where: {
                attacker: user.steamID,
                teamkill: 1
            }
        });

        const matcheCount = await this.models.Death.findOne({
            where: {
                attacker: user.steamID
            },
            group: ['match'],
            attributes: ['match', [Sequelize.fn('COUNT', Sequelize.col('match')), 'count']],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });


        const mostKilledPlayer = await this.models.Death.findOne({
            where: {
                attacker: user.steamID,
                victim: {
                    [Sequelize.Op.ne]: user.steamID
                }
            },
            attributes: ['victim', [Sequelize.fn('COUNT', Sequelize.col('victim')), 'count'], 'victimName'],
            group: ['victim', 'victimName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const mostDiedPlayer = await this.models.Death.findOne({
            where: {
                victim: user.steamID,
                attacker: {
                    [Sequelize.Op.ne]: user.steamID
                }
            },

            attributes: ['attacker', [Sequelize.fn('COUNT', Sequelize.col('attacker')), 'count'], 'attackerName'],
            group: ['attacker', 'attackerName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const mostRevivedPlayer = await this.models.Revive.findOne({
            where: {
                reviver: user.steamID
            },
            attributes: ['victim', [Sequelize.fn('COUNT', Sequelize.col('victim')), 'count'], 'victimName'],
            group: ['victim', 'victimName'],
            order: [[Sequelize.literal('count'), 'DESC']],
            limit: 1
        });

        const kdr = deaths === 0 ? kills : kills / deaths;
        const rpd = revives === 0 ? 0 : revives / deaths;
        const hpr = hits === 0 ? 0 : hits / revives;

        const content = new Discord.MessageEmbed()
            .setTitle(`${user.lastName} - ${user.steamID} STATS`)
            .setURL(`https://steamcommunity.com/profiles/${user.steamID}`)
            .setThumbnail(`https://cdn.discordapp.com/attachments/1212650237173309511/1212650591583477820/GOL...jpg?ex=65f29bde&is=65e026de&hm=36a67da42ee2cd95122aff6fbb4dd47e8f691d4d829454ab866a1fec584288b4&`)
            .addFields(
                { name: 'Kills', value: kills, inline: true },
                { name: 'Deaths', value: deaths, inline: true },
                { name: 'KD', value: kdr.toFixed(2), inline: true },
                { name: 'Revive', value: revives, inline: true },
                { name: 'Revived', value: revived, inline: true },
                { name: 'Wound', value: hits, inline: true },
                { name: 'Wounded', value: wounded, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: 'Played Match', value: matcheCount ? matcheCount.dataValues.count : 0, inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: "\u200B", value: "\u200B", inline: true },
                { name: 'Most Killed', value: mostKilledPlayer ? `${mostKilledPlayer.victimName} (${mostKilledPlayer.dataValues.count})` : "N/A", inline: true },
                { name: 'Most Died', value: mostDiedPlayer ? `${mostDiedPlayer.attackerName} (${mostDiedPlayer.dataValues.count})` : "N/A", inline: true },
                { name: 'Most Revived', value: mostRevivedPlayer ? `${mostRevivedPlayer.victimName} (${mostRevivedPlayer.dataValues.count})` : "N/A", inline: true },
            )
            .setTimestamp()
            .setFooter('Made By Joseph_fallen');
        return content;
    }

}
