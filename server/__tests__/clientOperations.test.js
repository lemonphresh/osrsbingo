// server/__tests__/clientOperations.test.js
//
// Validates every exported GQL operation in the client graphql/ directory and
// every query string in the bot against the live server schema.
//
// Catches stale operation names, wrong field selections, type mismatches, and
// the category of TreasureHunt → GR rename bugs we've seen previously.
//
// Run with: npm test

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const gqlTag = require('graphql-tag');
const { validate, parse } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs } = require('../schema');

// ─── Build schema (same as graphql.test.js, no DB needed) ─────────────────────
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query: {},
    Mutation: {},
    Subscription: {},
    DateTime: require('graphql-scalars').DateTimeResolver,
    JSON: require('graphql-scalars').JSONResolver,
  },
  resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
});

// ─── Client ES-module loader ───────────────────────────────────────────────────
// Client files use `import { gql } from '@apollo/client'` + ES module exports.
// We can't require() those directly from Node, so we transform them on the fly:
//   - Strip the apollo import and inject graphql-tag's gql instead
//   - Rewrite `export const X = ` to `const X = exports.X = ` so the variable
//     stays in scope for interpolations (e.g. ${SOME_FRAGMENT}) AND is exported
//   - Rewrite `export { X }` shorthand re-exports
// Then run in a vm sandbox.

const CLIENT_GQL_DIR = path.resolve(__dirname, '../../client/src/graphql');

function loadClientFile(filename) {
  let code = fs.readFileSync(path.join(CLIENT_GQL_DIR, filename), 'utf8');

  code = code
    // Remove apollo import
    .replace(/^import \{ gql \} from ['"]@apollo\/client['"];?\r?\n/gm, '')
    // export const X = … → const X = exports.X = …
    // Keeps X in local scope so fragment interpolations still resolve
    .replace(/^export const (\w+) = /gm, 'const $1 = exports.$1 = ')
    // export { X, Y } → exports.X = X; exports.Y = Y;
    .replace(/^export \{\s*([\w\s,]+)\s*\};?$/gm, (_, names) =>
      names
        .split(',')
        .map((n) => `exports.${n.trim()} = ${n.trim()};`)
        .join('\n'),
    );

  const sandbox = { exports: {}, gql: gqlTag };
  vm.runInNewContext(code, sandbox);
  return sandbox.exports;
}

// ─── Bot query extractor ───────────────────────────────────────────────────────
// Bot files use plain template-literal strings (not gql tags), so we read the
// file as text and regex-extract anything that looks like a GQL operation.

function extractBotQueryStrings(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const results = [];
  // Match backtick strings that open with a GQL operation keyword
  const re = /`\s*((?:query|mutation|subscription)\s+\w[\s\S]*?)`/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    results.push(match[1].trim());
  }
  return results;
}

// ─── Load everything synchronously at module-load time ────────────────────────
// Jest collects test cases before running them, so dynamic test generation
// (test.each) must happen synchronously here, outside describe/test blocks.

const CLIENT_FILES = [
  'queries.js',
  'mutations.js',
  'bsOperations.js',
  'cfOperations.js',
  'draftOperations.js',
  'groupDashboardOperations.js',
  'rainbowBingoOperations.js',
];

// Map of "filename → opName" → DocumentNode (or error sentinel)
const clientOps = {};

for (const filename of CLIENT_FILES) {
  try {
    const exports = loadClientFile(filename);
    let found = 0;
    for (const [name, doc] of Object.entries(exports)) {
      if (doc && doc.kind === 'Document') {
        clientOps[`${filename} → ${name}`] = { doc };
        found++;
      }
    }
    if (found === 0) {
      clientOps[`${filename} → (no DocumentNodes found)`] = {
        error: `File loaded but exported no gql DocumentNodes`,
      };
    }
  } catch (err) {
    clientOps[`${filename} → (load error)`] = { error: err.message };
  }
}

// Bot queries
const BOT_FILE = path.resolve(__dirname, '../../bot/utils/graphql.js');
const botQueryStrings = extractBotQueryStrings(BOT_FILE);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Client GQL operations — valid against server schema', () => {
  test.each(Object.entries(clientOps))('%s', (label, entry) => {
    if (entry.error) throw new Error(entry.error);

    // Standalone fragment exports are building blocks meant to be interpolated
    // into operations — they're not valid standalone documents, skip them.
    const hasOperation = entry.doc.definitions.some(
      (d) => d.kind === 'OperationDefinition',
    );
    if (!hasOperation) return;

    const errors = validate(schema, entry.doc);
    if (errors.length > 0) {
      throw new Error(errors.map((e) => `  • ${e.message}`).join('\n'));
    }
  });
});

describe('Bot GQL queries — valid against server schema', () => {
  test('bot/utils/graphql.js exports at least one query', () => {
    expect(botQueryStrings.length).toBeGreaterThan(0);
  });

  botQueryStrings.forEach((queryStr, i) => {
    test(`query #${i + 1}`, () => {
      const doc = parse(queryStr);
      const errors = validate(schema, doc);
      if (errors.length > 0) {
        // Include the first line of the query in the error for easy identification
        const firstLine = queryStr.split('\n').find((l) => l.trim()).trim();
        throw new Error(`"${firstLine}"\n${errors.map((e) => `  • ${e.message}`).join('\n')}`);
      }
    });
  });
});
