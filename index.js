const { Client, Intents } = require("discord.js");
const { readdirSync } = require("fs");
const config = require("./confi.json");
const { Manager } = require("erela.js");

const client = new Client({
    shards: "auto",
    allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: false
    },
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_VOICE_STATES, //these are the intents for the gateway [IMPORTANT]
        Intents.FLAGS.GUILD_INTEGRATIONS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_WEBHOOKS
    ]
});

client.on("disconnect", () => console.log("Bot is disconnecting..."))
client.on("reconnecting", () => console.log("Bot reconnecting..."))
client.on('errn', error => console.log(error));
client.on('error', error => console.log(error));
process.on('unhandledRejection', error => console.log(error));
process.on('uncaughtException', error => console.log(error))
process.on('uncaughtExceptionMonitor', (err, origin) => console.log(err, origin));
process.on('multipleResolves', (type, promise, reason) => console.log(type, promise, reason));
client.manager = new Manager({
    nodes: config.nodes,
    autoPlay: true,
    send: (id, payload) => {
      const guild = client.guilds.cache.get(id);
      if (guild) guild.shard.send(payload);
    }
  })
    .on("nodeConnect", node => console.log(`Node "${node.options.identifier}" connected.`))
    .on("nodeError", (node, error) => console.log(
      `Node "${node.options.identifier}" encountered an error: ${error.message}.`
    ))
    .on("trackStart", (player, track) => {
      const channel = client.channels.cache.get(player.textChannel);
      channel.send(`Now playing: \`${track.title}\`, requested by \`${track.requester.tag}\`.`);
    })
    .on("queueEnd", player => {
      const channel = client.channels.cache.get(player.textChannel);
      channel.send("Queue has ended.");
      player.destroy();
    });
    client.on("raw", d => client.manager.updateVoiceState(d));

readdirSync("./events/").forEach(file => {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    console.log(`Loading Events Client ${eventName}`);
    client.on(eventName, event.bind(null, client));
});


client.login(config.token);