/**
 * Champion Forge integration tests
 *
 * Runs against database_test (local Postgres). Requires:
 *   npx sequelize-cli db:migrate --config db/config/config.json --migrations-path db/migrations --env test
 *
 * Each describe block tears down its own data via afterAll.
 */

process.env.NODE_ENV = 'test';

const { Sequelize } = require('sequelize');
const db = require('../db/models');
const { Op } = require('sequelize');
const { Mutation: resolvers } = require('../schema/resolvers/ClanWars');
const { triggerGatheringTransition } = require('../utils/cwScheduler');

// ── DB setup ──────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.sequelize.authenticate();
});

afterAll(async () => {
  await db.sequelize.close();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const adminUser   = { id: 1, admin: true, discordUserId: 'discord-admin' };
const pvmerUser   = { id: 2, admin: false, discordUserId: 'discord-pvmer' };
const skillerUser = { id: 3, admin: false, discordUserId: 'discord-skiller' };

function ctx(user) {
  return { user };
}

// ── Full game flow ─────────────────────────────────────────────────────────────

describe('Champion Forge — full game flow', () => {
  let eventId;
  let pvmerTeamId;
  let skillerTeamId;
  let pvmerTaskId;
  let skillerTaskId;

  // ── 1. Create event ──────────────────────────────────────────────────────────
  test('admin can create an event', async () => {
    const event = await resolvers.createClanWarsEvent(
      null,
      {
        input: {
          eventName: 'Test Forge Event',
          difficulty: 'standard',
          bracketType: 'SINGLE_ELIMINATION',
          gatheringHours: 1,
          outfittingHours: 1,
          flexRolesAllowed: false,
          teams: [
            { teamName: 'PvM Squad', members: [{ discordId: pvmerUser.discordUserId, username: 'PvMer', avatar: null, role: 'UNSET' }] },
            { teamName: 'Skill Squad', members: [{ discordId: skillerUser.discordUserId, username: 'Skiller', avatar: null, role: 'UNSET' }] },
          ],
        },
      },
      ctx(adminUser)
    );

    expect(event.eventName).toBe('Test Forge Event');
    expect(event.status).toBe('DRAFT');
    expect(event.creatorId).toBe(String(adminUser.id));
    eventId = event.eventId;

    const { ClanWarsTeam } = db;
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });
    expect(teams).toHaveLength(2);
    pvmerTeamId  = teams.find((t) => t.teamName === 'PvM Squad').teamId;
    skillerTeamId = teams.find((t) => t.teamName === 'Skill Squad').teamId;
  });

  // ── 2. Advance to GATHERING ──────────────────────────────────────────────────
  test('admin can start gathering phase', async () => {
    const { ClanWarsEvent } = db;
    const event = await ClanWarsEvent.findByPk(eventId);
    // triggerGatheringTransition bypasses the guildId requirement
    await triggerGatheringTransition(event);
    await event.reload();
    expect(event.status).toBe('GATHERING');
    expect(event.gatheringStart).not.toBeNull();

    // Tasks should have been generated
    const { ClanWarsTask } = db;
    const tasks = await ClanWarsTask.findAll({ where: { eventId } });
    expect(tasks.length).toBeGreaterThan(0);
    pvmerTaskId  = tasks.find((t) => t.role === 'PVMER')?.taskId;
    skillerTaskId = tasks.find((t) => t.role === 'SKILLER')?.taskId;
    expect(pvmerTaskId).toBeDefined();
    expect(skillerTaskId).toBeDefined();
  });

  // ── 3. Members set roles ─────────────────────────────────────────────────────
  test('pvmer can set role to PVMER', async () => {
    const { ClanWarsTeam } = db;
    const team = await ClanWarsTeam.findByPk(pvmerTeamId);
    const updated = team.members.map((m) =>
      m.discordId === pvmerUser.discordUserId
        ? { ...m, role: 'PVMER' }
        : m
    );
    const result = await resolvers.updateClanWarsTeamMembers(
      null,
      { teamId: pvmerTeamId, members: updated },
      ctx(pvmerUser)
    );
    const member = result.members.find((m) => m.discordId === pvmerUser.discordUserId);
    expect(member.role).toBe('PVMER');
  });

  test('skiller can set role to SKILLER', async () => {
    const { ClanWarsTeam } = db;
    const team = await ClanWarsTeam.findByPk(skillerTeamId);
    const updated = team.members.map((m) =>
      m.discordId === skillerUser.discordUserId
        ? { ...m, role: 'SKILLER' }
        : m
    );
    const result = await resolvers.updateClanWarsTeamMembers(
      null,
      { teamId: skillerTeamId, members: updated },
      ctx(skillerUser)
    );
    const member = result.members.find((m) => m.discordId === skillerUser.discordUserId);
    expect(member.role).toBe('SKILLER');
  });

  // ── 4. Join tasks ────────────────────────────────────────────────────────────
  test('pvmer can join a PVMER task', async () => {
    const team = await resolvers.joinTaskInProgress(
      null,
      { eventId, teamId: pvmerTeamId, taskId: pvmerTaskId },
      ctx(pvmerUser)
    );
    expect(team.taskProgress[pvmerTaskId]).toContain(pvmerUser.discordUserId);
  });

  test('pvmer cannot join a second task while on one', async () => {
    const { ClanWarsTask } = db;
    const otherTask = await ClanWarsTask.findOne({
      where: { eventId, role: 'PVMER', taskId: { [Op.ne]: pvmerTaskId } },
    });
    if (!otherTask) return; // no second PVMER task in this seed — skip

    await expect(
      resolvers.joinTaskInProgress(
        null,
        { eventId, teamId: pvmerTeamId, taskId: otherTask.taskId },
        ctx(pvmerUser)
      )
    ).rejects.toThrow('already working on a task');
  });

  test('skiller cannot join a PVMER task', async () => {
    await expect(
      resolvers.joinTaskInProgress(
        null,
        { eventId, teamId: skillerTeamId, taskId: pvmerTaskId },
        ctx(skillerUser)
      )
    ).rejects.toThrow();
  });

  test('skiller can join a SKILLER task', async () => {
    const team = await resolvers.joinTaskInProgress(
      null,
      { eventId, teamId: skillerTeamId, taskId: skillerTaskId },
      ctx(skillerUser)
    );
    expect(team.taskProgress[skillerTaskId]).toContain(skillerUser.discordUserId);
  });

  // ── 5. Role locks after joining ──────────────────────────────────────────────
  test('pvmer cannot change role after joining a task', async () => {
    const { ClanWarsTeam } = db;
    const team = await ClanWarsTeam.findByPk(pvmerTeamId);
    const updated = team.members.map((m) =>
      m.discordId === pvmerUser.discordUserId ? { ...m, role: 'SKILLER' } : m
    );
    await expect(
      resolvers.updateClanWarsTeamMembers(
        null,
        { teamId: pvmerTeamId, members: updated },
        ctx(pvmerUser)
      )
    ).rejects.toThrow('locked');
  });

  // ── 6. Leave task ────────────────────────────────────────────────────────────
  test('pvmer can leave their task', async () => {
    const team = await resolvers.leaveTaskInProgress(
      null,
      { eventId, teamId: pvmerTeamId, taskId: pvmerTaskId },
      ctx(pvmerUser)
    );
    expect(team.taskProgress[pvmerTaskId] ?? []).not.toContain(pvmerUser.discordUserId);
  });

  test('pvmer can rejoin after leaving', async () => {
    const team = await resolvers.joinTaskInProgress(
      null,
      { eventId, teamId: pvmerTeamId, taskId: pvmerTaskId },
      ctx(pvmerUser)
    );
    expect(team.taskProgress[pvmerTaskId]).toContain(pvmerUser.discordUserId);
  });

  // ── 7. Submit screenshots ────────────────────────────────────────────────────
  let pvmerSubmissionId;
  let skillerSubmissionId;

  test('pvmer can submit a screenshot', async () => {
    const sub = await resolvers.createClanWarsSubmission(
      null,
      {
        input: {
          eventId,
          teamId: pvmerTeamId,
          submittedBy: pvmerUser.discordUserId,
          submittedUsername: 'PvMer',
          taskId: pvmerTaskId,
          screenshot: 'https://example.com/pvmer-proof.png',
        },
      },
      ctx(pvmerUser)
    );
    expect(sub.status).toBe('PENDING');
    expect(sub.role).toBe('PVMER');
    pvmerSubmissionId = sub.submissionId;
  });

  test('skiller can submit a screenshot', async () => {
    const sub = await resolvers.createClanWarsSubmission(
      null,
      {
        input: {
          eventId,
          teamId: skillerTeamId,
          submittedBy: skillerUser.discordUserId,
          submittedUsername: 'Skiller',
          taskId: skillerTaskId,
          screenshot: 'https://example.com/skiller-proof.png',
        },
      },
      ctx(skillerUser)
    );
    expect(sub.status).toBe('PENDING');
    expect(sub.role).toBe('SKILLER');
    skillerSubmissionId = sub.submissionId;
  });

  // ── 8. Admin reviews submissions ─────────────────────────────────────────────
  test('admin can approve pvmer submission with reward slot', async () => {
    const sub = await resolvers.reviewClanWarsSubmission(
      null,
      { submissionId: pvmerSubmissionId, approved: true, rewardSlot: 'weapon', reviewerId: String(adminUser.id) },
      ctx(adminUser)
    );
    expect(sub.status).toBe('APPROVED');
    expect(sub.rewardSlot).toBe('weapon');
  });

  test('admin can approve skiller submission', async () => {
    const sub = await resolvers.reviewClanWarsSubmission(
      null,
      { submissionId: skillerSubmissionId, approved: true, reviewerId: String(adminUser.id) },
      ctx(adminUser)
    );
    expect(sub.status).toBe('APPROVED');
  });

  // ── 9. Mark tasks complete ───────────────────────────────────────────────────
  test('admin can mark pvmer task complete', async () => {
    const team = await resolvers.markTaskComplete(
      null,
      { eventId, teamId: pvmerTeamId, taskId: pvmerTaskId },
      ctx(adminUser)
    );
    expect(team.completedTaskIds).toContain(pvmerTaskId);
  });

  test('admin can mark skiller task complete', async () => {
    const team = await resolvers.markTaskComplete(
      null,
      { eventId, teamId: skillerTeamId, taskId: skillerTaskId },
      ctx(adminUser)
    );
    expect(team.completedTaskIds).toContain(skillerTaskId);
  });

  // ── 10. Advance to OUTFITTING ────────────────────────────────────────────────
  test('admin can advance to OUTFITTING', async () => {
    const event = await resolvers.updateClanWarsEventStatus(
      null,
      { eventId, status: 'OUTFITTING' },
      ctx(adminUser)
    );
    expect(event.status).toBe('OUTFITTING');
  });

  // ── 11. Advance to BATTLE ────────────────────────────────────────────────────
  test('admin can advance to BATTLE', async () => {
    const event = await resolvers.updateClanWarsEventStatus(
      null,
      { eventId, status: 'BATTLE' },
      ctx(adminUser)
    );
    expect(event.status).toBe('BATTLE');
  });

  // ── 12. Generate bracket ─────────────────────────────────────────────────────
  test('admin can generate bracket', async () => {
    const event = await resolvers.generateClanWarsBracket(
      null,
      { eventId, bracketType: 'SINGLE_ELIMINATION' },
      ctx(adminUser)
    );
    expect(event.bracket).not.toBeNull();
    expect(event.bracket.rounds).toBeDefined();
    expect(event.bracket.rounds.length).toBeGreaterThan(0);
  });

  // ── Cleanup ──────────────────────────────────────────────────────────────────
  afterAll(async () => {
    if (!eventId) return;
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission, ClanWarsItem } = db;
    await ClanWarsSubmission.destroy({ where: { eventId } });
    await ClanWarsItem.destroy({ where: { eventId } });
    await ClanWarsTask.destroy({ where: { eventId } });
    await ClanWarsTeam.destroy({ where: { eventId } });
    await ClanWarsEvent.destroy({ where: { eventId } });
  });
});
