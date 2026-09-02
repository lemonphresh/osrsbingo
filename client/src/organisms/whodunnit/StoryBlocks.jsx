import React from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';
import { WD_COLORS, WD_FONTS } from './whodunnitTheme';

// Renders the "blocks" array on story nodes. Each block gets a distinct
// treatment so different kinds of content read as different desk items:
//
//   scene            → italic serif narration on the leather (novel voice)
//   watson           → typed dictation card, cream on manila, wax-red mark
//   watson_stage     → same, with a stage direction next to Watson's name
//   character        → typewriter POV — first-person, straight prose
//   character_aside  → handwritten margin scribble in Caveat, brass ink
//   snowflake        → typed dictation card in fountain-teal
//   snowflake_stage  → same, with stage direction
//   stage_direction  → parenthetical action beat in Caveat, muted

// ── Speaker card (used for Watson / Snowflake dialogue) ────────────────
function DialogueCard({ label, stage, text, accent }) {
  return (
    <Box
      position="relative"
      bg="rgba(239, 228, 201, 0.06)"
      borderLeft="3px solid"
      borderLeftColor={accent}
      py={3}
      pl={4}
      pr={3}
      borderRadius="0 3px 3px 0"
    >
      <HStack spacing={2} mb={1.5}>
        <Text
          fontFamily={WD_FONTS.typewriter}
          fontSize="10px"
          fontWeight="bold"
          letterSpacing="0.3em"
          color={accent}
          textTransform="uppercase"
        >
          {label}
        </Text>
        {stage && (
          <Text
            fontFamily={WD_FONTS.hand}
            fontSize="md"
            color={WD_COLORS.brass}
            fontStyle="italic"
            lineHeight="1"
          >
            ({stage})
          </Text>
        )}
      </HStack>
      <Text
        color={WD_COLORS.paper}
        fontFamily={WD_FONTS.typewriter}
        whiteSpace="pre-wrap"
        lineHeight="1.7"
        sx={{
          '& strong': { color: WD_COLORS.brassLight, fontWeight: 'bold' },
          '& em': { fontStyle: 'italic', color: WD_COLORS.paperShadow },
        }}
      >
        {formatInline(text)}
      </Text>
    </Box>
  );
}

function Block({ block }) {
  switch (block.speaker) {
    case 'watson':
      return <DialogueCard label="Watson" text={block.text} accent={WD_COLORS.waxHighlight} />;
    case 'watson_stage':
      return (
        <DialogueCard
          label="Watson"
          stage={block.stage}
          text={block.text}
          accent={WD_COLORS.waxHighlight}
        />
      );
    case 'snowflake':
      return <DialogueCard label="Snowflake" text={block.text} accent={WD_COLORS.fountain} />;
    case 'snowflake_stage':
      return (
        <DialogueCard
          label="Snowflake"
          stage={block.stage}
          text={block.text}
          accent={WD_COLORS.fountain}
        />
      );

    case 'character':
      // First-person straight prose, typewritten. Feels like a field agent's
      // dictated observation — no speaker label, just the line.
      return (
        <Text
          color={WD_COLORS.paper}
          fontFamily={WD_FONTS.typewriter}
          whiteSpace="pre-wrap"
          lineHeight="1.7"
          pl={2}
          sx={{
            '& strong': { color: WD_COLORS.brassLight, fontWeight: 'bold' },
          }}
        >
          {formatInline(block.text)}
        </Text>
      );

    case 'character_aside':
      // Internal monologue — bigger handwritten scrawl in brass ink, no
      // background. Like a note the character jotted in the margin.
      return (
        <Box pl={4} borderLeft="2px dashed" borderLeftColor="rgba(163, 122, 45, 0.4)">
          <Text
            color={WD_COLORS.brassLight}
            fontFamily={WD_FONTS.hand}
            fontSize="xl"
            fontStyle="italic"
            whiteSpace="pre-wrap"
            lineHeight="1.35"
            sx={{
              '& strong': { color: WD_COLORS.paper, fontWeight: 'bold' },
              '& em': { fontStyle: 'italic' },
            }}
          >
            {formatInline(block.text)}
          </Text>
        </Box>
      );

    case 'stage_direction':
      return (
        <Text
          textAlign="center"
          color={WD_COLORS.brass}
          fontFamily={WD_FONTS.hand}
          fontSize="lg"
          fontStyle="italic"
          opacity={0.75}
          py={1}
        >
          {block.text}
        </Text>
      );

    case 'scene':
    default:
      // Narrator voice — italic serif on the leather. No card, feels like
      // reading a novel paragraph.
      return (
        <Text
          color={WD_COLORS.paper}
          fontFamily={WD_FONTS.heading}
          fontStyle="italic"
          fontSize="md"
          whiteSpace="pre-wrap"
          lineHeight="1.8"
          sx={{
            '& strong': { fontStyle: 'normal', color: WD_COLORS.brassLight, fontWeight: 'bold' },
            '& em': { fontStyle: 'italic' },
          }}
        >
          {formatInline(block.text)}
        </Text>
      );
  }
}

// Very lightweight markdown-ish renderer: **bold** and _italic_.
function formatInline(text) {
  if (!text) return null;
  const parts = [];
  let remaining = text;
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/;
  let i = 0;
  while (remaining) {
    const m = remaining.match(re);
    if (!m) {
      parts.push(<span key={i++}>{remaining}</span>);
      break;
    }
    const idx = m.index;
    if (idx > 0) parts.push(<span key={i++}>{remaining.slice(0, idx)}</span>);
    const tok = m[0];
    if (tok.startsWith('**')) {
      parts.push(<strong key={i++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={i++}>{tok.slice(1, -1)}</em>);
    }
    remaining = remaining.slice(idx + tok.length);
  }
  return parts;
}

const StoryBlocks = ({ blocks }) => {
  if (!blocks || !blocks.length) return null;
  return (
    <VStack spacing={5} align="stretch">
      {blocks.map((b, i) => (
        <Block key={i} block={b} />
      ))}
    </VStack>
  );
};

export default StoryBlocks;
export { formatInline };
