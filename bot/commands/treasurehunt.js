const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'treasurehunt',
  aliases: ['th'],
  description: 'Treasure Hunt help and commands',
  async execute(message, args) {
    const embed = new EmbedBuilder()
      .setTitle('🗺️ Treasure Hunt Commands')
      .setColor('#7D5FFF')
      .setDescription(
        'Compete with your team to complete OSRS objectives and earn the highest GP pot!'
      )
      .addFields(
        {
          name: '📊 View Commands',
          value:
            '`!nodes` - View your available nodes\n' +
            '`!team` - View your team status\n' +
            '`!buffs` - View your available buffs\n' +
            '`!inns` - View completed Inns and their trades\n' +
            '`!leaderboard` - View event leaderboard',
          inline: false,
        },
        {
          name: '⚔️ Action Commands',
          value:
            '`!submit <node_id> <proof_url or file upload>` - Submit node completion\n' +
            '`!applybuff <node_id> [buff_id]` - Apply buff to node\n' +
            '`!trade <inn_node_id> <reward_id>` - Trade keys at an Inn for GP',
          inline: false,
        },
        {
          name: '🔗 Web Interface',
          value: 'Visit the web dashboard for detailed maps and admin controls',
          inline: false,
        }
      );

    return message.reply({ embeds: [embed] });
  },
};
