"use strict";
const { Client, GatewayIntentBits } = require("discord.js");

const { DISCORD_CHANNEL_ID, DISCORD_TOKEN } = process.env;

const discordToken = process.env.DISCORD_TOKEN;

class LoggerService {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    //add channelId
    this.channelId = DISCORD_CHANNEL_ID;
    this.client.on("ready", () => {
      console.log(`Logged in as ${this.client.user.tag}!`);
    });
    this.client.login(discordToken);
  }

  sendToFormatCode(logData) {
    const {
      code,
      message = "This is some additional information about the code.",
      title = "Code Example",
    } = logData;

    const codeMessage = {
      content: message,
      embeds: [
        {
          color: parseInt("00ff00", 16),
          title,
          description: "```json\n" + JSON.stringify(code, null, 2) + "\n```",
        },
      ],
    };

    this.sendToMessage(codeMessage);
  }

  sendToMessage(message = "message") {
    const channel = this.client.channels.cache.get(this.channelId);
    if (!channel) {
      console.error(`Couldn't find the channel....`, this.channelId);
      return;
    }
    channel.send(message).catch((e) => console.log(console.error(e)));
  }
}

// const loggerService = new LoggerService();

module.exports = new LoggerService(); //loggerService;
