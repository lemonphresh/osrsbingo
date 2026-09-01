'use strict';

const ExcelJS = require('exceljs');
const { registry } = require('../contentRegistry');
const { formatXp } = require('./bsDefaultTasks');

const OCEAN_SHEET = 'Ocean Tiles';
const SHIP_SHEET = 'Ship Tiles';
const OPTIONS_SHEET = 'Metric Options';
const SHIP_SIZES = { CARRIER: 5, BATTLESHIP: 4, CRUISER: 3, SUBMARINE: 3, DESTROYER: 2 };
const COL_LABELS = 'ABCDEFGHIJ';

function rangesFor(entry) {
  const metrics = [];
  const hasUniques =
    Array.isArray(entry.drops) && entry.drops.length > 0 && entry.dropQuantities != null;
  if (entry.category === 'skill') return entry.womKey ? ['xp'] : [];
  // Composite entries like dagannoth_kings have womKey: null (WOM tracks the
  // individual kings) but still ship a `quantities` block for KC-style tasks —
  // allow those alongside WOM-mapped bosses/raids/clues.
  const hasKc =
    entry.category === 'minigame' ||
    (['boss', 'raid', 'clue'].includes(entry.category) && (entry.womKey || entry.quantities));
  if (hasKc) metrics.push('kc');
  if (hasUniques) metrics.push('unique');
  return metrics;
}

function buildContentCatalog() {
  const groups = [
    ['boss', registry.BOSSES],
    ['raid', registry.RAIDS],
    ['skill', registry.SKILLS],
    ['minigame', registry.MINIGAMES],
    ['clue', registry.CLUES],
  ];
  const catalog = [];
  for (const [category, entries] of groups) {
    for (const entry of Object.values(entries)) {
      const normalized = { ...entry, category };
      const metricTypes = rangesFor(normalized);
      // `enabled` controls automatic/default event generation, not workbook
      // authoring. Disabled content-manager entries remain valid choices here.
      if (metricTypes.length === 0) continue;
      catalog.push({
        id: entry.id,
        displayName: entry.displayName,
        category,
        womMetric: entry.womKey ?? null,
        metricTypes,
        validDrops: entry.drops ?? [],
      });
    }
  }
  return catalog.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function baseContentId(contentId) {
  return String(contentId ?? '').replace(/_kc$/, '');
}

function taskContent(task, catalog) {
  if (!task) return '';
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const direct = byId.get(baseContentId(task.contentId));
  if (direct) return direct.displayName;
  // Fall back to task-record display name so legacy tasks with null contentId
  // (or content whose womKey is null, like Barbarian Assault or Dagannoth Kings)
  // still resolve to a catalog entry.
  const byName = new Map(catalog.map((item) => [item.displayName.toLowerCase(), item]));
  const nameMatch = byName.get(
    String(task.bossOrSkill ?? task.label ?? '').trim().toLowerCase()
  );
  if (nameMatch) return nameMatch.displayName;
  const candidates = catalog.filter((item) => item.womMetric && item.womMetric === task.womMetric);
  return candidates.length === 1 ? candidates[0].displayName : '';
}

function styleSheet(sheet, widths) {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + widths.length)}1` };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF166534' } };
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.eachRow((row, rowNumber) => {
    row.alignment = { vertical: 'middle' };
    if (rowNumber > 1 && rowNumber % 2 === 0) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    }
  });
}

function addValidations(
  workbook,
  sheet,
  contentColumn,
  metricColumn,
  firstRow,
  lastRow,
  optionEndRow
) {
  for (let row = firstRow; row <= lastRow; row += 1) {
    sheet.getCell(`${contentColumn}${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['ContentOptions'],
      showErrorMessage: true,
      errorTitle: 'Unsupported content',
      error: 'Choose content from the dropdown.',
    };
    sheet.getCell(`${metricColumn}${row}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [
        `INDIRECT(VLOOKUP(${contentColumn}${row},'${OPTIONS_SHEET}'!$A$2:$D$${optionEndRow},4,FALSE))`,
      ],
      showErrorMessage: true,
      errorTitle: 'Unsupported metric type',
      error: 'Choose a metric supported by the selected content.',
    };
  }
}

async function createDraftWorkbook({ eventName, oceanTiles, shipTemplates }) {
  const catalog = buildContentCatalog();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'OSRS Bingo';
  workbook.title = `${eventName} Battleship Draft`;
  workbook.created = new Date();

  const options = workbook.addWorksheet(OPTIONS_SHEET, { state: 'veryHidden' });
  options.addRow(['Content', 'Content ID', 'Category', 'Metric Range', 'Metric 1', 'Metric 2']);
  catalog.forEach((item, index) => {
    const row = index + 2;
    const rangeName = `BSMetricOptions${index + 1}`;
    options.addRow([item.displayName, item.id, item.category, rangeName, ...item.metricTypes]);
    const endColumn = item.metricTypes.length === 2 ? 'F' : 'E';
    workbook.definedNames.add(`'${OPTIONS_SHEET}'!$E$${row}:$${endColumn}$${row}`, rangeName);
  });
  workbook.definedNames.add(`'${OPTIONS_SHEET}'!$A$2:$A$${catalog.length + 1}`, 'ContentOptions');

  const ocean = workbook.addWorksheet(OCEAN_SHEET);
  ocean.addRow(['Coordinate', 'Content', 'Metric Type', 'Target']);
  const oceanByPosition = new Map(
    oceanTiles.map((tile) => [`${tile.row},${tile.col}`, tile.task ?? null])
  );
  for (let row = 0; row < 10; row += 1) {
    for (let col = 0; col < 10; col += 1) {
      const task = oceanByPosition.get(`${row},${col}`);
      ocean.addRow([
        `${COL_LABELS[col]}${row + 1}`,
        taskContent(task, catalog),
        task?.metricType ?? '',
        task?.metricTarget ?? '',
      ]);
    }
  }
  styleSheet(ocean, [14, 34, 18, 16]);
  ocean.getColumn(1).protection = { locked: true };
  addValidations(workbook, ocean, 'B', 'C', 2, 101, catalog.length + 1);

  const ships = workbook.addWorksheet(SHIP_SHEET);
  ships.addRow(['Ship Type', 'Cell Index', 'Content', 'Metric Type', 'Target']);
  const templateMap = new Map(
    shipTemplates.map((template) => [
      `${template.shipType}:${template.cellIndex}`,
      template.task ?? null,
    ])
  );
  for (const [shipType, size] of Object.entries(SHIP_SIZES)) {
    for (let cellIndex = 0; cellIndex < size; cellIndex += 1) {
      const task = templateMap.get(`${shipType}:${cellIndex}`);
      ships.addRow([
        shipType,
        cellIndex,
        taskContent(task, catalog),
        task?.metricType ?? '',
        task?.metricTarget ?? '',
      ]);
    }
  }
  styleSheet(ships, [18, 14, 34, 18, 16]);
  addValidations(workbook, ships, 'C', 'D', 2, 18, catalog.length + 1);

  return workbook.xlsx.writeBuffer();
}

function parseCoordinate(value) {
  const match = /^([A-J])(10|[1-9])$/i.exec(String(value ?? '').trim());
  if (!match) return null;
  return { row: Number(match[2]) - 1, col: COL_LABELS.indexOf(match[1].toUpperCase()) };
}

function scalar(cell) {
  const value = cell?.value;
  if (value && typeof value === 'object') {
    if (value.result != null) return value.result;
    if (value.text != null) return value.text;
  }
  return value;
}

function resolveContent(value, catalog) {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  return catalog.find(
    (item) => item.displayName.toLowerCase() === normalized || item.id.toLowerCase() === normalized
  );
}

function parseTask(sheet, rowNumber, contentColumn, metricColumn, targetColumn, catalog, errors) {
  const contentValue = scalar(sheet.getCell(`${contentColumn}${rowNumber}`));
  const metricType = String(scalar(sheet.getCell(`${metricColumn}${rowNumber}`)) ?? '')
    .trim()
    .toLowerCase();
  const target = Number(scalar(sheet.getCell(`${targetColumn}${rowNumber}`)));
  const content = resolveContent(contentValue, catalog);
  if (!content)
    errors.push(`${sheet.name} row ${rowNumber}: unsupported content "${contentValue ?? ''}".`);
  if (content && !content.metricTypes.includes(metricType)) {
    errors.push(
      `${sheet.name} row ${rowNumber}: ${content.displayName} does not support "${metricType}".`
    );
  }
  if (!Number.isSafeInteger(target) || target <= 0) {
    errors.push(`${sheet.name} row ${rowNumber}: target must be a positive whole number.`);
  }
  if (
    !content ||
    !content.metricTypes.includes(metricType) ||
    !Number.isSafeInteger(target) ||
    target <= 0
  ) {
    return null;
  }
  return { content, metricType, metricTarget: target };
}

async function parseDraftWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const oceanSheet = workbook.getWorksheet(OCEAN_SHEET);
  const shipSheet = workbook.getWorksheet(SHIP_SHEET);
  const errors = [];
  if (!oceanSheet) errors.push(`Missing "${OCEAN_SHEET}" sheet.`);
  if (!shipSheet) errors.push(`Missing "${SHIP_SHEET}" sheet.`);
  if (!oceanSheet || !shipSheet) return { oceanTiles: [], shipTiles: [], errors };

  const catalog = buildContentCatalog();
  const oceanTiles = [];
  const coordinates = new Set();
  for (let rowNumber = 2; rowNumber <= oceanSheet.rowCount; rowNumber += 1) {
    const coordinateValue = scalar(oceanSheet.getCell(`A${rowNumber}`));
    if (coordinateValue == null || String(coordinateValue).trim() === '') continue;
    const coordinate = parseCoordinate(coordinateValue);
    if (!coordinate) {
      errors.push(`${OCEAN_SHEET} row ${rowNumber}: invalid coordinate "${coordinateValue}".`);
      continue;
    }
    const key = `${coordinate.row},${coordinate.col}`;
    if (coordinates.has(key)) errors.push(`${OCEAN_SHEET} row ${rowNumber}: duplicate coordinate.`);
    coordinates.add(key);
    const task = parseTask(oceanSheet, rowNumber, 'B', 'C', 'D', catalog, errors);
    if (task) oceanTiles.push({ ...coordinate, ...task });
  }
  if (coordinates.size !== 100)
    errors.push(`${OCEAN_SHEET} must contain all 100 unique coordinates.`);

  const shipTiles = [];
  const shipCells = new Set();
  for (let rowNumber = 2; rowNumber <= shipSheet.rowCount; rowNumber += 1) {
    const shipType = String(scalar(shipSheet.getCell(`A${rowNumber}`)) ?? '')
      .trim()
      .toUpperCase();
    if (!shipType) continue;
    const cellIndex = Number(scalar(shipSheet.getCell(`B${rowNumber}`)));
    if (!Object.prototype.hasOwnProperty.call(SHIP_SIZES, shipType)) {
      errors.push(`${SHIP_SHEET} row ${rowNumber}: invalid ship type "${shipType}".`);
      continue;
    }
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= SHIP_SIZES[shipType]) {
      errors.push(`${SHIP_SHEET} row ${rowNumber}: invalid cell index for ${shipType}.`);
      continue;
    }
    const key = `${shipType}:${cellIndex}`;
    if (shipCells.has(key)) errors.push(`${SHIP_SHEET} row ${rowNumber}: duplicate ship cell.`);
    shipCells.add(key);
    const task = parseTask(shipSheet, rowNumber, 'C', 'D', 'E', catalog, errors);
    if (task) shipTiles.push({ shipType, cellIndex, ...task });
  }
  if (shipCells.size !== 17) errors.push(`${SHIP_SHEET} must contain all 17 unique ship cells.`);

  return { oceanTiles, shipTiles, errors };
}

function taskAttributes(row) {
  const isUnique = row.metricType === 'unique';
  const metricUnit = row.metricType === 'xp' ? 'xp' : isUnique ? 'uniques' : 'kc';
  let metricLabel = `${row.metricTarget} kc`;
  if (row.metricType === 'xp') metricLabel = formatXp(row.metricTarget);
  if (isUnique) metricLabel = `${row.metricTarget} unique${row.metricTarget === 1 ? '' : 's'}`;
  return {
    contentId: row.content.id,
    label: row.content.displayName,
    bossOrSkill: row.content.displayName,
    metricType: row.metricType,
    metricTarget: row.metricTarget,
    metricUnit,
    metricLabel,
    validDrops: isUnique ? row.content.validDrops : [],
    // WOM tracks kills/activities/XP, not individual unique drops.
    womMetric: isUnique ? null : row.content.womMetric,
  };
}

module.exports = {
  OCEAN_SHEET,
  SHIP_SHEET,
  SHIP_SIZES,
  buildContentCatalog,
  createDraftWorkbook,
  parseDraftWorkbook,
  taskAttributes,
};
