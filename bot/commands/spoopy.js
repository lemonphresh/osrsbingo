'use strict';

// Spoopy Halloween — Discord bot commands. Mirrors the battleship pattern
// (direct DB access via Sequelize models + explicit pubsub publish), so a
// team member can submit trick-or-treat proof from their Discord channel
// without touching the site.

const getModels = () => require('../../server/db/models');

// `Op` isn't available as its own module inside bot/node_modules — the bot
// only transitively pulls sequelize via the server models. Re-export it
// off the models bundle so we don't need to add a duplicate dep.
const Op = () => getModels().Sequelize.Op;

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

// Find the team whose Discord channel matches this message, provided the
// message author is on the roster and the team's event is ACTIVE. Returns
// `{ event, team }` or `null` if any check fails.
async function resolveContext(message) {
  const { SpoopyTeam, SpoopyEvent } = getModels();
  const teams = await SpoopyTeam.findAll({ where: { discordChannelId: message.channelId } });
  for (const team of teams) {
    const event = await SpoopyEvent.findByPk(team.eventId);
    if (!event || event.status !== 'ACTIVE') continue;
    if (!(team.members ?? []).includes(message.author.id)) continue;
    return { event, team };
  }
  return null;
}

// Team tiles the caller can submit against right now. Both UNLOCKED and
// SUBMITTED count — teams can stack multiple submissions on the same tile
// while a ref reviews (some may get denied, others re-submitted). LOCKED
// are gated, COMPLETE are done.
async function findEligibleTiles(teamId, eventId) {
  const { SpoopyTeamTile } = getModels();
  return SpoopyTeamTile.findAll({
    where: { teamId, eventId, status: { [Op().in]: ['unlocked', 'submitted'] } },
  });
}

// Pull the caller's tile from an explicit tile-id arg (accepts either the
// full `t-r19-c8` id or aliases like `start` / `castle`), or falls back to
// the sole eligible tile when only one is open.
async function pickTargetTile({ eligible, event, argRaw }) {
  const arg = (argRaw || '').trim().toLowerCase();
  if (!arg) {
    if (eligible.length === 1) return { tile: eligible[0] };
    if (eligible.length === 0) {
      return { error: '❌ No tiles are open for submission right now.' };
    }
    const ids = eligible.map((t) => `\`${t.tileId}\``).join(', ');
    return {
      error: `❌ More than one tile is open — please specify which one:\n${ids}\n` +
        'Usage: `!spoopysubmit <tile-id>`',
    };
  }

  // Aliases resolved against the event's board:
  //   `start` / `startup` → the start tile
  //   `castle` / `end` / `candybag` → the candybag tile
  //   otherwise treat as a tile id
  let targetTileId = arg;
  if (arg === 'start' || arg === 'startup') {
    targetTileId = event.startingTileIds?.[0] ?? null;
  } else if (arg === 'castle' || arg === 'end' || arg === 'candybag') {
    targetTileId = event.board?.candybagTileId ?? null;
  }
  if (!targetTileId) return { error: `❌ Unknown target: \`${arg}\`.` };

  const match = eligible.find((t) => t.tileId === targetTileId);
  if (!match) {
    return { error: `❌ Tile \`${targetTileId}\` isn't open for submission right now.` };
  }
  return { tile: match };
}

// Create the submission row + transition the tile status via a raw update
// (FINAL → 'submitted'; PRE stays 'unlocked'). Publishes pubsub events so
// the refs page updates live. Returns the submission model.
async function createSubmissionRecord({ event, team, tile, type, screenshot, message }) {
  const { SpoopySubmission, SpoopyTeamTile } = getModels();

  // Houses require a locked-in choice before a FINAL submission; otherwise
  // approval couldn't compute the reward. PRE screenshots are OK any time.
  const boardTile = event.board?.tiles?.find((t) => t.id === tile.tileId);
  if (type === 'FINAL' && boardTile?.tile_type === 'house' && !tile.choice) {
    const err = new Error('house tile needs a trick/treat choice before submitting');
    err.userFacing = `❌ Pick trick or treat on **${tile.tileId}** first — that step's still on the site UI.`;
    throw err;
  }

  const submissionId = generateId('sps');
  const submission = await SpoopySubmission.create({
    submissionId,
    teamId: team.teamId,
    eventId: event.eventId,
    tileId: tile.tileId,
    type,
    screenshotUrl: screenshot,
    discordMessageId: message.id,
    channelId: message.channelId,
    status: 'PENDING',
    submittedAt: new Date(),
    discordUsername: message.author.globalName ?? message.author.username,
    discordUserId: message.author.id,
  });

  if (type === 'FINAL') {
    await SpoopyTeamTile.update(
      { status: 'submitted', submissionId },
      { where: { teamId: team.teamId, tileId: tile.tileId } },
    );
  }

  try {
    const { pubsub } = require('../../server/schema/pubsub');
    await pubsub.publish(`SPOOPY_SUBMISSION_ADDED_${event.eventId}`, {
      spoopySubmissionAdded: submission,
    });
    const { loadTeamState } = require('../../server/utils/spoopy/spoopyPersistence');
    const state = await loadTeamState(team.teamId);
    await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${team.teamId}`, {
      spoopyTeamBoardUpdated: state,
    });
  } catch (err) {
    console.error('[spoopy bot] pubsub publish failed:', err.message);
  }

  return submission;
}

// ── Haunted-house step-inside gauntlet ────────────────────────────────
//
// Teams have to send three discord commands in strict order to unlock the
// candybag submission. Anything else — wrong order, or any unrelated
// spoopy command — knocks the counter back to 0.
//
//   0 → !stepinside     → 1
//   1 → !imserious      → 2
//   2 → !nogoingback    → 3   (submission now allowed)
//   3 → !spoopysubmit <candybag> succeeds and resets back to 0.
//
// Level 3 is a stable "ready to submit" state — normal commands do NOT
// reset it (a team can still !spoopysubmit for the candybag, or !spoopypre
// as their proof baseline). Only midway states (1 and 2) are fragile.

const GAUNTLET_STAGES = [
  {
    level: 1,
    command: 'stepinside',
    advanceMsg: (team) =>
      `🚪 **${team.teamName}** cracked the door of the spooky house. the hinges groan. ` +
      "you feel the temperature drop 10 degrees. if you're serious, say `!imserious` next.",
  },
  {
    level: 2,
    command: 'imserious',
    advanceMsg: (team) =>
      `🕯️ **${team.teamName}** — a candle flickers on unbidden. you can hear ` +
      'whispering somewhere behind the walls. one more step. type `!nogoingback` to commit.',
  },
  {
    level: 3,
    command: 'nogoingback',
    advanceMsg: (team) =>
      `💀 **${team.teamName}** — the door slams shut behind you. no going back now. ` +
      'submit the spooky-house proof with `!spoopysubmit castle` (attach a screenshot).',
  },
];

async function setGauntletLevel(team, level) {
  if (team.hauntedGauntletLevel === level) return team;
  await team.update({ hauntedGauntletLevel: level });
  try {
    const { pubsub } = require('../../server/schema/pubsub');
    const { loadTeamState } = require('../../server/utils/spoopy/spoopyPersistence');
    const state = await loadTeamState(team.teamId);
    await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${team.teamId}`, {
      spoopyTeamBoardUpdated: state,
    });
  } catch (err) {
    console.error('[spoopy bot] gauntlet publish failed:', err.message);
  }
  return team;
}

// Called at the start of every non-gauntlet spoopy command. If the team was
// mid-gauntlet (level 1 or 2), the sequence is broken and we reset to 0. The
// caller decides whether to warn the channel; we return a flag so they can.
async function resetGauntletIfMidway(team) {
  if (team.hauntedGauntletLevel === 1 || team.hauntedGauntletLevel === 2) {
    await setGauntletLevel(team, 0);
    return true;
  }
  return false;
}

function makeGauntletCommand(stage) {
  const requiredPriorLevel = stage.level - 1;
  return {
    name: stage.command,
    description: 'Spooky-house commitment gauntlet step.',
    async execute(message) {
      const ctx = await resolveContext(message);
      if (!ctx) {
        return message.reply(
          '❌ No active Spoopy event for this channel — join a team first before you go poking at spooky doors.',
        );
      }
      const { team, event } = ctx;

      // Candybag has to be unlocked (any house completed) before the gauntlet
      // can even start. If not, refuse without touching the counter.
      const candybagId = event.board?.candybagTileId;
      const { SpoopyTeamTile } = getModels();
      const candybagRow = candybagId
        ? await SpoopyTeamTile.findOne({ where: { teamId: team.teamId, tileId: candybagId } })
        : null;
      if (!candybagRow || candybagRow.status === 'locked') {
        return message.reply(
          '🚪 the door to the spooky house is barred shut. finish at least one trick-or-treat first.',
        );
      }
      if (candybagRow.status === 'complete') {
        return message.reply('🍬 you already visited the spooky house.');
      }

      if (team.hauntedGauntletLevel !== requiredPriorLevel) {
        // Wrong order — reset and warn.
        await setGauntletLevel(team, 0);
        return message.reply(
          "👻 you spoke out of turn. the spooky-house door creaks shut. start over with `!stepinside`.",
        );
      }

      await setGauntletLevel(team, stage.level);
      return message.reply(stage.advanceMsg(team));
    },
  };
}

// ── Commands ─────────────────────────────────────────────────────────────

module.exports = {
  name: 'spoopysubmit',
  aliases: ['sps'],
  description: 'Submit a Spoopy task (attach a screenshot).',

  async execute(message, args = []) {
    const screenshot = message.attachments.first()?.url ?? null;
    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message. Usage: `!spoopysubmit [tile]` with a screenshot attached.',
      );
    }

    const ctx = await resolveContext(message);
    if (!ctx) {
      return message.reply(
        "❌ No active Spoopy event for this channel — make sure your team's Discord channel is registered and you're on the roster.",
      );
    }
    const { event, team } = ctx;

    const eligible = await findEligibleTiles(team.teamId, event.eventId);
    const { tile, error } = await pickTargetTile({ eligible, event, argRaw: args[0] });
    if (error) {
      const brokeGauntlet = await resetGauntletIfMidway(team);
      const gauntletNote = brokeGauntlet
        ? '\n👻 you were mid-gauntlet — the door slammed shut. start over with `!stepinside`.'
        : '';
      return message.reply(error + gauntletNote);
    }

    // Candybag submissions require the full gauntlet run. Non-candybag
    // submissions reset the counter if mid-flow (out-of-order).
    const candybagId = event.board?.candybagTileId;
    if (tile.tileId === candybagId) {
      if (team.hauntedGauntletLevel < 3) {
        return message.reply(
          "🚪 you can't just walk into the spooky house. run `!stepinside` first — you'll be given further instructions.",
        );
      }
    } else {
      const brokeGauntlet = await resetGauntletIfMidway(team);
      if (brokeGauntlet) {
        await message.reply('👻 you stepped away from the spooky house door. gauntlet reset.');
      }
    }

    try {
      await createSubmissionRecord({ event, team, tile, type: 'FINAL', screenshot, message });
      // Successful candybag submission — the team used their commitment.
      // Reset the gauntlet so a new run needs the full three commands again.
      if (tile.tileId === candybagId) {
        await setGauntletLevel(team, 0);
      }
      return message.reply(
        `✅ Submission logged for **${tile.tileId}** — pending ref review. Stay spooky! 🎃`,
      );
    } catch (err) {
      if (err.userFacing) return message.reply(err.userFacing);
      console.error('[spoopysubmit] error creating submission:', err);
      return message.reply('❌ Failed to record your submission. Please try again.');
    }
  },
};

module.exports.spoopypre = {
  name: 'spoopypre',
  aliases: ['spp'],
  description: 'Submit a Spoopy pre-screenshot baseline (attach a screenshot).',

  async execute(message, args = []) {
    const screenshot = message.attachments.first()?.url ?? null;
    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message. Usage: `!spoopypre [tile]` with a screenshot attached.',
      );
    }

    const ctx = await resolveContext(message);
    if (!ctx) {
      return message.reply(
        "❌ No active Spoopy event for this channel — make sure your team's Discord channel is registered and you're on the roster.",
      );
    }
    const { event, team } = ctx;

    const eligible = await findEligibleTiles(team.teamId, event.eventId);
    const { tile, error } = await pickTargetTile({ eligible, event, argRaw: args[0] });
    if (error) return message.reply(error);

    // Non-candybag pre-shots reset the gauntlet if mid-flow. Candybag pres
    // don't require the gauntlet (they're just baseline uploads).
    const candybagId = event.board?.candybagTileId;
    if (tile.tileId !== candybagId) {
      const brokeGauntlet = await resetGauntletIfMidway(team);
      if (brokeGauntlet) {
        await message.reply('👻 you stepped away from the spooky house door. gauntlet reset.');
      }
    }

    try {
      await createSubmissionRecord({ event, team, tile, type: 'PRE', screenshot, message });
      return message.reply(
        `📸 Pre-screenshot logged for **${tile.tileId}** — refs will keep it for reference.`,
      );
    } catch (err) {
      if (err.userFacing) return message.reply(err.userFacing);
      console.error('[spoopypre] error creating pre-screenshot:', err);
      return message.reply('❌ Failed to record your pre-screenshot. Please try again.');
    }
  },
};

// ── Trick-or-treat option choice ─────────────────────────────────────────

// Find house tiles that are UNLOCKED with no locked-in choice yet.
async function findChooseableHouses(teamId, eventId, event) {
  const { SpoopyTeamTile } = getModels();
  const unlocked = await SpoopyTeamTile.findAll({
    where: { teamId, eventId, status: 'unlocked' },
  });
  return unlocked.filter((row) => {
    const boardTile = event.board?.tiles?.find((t) => t.id === row.tileId);
    return boardTile?.tile_type === 'house' && !row.choice;
  });
}

// Runs the state machine's chooseOption for a specific option letter, persists
// the diff, and publishes the team board update.
async function runChoice({ message, event, team, tile, option }) {
  const sm = require('../../server/utils/spoopy/spoopyStateMachine');
  const {
    loadTeamState,
    persistTeamState,
    toEventDefinition,
  } = require('../../server/utils/spoopy/spoopyPersistence');

  const prev = await loadTeamState(team.teamId);
  const eventDef = toEventDefinition(event);
  const next = sm.chooseOption(prev, eventDef, tile.tileId, option);
  await persistTeamState(prev, next);

  try {
    const { pubsub } = require('../../server/schema/pubsub');
    await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${team.teamId}`, {
      spoopyTeamBoardUpdated: await loadTeamState(team.teamId),
    });
  } catch (err) {
    console.error('[spoopy bot] board-update publish failed:', err.message);
  }

  const content = event.contentById?.[tile.tileId];
  const opt = content?.dialog?.options?.[option];
  return { outcome: opt?.outcome ?? null, label: opt?.label ?? null };
}

function makeOptionCommand(letter) {
  const alias = letter === 'a' ? 'spa' : 'spb';
  return {
    name: `spoopy${letter}`,
    aliases: [alias],
    description: `Lock in option ${letter.toUpperCase()} for the current house tile.`,
    async execute(message, args = []) {
      const ctx = await resolveContext(message);
      if (!ctx) {
        return message.reply(
          "❌ No active Spoopy event for this channel — make sure your team's Discord channel is registered and you're on the roster.",
        );
      }
      const { event, team } = ctx;

      // Picking a house option while mid-gauntlet counts as bailing.
      const brokeGauntlet = await resetGauntletIfMidway(team);
      if (brokeGauntlet) {
        await message.reply('👻 you stepped away from the spooky house door. gauntlet reset.');
      }

      const chooseable = await findChooseableHouses(team.teamId, event.eventId, event);
      const argRaw = (args[0] || '').trim().toLowerCase();
      let tile;
      if (!argRaw) {
        if (chooseable.length === 1) tile = chooseable[0];
        else if (chooseable.length === 0) {
          return message.reply(
            "❌ No house tiles are open for a trick-or-treat pick right now.",
          );
        } else {
          const ids = chooseable.map((t) => `\`${t.tileId}\``).join(', ');
          return message.reply(
            `❌ Multiple house tiles are open — please specify which one:\n${ids}\n` +
              `Usage: \`!spoopy${letter} <tile-id>\``,
          );
        }
      } else {
        tile = chooseable.find((t) => t.tileId === argRaw);
        if (!tile) {
          return message.reply(
            `❌ House tile \`${argRaw}\` isn't open for a choice right now.`,
          );
        }
      }

      try {
        const { outcome, label } = await runChoice({ message, event, team, tile, option: letter });
        const emoji = outcome === 'treat' ? '🍬' : outcome === 'trick' ? '👻' : '🎃';
        const outcomeLabel = outcome ? outcome : 'locked';
        const flavor = label ? ` — "${label}"` : '';
        return message.reply(
          `${emoji} **${team.teamName}** locked option **${letter.toUpperCase()}** (${outcomeLabel}) on ${tile.tileId}${flavor}. Task revealed on the site — submit proof with \`!spoopysubmit ${tile.tileId}\` when done.`,
        );
      } catch (err) {
        if (err.name === 'StateMachineError') {
          return message.reply(`❌ ${err.message}`);
        }
        console.error(`[spoopy${letter}] error locking choice:`, err);
        return message.reply('❌ Failed to lock your choice. Please try again.');
      }
    },
  };
}

module.exports.spoopya = makeOptionCommand('a');
module.exports.spoopyb = makeOptionCommand('b');

// Step-inside gauntlet — three escalating commands the team has to run in
// order to unlock the candybag submission.
module.exports.stepinside  = makeGauntletCommand(GAUNTLET_STAGES[0]);
module.exports.imserious   = makeGauntletCommand(GAUNTLET_STAGES[1]);
module.exports.nogoingback = makeGauntletCommand(GAUNTLET_STAGES[2]);

// Explicit bail-out. Snaps the gauntlet back to 0 without needing to go
// touch another tile. Also works at level 3 — the door was still cracked
// open until the team actually submitted proof, so backing out is fine.
module.exports.nevermind = {
  name: 'nevermind',
  description: 'Bail out of the spooky-house step-inside gauntlet.',
  async execute(message) {
    const ctx = await resolveContext(message);
    if (!ctx) {
      return message.reply(
        '❌ No active Spoopy event for this channel — nothing to bail out of.',
      );
    }
    const { team } = ctx;
    if (team.hauntedGauntletLevel === 0) {
      return message.reply(
        "😌 you weren't even at the door. carry on with your night.",
      );
    }
    await setGauntletLevel(team, 0);
    return message.reply(
      '🚪 you back away from the porch. the door creaks closed. good call.',
    );
  },
};

module.exports.help = {
  name: 'spoopy',
  aliases: ['spoopyhelp'],
  description: 'Show the Spoopy Halloween event bot commands.',
  async execute(message) {
    return message.reply(
      [
        '🎃 **Spoopy Halloween — Commands**',
        '',
        '**House tiles (trick or treat):**',
        '• `!spoopya [tile-id]` — pick option A. Alias: `!spa`.',
        '• `!spoopyb [tile-id]` — pick option B. Alias: `!spb`.',
        '',
        '**Submitting proof (all tiles):**',
        '• `!spoopysubmit [tile-id]` — attach a screenshot to submit for approval. Alias: `!sps`.',
        '• `!spoopypre [tile-id]` — attach a pre-screenshot baseline (informational only). Alias: `!spp`.',
        '',
        '**Step inside the spooky house (in order — one wrong move and you start over):**',
        '• `!stepinside` — approach the door.',
        '• `!imserious` — you swear you can hear something inside.',
        '• `!nogoingback` — the door slams shut. now you can `!spoopysubmit castle`.',
        '• `!nevermind` — bail out at any time, no questions asked.',
        '',
        '**Tile aliases:** `start` = the ready-up tile, `castle` = the scary house at the end. Otherwise use the full tile id (shown on the site modal).',
        '',
        'Refs approve or deny from the site — the outcome is posted back here.',
      ].join('\n'),
    );
  },
};
