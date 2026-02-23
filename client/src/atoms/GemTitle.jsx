import { Box, Flex, Heading, Image } from '@chakra-ui/react';
import React from 'react';
import EternalGem from '../assets/gemoji.png';
import theme from '../theme';

const GemTitle = ({ children, gemColor = 'default', size = 'md', ...props }) => {
  let iconHW;
  let fontSize;
  let highlightHeight;
  let imgFilter;

  switch (size) {
    case 'sm':
      fontSize = ['16px', '18px', '20px'];
      iconHW = ['14px', '16px'];
      highlightHeight = '9px';
      break;
    case 'md':
      fontSize = ['24px', '28px', '32px'];
      iconHW = ['22px', '26px'];
      highlightHeight = '11px';
      break;
    case 'lg':
      fontSize = ['32px', '36px', '40px'];
      iconHW = ['28px', '34px'];
      highlightHeight = '13px';
      break;
    default:
      fontSize = ['24px', '28px', '32px'];
      iconHW = ['22px', '26px'];
      highlightHeight = '11px';
  }

  switch (gemColor) {
    case 'blue':
      imgFilter = 'hue-rotate(40deg)';
      break;
    case 'purple':
      imgFilter = 'hue-rotate(120deg)';
      break;
    case 'green':
      imgFilter = 'hue-rotate(300deg)';
      break;
    case 'orange':
      imgFilter = 'hue-rotate(180deg)';
      break;
    default:
      imgFilter = null;
  }

  const highlightColor =
    gemColor !== 'default' ? theme.colors[gemColor][300] : theme.colors.pink[300];

  return (
    <Flex alignItems="flex-start" justifyContent="center" marginBottom="16px" {...props}>
      <Image
        aria-hidden
        filter={imgFilter}
        height={iconHW}
        marginRight="12px"
        src={EternalGem}
        transform="scaleX(-1)"
        width={iconHW}
      />
      <Box position="relative" paddingBottom="14px">
        {/* Brushstroke highlight behind text */}
        <Box
          position="absolute"
          bottom="13px"
          left="5%"
          width="90%"
          height={highlightHeight}
          backgroundColor={highlightColor}
          opacity={0.35}
          transform="skewX(-12deg)"
          borderRadius="2px 8px 2px 8px"
        />
        <Heading
          color={props.color ? props.color : theme.colors.white}
          fontSize={fontSize}
          fontFamily="'Raleway', sans-serif"
          fontWeight="semibold"
          wordBreak="break-word"
          position="relative"
          width="fit-content"
        >
          {children}
        </Heading>
      </Box>
      <Image
        aria-hidden
        filter={imgFilter}
        height={iconHW}
        marginLeft="12px"
        src={EternalGem}
        width={iconHW}
      />
    </Flex>
  );
};

export default GemTitle;
