import { Flex, Heading, Image } from '@chakra-ui/react';
import React from 'react';
import EternalGem from '../assets/gemoji.png';
import theme from '../theme';

const GemTitle = ({ children, gemColor = 'default', size = 'md', ...props }) => {
  let iconHW;
  let fontSize;
  let imgFilter;

  switch (size) {
    case 'sm':
      fontSize = ['16px', '18px', '20px'];
      iconHW = ['20px', '24px'];
      break;
    case 'md':
      fontSize = ['24px', '28px', '32px'];
      iconHW = ['32px', '40px'];
      break;
    case 'lg':
      fontSize = ['32px', '36px', '40px'];
      iconHW = ['40px', '48px'];
      break;
    default:
      fontSize = ['24px', '28px', '32px'];
      iconHW = ['32px', '40px'];
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

  return (
    <Flex alignItems="flex-start" justifyContent="space-between" marginBottom="16px" {...props}>
      <Image
        aria-hidden
        filter={imgFilter}
        height={iconHW}
        marginRight="12px"
        src={EternalGem}
        transform="scaleX(-1)"
        width={iconHW}
      />
      <Heading
        color={theme.colors.white}
        fontSize={fontSize}
        wordBreak="break-word"
        paddingBottom="16px"
        position="relative"
        width="fit-content"
        zIndex="0"
        _after={{
          backgroundColor:
            gemColor !== 'default' ? theme.colors[gemColor][400] : theme.colors.pink[300],
          bottom: '6px',
          opacity: 0.7,
          content: `""`,
          height: fontSize,
          left: '90%',
          position: 'absolute',
          transform: 'skew(-12deg) translateX(-90%)',
          width: '80%',
          zIndex: -1,
        }}
      >
        {children}
      </Heading>
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
