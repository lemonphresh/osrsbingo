import { findBSTeamForDiscordId, redactBSOpponentBoardForTeam } from './bsPreview';

test('creator team preview hides unshot opponent ships and restores the ocean task', () => {
  const oceanTask = { taskId: 'ocean-task', label: 'Zulrah KC' };
  const shipTask = { taskId: 'ship-task', label: 'Slayer XP' };
  const unshotShipTile = {
    tileId: 'hidden',
    taskId: oceanTask.taskId,
    shipType: 'DESTROYER',
    cellIndex: 0,
    task: shipTask,
    isShot: false,
  };
  const revealedShipTile = { ...unshotShipTile, tileId: 'revealed', isShot: true };
  const board = {
    boardId: 'opponent-board',
    shipPlacements: [{ placementId: 'secret' }],
    tiles: [unshotShipTile, revealedShipTile],
  };

  const preview = redactBSOpponentBoardForTeam(board, [oceanTask, shipTask]);

  expect(preview.shipPlacements).toEqual([]);
  expect(preview.tiles[0]).toMatchObject({
    tileId: 'hidden',
    shipType: null,
    cellIndex: null,
    task: oceanTask,
  });
  expect(preview.tiles[1]).toEqual(revealedShipTile);
  expect(board).toEqual({
    boardId: 'opponent-board',
    shipPlacements: [{ placementId: 'secret' }],
    tiles: [unshotShipTile, revealedShipTile],
  });
});

test('handles an absent board', () => {
  expect(redactBSOpponentBoardForTeam(null, [])).toBeNull();
});

test('finds a Battleship team using a normalized Discord ID', () => {
  const team = { teamId: 'salty-dogs', members: [' 857666197243953173 '] };

  expect(findBSTeamForDiscordId([team], '857666197243953173')).toBe(team);
  expect(findBSTeamForDiscordId([team], null)).toBeNull();
  expect(findBSTeamForDiscordId([team], 'different-id')).toBeNull();
});
