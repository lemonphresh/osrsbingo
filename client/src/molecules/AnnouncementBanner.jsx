import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text, VStack, Collapse, IconButton } from '@chakra-ui/react';
import { MdClose } from 'react-icons/md';

// Generic dismissible announcement banner. Reusable anywhere you want to
// call attention to a seasonal event, new feature, etc. Dismisses via
// localStorage keyed by `storageKey`, and re-appears after `durationMs`
// (default 30 days) so long-running events don't stay hidden forever.
//
// Props:
//   visible       — outer gate. If false, banner never renders.
//   storageKey    — localStorage key used to remember dismissal.
//   durationMs    — how long a dismissal lasts (ms). Default 24h.
//   background    — CSS background (gradient or solid).
//   borderColor   — bottom border accent.
//   eyebrow       — small caps label above the title (i.e. "🎁 Seasonal").
//   title         — main title (string or ReactNode).
//   titleColor    — override title accent color.
//   body          — description paragraph.
//   ctaTo         — router path for the CTA button.
//   ctaLabel      — CTA button text.
//   ctaBg / ctaHoverBg / ctaColor / ctaBorder — CTA button colors.
//   maxW          — max width of the inner content. Default 950px.

const DEFAULT_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

const AnnouncementBanner = ({
  visible = true,
  storageKey,
  durationMs = DEFAULT_DURATION_MS,
  background,
  borderColor,
  eyebrow,
  title,
  titleColor = '#e6c976',
  body,
  ctaTo,
  ctaLabel,
  ctaBg = '#9e2a2e',
  ctaHoverBg = '#c44046',
  ctaColor = '#f4ead0',
  ctaBorder,
  maxW = '950px',
  marginBottom = '24px',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!storageKey) {
      setIsOpen(true);
      return;
    }
    const ts = localStorage.getItem(storageKey);
    if (ts) {
      if (Date.now() - parseInt(ts, 10) >= durationMs) {
        localStorage.removeItem(storageKey);
        setIsOpen(true);
      }
    } else {
      setIsOpen(true);
    }
  }, [storageKey, durationMs]);

  const handleClose = () => {
    setIsOpen(false);
    if (storageKey) localStorage.setItem(storageKey, Date.now().toString());
  };

  if (!visible) return null;

  return (
    <Collapse in={isOpen} animateOpacity>
      <Box
        background={background}
        borderRadius="lg"
        border="1px solid"
        borderColor={borderColor}
        color="white"
        paddingX={['14px', '24px']}
        paddingY="14px"
        // Extra right padding on mobile so the close X doesn't sit over the
        // title text.
        paddingRight={['40px', '24px']}
        position="relative"
        marginBottom={marginBottom}
        boxShadow="0 6px 20px rgba(0,0,0,0.35)"
      >
        <IconButton
          aria-label="Dismiss announcement"
          position="absolute"
          right={2}
          top={2}
          icon={<MdClose />}
          size="sm"
          variant="ghost"
          color="white"
          opacity={0.5}
          onClick={handleClose}
          _hover={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}
        />
        <Flex
          direction={['column', 'row']}
          alignItems={['stretch', 'center']}
          gap={[3, 5]}
          maxW={maxW}
          margin="0 auto"
        >
          <VStack align="start" spacing={1} flex={1} minW={0}>
            {eyebrow && (
              <Text
                fontSize="10px"
                fontWeight="bold"
                letterSpacing="0.2em"
                textTransform="uppercase"
                color={titleColor}
                opacity={0.85}
              >
                {eyebrow}
              </Text>
            )}
            {title && (
              <Text fontSize={['sm', 'md']} fontWeight="bold">
                <Text as="span" color={titleColor}>
                  {title}
                </Text>
              </Text>
            )}
            {body && (
              <Text fontSize={['xs', 'sm']} opacity={0.85}>
                {body}
              </Text>
            )}
          </VStack>
          {ctaTo && ctaLabel && (
            <Box flexShrink={0} w={['100%', 'auto']}>
              <Link to={ctaTo} style={{ display: 'block', width: '100%' }}>
                <Flex
                  as="span"
                  align="center"
                  justify="center"
                  gap={2}
                  backgroundColor={ctaBg}
                  border="1px solid"
                  borderColor={ctaBorder || ctaBg}
                  color={ctaColor}
                  paddingX={5}
                  paddingY={2}
                  borderRadius="md"
                  fontWeight="semibold"
                  fontSize="sm"
                  _hover={{ backgroundColor: ctaHoverBg }}
                  whiteSpace="nowrap"
                  w="100%"
                >
                  {ctaLabel}
                </Flex>
              </Link>
            </Box>
          )}
        </Flex>
      </Box>
    </Collapse>
  );
};

export default AnnouncementBanner;
