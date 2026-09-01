'use strict';

const ExcelJS = require('exceljs');
const {
  buildContentCatalog,
  createDraftWorkbook,
  parseDraftWorkbook,
  taskAttributes,
} = require('../utils/battleship/bsDraftWorkbook');

const SHIP_SIZES = { CARRIER: 5, BATTLESHIP: 4, CRUISER: 3, SUBMARINE: 3, DESTROYER: 2 };

function fixtures(task) {
  const oceanTiles = [];
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) oceanTiles.push({ row, col, task });
  }
  const shipTemplates = [];
  for (const [shipType, size] of Object.entries(SHIP_SIZES)) {
    for (let cellIndex = 0; cellIndex < size; cellIndex += 1) {
      shipTemplates.push({ shipType, cellIndex, task });
    }
  }
  return { oceanTiles, shipTemplates };
}

describe('Battleship draft workbook', () => {
  test('round-trips all cells and writes dependent dropdown validation', async () => {
    const content = buildContentCatalog().find((item) => item.metricTypes.includes('kc'));
    const task = {
      contentId: content.id,
      metricType: 'kc',
      metricTarget: 25,
      womMetric: content.womMetric,
    };
    const buffer = await createDraftWorkbook({ eventName: 'Test Battle', ...fixtures(task) });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.getWorksheet('Metric Options').state).toBe('veryHidden');
    expect(workbook.getWorksheet('Ocean Tiles').getCell('B2').dataValidation.formulae).toEqual([
      'ContentOptions',
    ]);
    expect(workbook.getWorksheet('Ocean Tiles').getCell('C2').dataValidation.formulae[0]).toContain(
      'INDIRECT(VLOOKUP('
    );

    const parsed = await parseDraftWorkbook(buffer);
    expect(parsed.errors).toEqual([]);
    expect(parsed.oceanTiles).toHaveLength(100);
    expect(parsed.shipTiles).toHaveLength(17);
  });

  test('rejects a metric type that the selected content does not support', async () => {
    const skill = buildContentCatalog().find((item) => item.category === 'skill');
    const task = {
      contentId: skill.id,
      metricType: 'xp',
      metricTarget: 100000,
      womMetric: skill.womMetric,
    };
    const buffer = await createDraftWorkbook({ eventName: 'Test Battle', ...fixtures(task) });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    workbook.getWorksheet('Ocean Tiles').getCell('C2').value = 'kc';
    const edited = await workbook.xlsx.writeBuffer();

    const parsed = await parseDraftWorkbook(edited);
    expect(parsed.errors).toContain(
      `Ocean Tiles row 2: ${skill.displayName} does not support "kc".`
    );
  });

  test('derives WOM fields and leaves unique drops for manual review', () => {
    const uniqueContent = buildContentCatalog().find((item) => item.metricTypes.includes('unique'));
    const attrs = taskAttributes({ content: uniqueContent, metricType: 'unique', metricTarget: 2 });
    expect(attrs.womMetric).toBeNull();
    expect(attrs.metricUnit).toBe('uniques');
    expect(attrs.validDrops.length).toBeGreaterThan(0);
  });

  test('includes non-WOM minigames as manually reviewed completion tasks', () => {
    const catalog = buildContentCatalog();
    for (const id of ['barbarianAssault', 'pestControl', 'castleWars']) {
      const minigame = catalog.find((item) => item.id === id);
      expect(minigame).toMatchObject({ category: 'minigame', metricTypes: ['kc'], womMetric: null });
      expect(taskAttributes({ content: minigame, metricType: 'kc', metricTarget: 10 }).womMetric).toBeNull();
    }
  });

  test('dagannoth kings offers both kc and unique despite null womKey', () => {
    const dk = buildContentCatalog().find((item) => item.id === 'dagannothKings');
    expect(dk).toBeDefined();
    expect(dk.metricTypes).toEqual(expect.arrayContaining(['kc', 'unique']));
  });

  test('round-trips a dagannoth kings kc task without validation errors', async () => {
    const dk = buildContentCatalog().find((item) => item.id === 'dagannothKings');
    const task = {
      contentId: 'dagannothKings_kc',
      bossOrSkill: dk.displayName,
      metricType: 'kc',
      metricTarget: 200,
      womMetric: null,
    };
    const buffer = await createDraftWorkbook({ eventName: 'DK Test', ...fixtures(task) });
    const parsed = await parseDraftWorkbook(buffer);
    expect(parsed.errors).toEqual([]);
    expect(parsed.oceanTiles).toHaveLength(100);
  });

  test('exports a label for tasks with null contentId and null womMetric', async () => {
    // Simulates legacy tasks (contentId column added later, dev seeder never set
    // it) whose content has no WOM key — the export used to leave column B blank.
    const ExcelJS = require('exceljs');
    const task = {
      contentId: null,
      bossOrSkill: 'Barbarian Assault',
      label: 'Barbarian Assault',
      metricType: 'kc',
      metricTarget: 10,
      womMetric: null,
    };
    const buffer = await createDraftWorkbook({ eventName: 'Legacy Test', ...fixtures(task) });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    expect(workbook.getWorksheet('Ocean Tiles').getCell('B2').value).toBe('Barbarian Assault');

    const parsed = await parseDraftWorkbook(buffer);
    expect(parsed.errors).toEqual([]);
  });

  test('includes content-manager entries even when default generation disables them', () => {
    const catalog = buildContentCatalog();
    for (const id of [
      'brutus',
      'derangedArchaeologist',
      'hespori',
      'kingBlackDragon',
      'mimic',
      'scurrius',
      'skotizo',
      'tombsOfAmascutExpert',
    ]) {
      expect(catalog.find((item) => item.id === id)?.metricTypes).toContain('kc');
    }
  });
});
