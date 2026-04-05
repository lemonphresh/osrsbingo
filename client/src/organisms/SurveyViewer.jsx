import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Select,
  VStack,
  Flex,
  Spinner,
  Center,
  ButtonGroup,
  Button,
} from '@chakra-ui/react';
import Papa from 'papaparse';

// Add survey entries here as CSVs become available:
// 'Display Name': 'filename.csv'
const SURVEY_MANIFEST = {
  // 'Example Survey': 'example-survey.csv',
  'Tile & Error (2025-05-01)': 'EGTileandErrorFeedback.csv',
  'Battleship (2025-07-01)': 'EGBattleshipFeedback.csv',
  'Monster Hunter (2025-08-01)': 'EGMH2025.csv',
  'Gielinor Rush (2026-03-06)': 'EGGielinorRush2026.csv',
  'EG Survey (2026-04-04)': 'EGSurveyApr2026.csv',
};

// Tally metadata columns to skip (not actual questions)
const SKIP_COLUMNS = new Set([
  'Submission ID',
  'Respondent ID',
  'Submission Date',
  'Network ID',
  'Custom Variables',
  'Quiz Score',
  'Quiz Max Score',
]);

// Column name fragments that indicate a date/time column
const DATE_COLUMN_HINTS = ['submission date', 'submitted', 'created at', 'date', 'timestamp'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const TEXT_PAGE_SIZE = 10;

function isDateColumn(colName) {
  const lower = colName.toLowerCase();
  return DATE_COLUMN_HINTS.some((hint) => lower.includes(hint));
}

function detectColumnType(values) {
  const nonEmpty = values.filter((v) => v !== '' && v !== null && v !== undefined);
  if (nonEmpty.length === 0) return 'text';
  const unique = new Set(nonEmpty);
  // Multiple choice: few unique values relative to total responses
  if (unique.size <= 10 || unique.size / nonEmpty.length < 0.3) return 'choice';
  return 'text';
}

function buildChoiceData(values) {
  const nonEmpty = values.filter((v) => v !== '' && v !== null && v !== undefined);
  const counts = {};
  for (const v of nonEmpty) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = nonEmpty.length;
  return { options: sorted, total };
}

// --- Multiple Choice Card ---
function MultipleChoiceCard({ question, values }) {
  const { options, total } = buildChoiceData(values);

  return (
    <Box bg="dark.cardBg" borderRadius="12px" p={6} width="100%" maxW="900px">
      <Text fontWeight="bold" fontSize="xl" mb={1}>
        {question}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.500" mb={4}>
        {total} {total === 1 ? 'response' : 'responses'}
      </Text>

      <VStack spacing={2} align="stretch">
        {options.map(([option, count], idx) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Flex key={option} align="center" gap={3}>
              {/* Bar row */}
              <Flex
                flex="1"
                align="center"
                bg="whiteAlpha.100"
                borderRadius="8px"
                overflow="hidden"
                position="relative"
                minH="44px"
              >
                {/* Fill bar */}
                <Box
                  position="absolute"
                  left={0}
                  top={0}
                  bottom={0}
                  width={`${pct}%`}
                  bg="whiteAlpha.200"
                  borderRadius="8px"
                  transition="width 0.4s ease"
                />
                {/* Letter badge */}
                <Flex
                  align="center"
                  justify="center"
                  minW="28px"
                  h="28px"
                  bg="whiteAlpha.300"
                  borderRadius="6px"
                  ml={2}
                  zIndex={1}
                  flexShrink={0}
                >
                  <Text fontSize="xs" fontWeight="bold" lineHeight="1">
                    {LETTERS[idx] ?? idx + 1}
                  </Text>
                </Flex>
                {/* Option text */}
                <Text flex="1" px={3} fontSize="sm" zIndex={1} noOfLines={2}>
                  {option}
                </Text>
                {/* Percentage */}
                <Text fontSize="sm" color="whiteAlpha.700" pr={3} zIndex={1} flexShrink={0}>
                  {pct}%
                </Text>
              </Flex>
              {/* Response count outside bar */}
              <Text
                fontSize="sm"
                color="whiteAlpha.500"
                whiteSpace="nowrap"
                minW="90px"
                textAlign="right"
              >
                {count} {count === 1 ? 'response' : 'responses'}
              </Text>
            </Flex>
          );
        })}
      </VStack>
    </Box>
  );
}

// --- Text Response Card ---
function TextResponseCard({ question, values, dateValues }) {
  const [page, setPage] = useState(0);
  const nonEmpty = values
    .map((v, i) => ({ text: v, date: dateValues?.[i] ?? null }))
    .filter(({ text }) => text !== '' && text !== null && text !== undefined);

  const total = nonEmpty.length;
  const totalPages = Math.ceil(total / TEXT_PAGE_SIZE);
  const pageItems = nonEmpty.slice(page * TEXT_PAGE_SIZE, (page + 1) * TEXT_PAGE_SIZE);

  return (
    <Box bg="dark.cardBg" borderRadius="12px" p={6} width="100%" maxW="900px">
      <Text fontWeight="bold" fontSize="xl" mb={1}>
        {question}
      </Text>
      <Text fontSize="sm" color="whiteAlpha.500" mb={4}>
        {total} {total === 1 ? 'response' : 'responses'}
      </Text>

      <VStack spacing={0} align="stretch">
        {pageItems.map(({ text, date }, idx) => (
          <Box key={idx}>
            <Flex justify="space-between" align="flex-start" py={3} gap={4}>
              <Text fontSize="sm" flex="1" whiteSpace="pre-wrap">
                {text}
              </Text>
              {date && (
                <Text
                  fontSize="xs"
                  color="whiteAlpha.400"
                  whiteSpace="nowrap"
                  flexShrink={0}
                  pt="2px"
                >
                  {date}
                </Text>
              )}
            </Flex>
            {idx < pageItems.length - 1 && <Box h="1px" bg="whiteAlpha.100" />}
          </Box>
        ))}
      </VStack>

      {totalPages > 1 && (
        <Flex align="center" gap={2} mt={4}>
          <Box
            as="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            opacity={page === 0 ? 0.3 : 1}
            cursor={page === 0 ? 'not-allowed' : 'pointer'}
            fontSize="sm"
            px={2}
            py={1}
            borderRadius="4px"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            ←
          </Box>
          {Array.from({ length: totalPages }, (_, i) => (
            <Box
              as="button"
              key={i}
              onClick={() => setPage(i)}
              fontSize="sm"
              fontWeight={i === page ? 'bold' : 'normal'}
              color={i === page ? 'dark.turquoise.base' : 'whiteAlpha.600'}
              px={2}
              py={1}
              borderRadius="4px"
              _hover={{ bg: 'whiteAlpha.100' }}
            >
              {i + 1}
            </Box>
          ))}
          <Box
            as="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            opacity={page === totalPages - 1 ? 0.3 : 1}
            cursor={page === totalPages - 1 ? 'not-allowed' : 'pointer'}
            fontSize="sm"
            px={2}
            py={1}
            borderRadius="4px"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            →
          </Box>
        </Flex>
      )}
    </Box>
  );
}

// --- Individual Responses View ---
function ResponsesView({ questions, dateColValues }) {
  const [idx, setIdx] = useState(0);
  const total = questions[0]?.values.length ?? 0;

  if (total === 0) return null;

  const date = dateColValues?.[idx] ?? null;

  return (
    <Box width="100%" maxW="900px">
      {/* Navigation */}
      <Flex align="center" justify="space-between" mb={6}>
        <Text fontSize="sm" color="whiteAlpha.500">
          {idx + 1} of {total}
        </Text>
        <Flex align="center" gap={2}>
          <Box
            as="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            opacity={idx === 0 ? 0.3 : 1}
            cursor={idx === 0 ? 'not-allowed' : 'pointer'}
            fontSize="lg"
            px={3}
            py={1}
            borderRadius="6px"
            bg="whiteAlpha.100"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            ←
          </Box>
          <Box
            as="button"
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            disabled={idx === total - 1}
            opacity={idx === total - 1 ? 0.3 : 1}
            cursor={idx === total - 1 ? 'not-allowed' : 'pointer'}
            fontSize="lg"
            px={3}
            py={1}
            borderRadius="6px"
            bg="whiteAlpha.100"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            →
          </Box>
        </Flex>
        {date && (
          <Text fontSize="xs" color="whiteAlpha.400">
            {date}
          </Text>
        )}
      </Flex>

      {/* Q&A pairs */}
      <VStack spacing={0} align="stretch">
        {questions.map((q, qi) => {
          const answer = q.values[idx];
          return (
            <Box key={q.name}>
              <Box py={4}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="whiteAlpha.500"
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  {q.name}
                </Text>
                <Text fontSize="md" whiteSpace="pre-wrap">
                  {answer || (
                    <Text as="span" color="whiteAlpha.300">
                      —
                    </Text>
                  )}
                </Text>
              </Box>
              {qi < questions.length - 1 && <Box h="1px" bg="whiteAlpha.100" />}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

// --- Main SurveyViewer ---
export default function SurveyViewer() {
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [dateColValues, setDateColValues] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' | 'responses'

  const surveyEntries = Object.entries(SURVEY_MANIFEST);
  const hasManifest = surveyEntries.length > 0;

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setQuestions([]);
    setDateColValues(null);
    setView('summary');

    fetch(`/surveys/${selected}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load survey (${res.status})`);
        return res.text();
      })
      .then((text) => {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = result.data;
        if (!rows.length) {
          setQuestions([]);
          return;
        }

        const headers = result.meta.fields ?? [];

        const dateCol = headers.find(isDateColumn) ?? null;
        const dateValues = dateCol ? rows.map((r) => r[dateCol]) : null;
        setDateColValues(dateValues);

        const parsed = headers
          .filter((h) => !SKIP_COLUMNS.has(h) && !isDateColumn(h))
          .map((h) => {
            const values = rows.map((r) => (r[h] ?? '').trim());
            const type = detectColumnType(values);
            return { name: h, type, values, dateValues };
          });

        setQuestions(parsed);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selected]);

  const hasData = !loading && !error && questions.length > 0;

  return (
    <Flex
      direction="column"
      align="center"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['32px', '48px']}
      gap={8}
    >
      {/* Controls row */}
      <Flex width="100%" maxW="900px" align="center" justify="space-between" wrap="wrap" gap={3}>
        <Select
          placeholder={hasManifest ? 'Select a survey...' : 'No surveys available yet'}
          isDisabled={!hasManifest}
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          size="md"
          maxW="340px"
        >
          {surveyEntries.map(([name, file]) => (
            <option key={file} value={file}>
              {name}
            </option>
          ))}
        </Select>

        {hasData && (
          <ButtonGroup size="sm" isAttached>
            <Button
              variant={view === 'summary' ? 'solid' : 'outline'}
              onClick={() => setView('summary')}
              borderColor="whiteAlpha.300"
              bg={view !== 'summary' ? 'dark.turquoise.light' : undefined}
              _hover={view !== 'summary' ? { bg: 'dark.turquoise.base' } : undefined}
            >
              Summary
            </Button>
            <Button
              variant={view === 'responses' ? 'solid' : 'outline'}
              onClick={() => setView('responses')}
              borderColor="whiteAlpha.300"
              bg={view !== 'responses' ? 'dark.turquoise.light' : undefined}
              _hover={view !== 'responses' ? { bg: 'dark.turquoise.base' } : undefined}
            >
              Responses
            </Button>
          </ButtonGroup>
        )}
      </Flex>

      {/* Content */}
      {loading && (
        <Center py={16}>
          <Spinner size="lg" />
        </Center>
      )}

      {error && (
        <Text color="dark.red.base" fontSize="sm">
          {error}
        </Text>
      )}

      {hasData && view === 'summary' && (
        <VStack spacing={6} width="100%" align="center">
          {questions.filter((q) => !q.name.toLowerCase().startsWith('optional')).map((q) =>
            q.type === 'choice' ? (
              <MultipleChoiceCard key={q.name} question={q.name} values={q.values} />
            ) : (
              <TextResponseCard
                key={q.name}
                question={q.name}
                values={q.values}
                dateValues={q.dateValues}
              />
            )
          )}
        </VStack>
      )}

      {hasData && view === 'responses' && (
        <ResponsesView questions={questions} dateColValues={dateColValues} />
      )}

      {!loading && !error && selected && questions.length === 0 && (
        <Text color="whiteAlpha.500" fontSize="sm">
          No questions found in this survey.
        </Text>
      )}
    </Flex>
  );
}
