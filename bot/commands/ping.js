const OWNER_ID = '221415080514945035';

module.exports = {
  name: 'ping',
  description: 'Health check (owner only)',
  async execute(message) {
    if (message.author.id !== OWNER_ID) return;
    const latency = Date.now() - message.createdTimestamp;
    message.reply(`🟢 alive — bot latency ${latency}ms, API latency ${Math.round(message.client.ws.ping)}ms`);
  },
};
