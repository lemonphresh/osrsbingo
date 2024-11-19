import { Flex, Heading, Image } from '@chakra-ui/react';
import React from 'react';
import EternalGem from '../assets/gemoji.png';
import theme from '../theme';

const GemTitle = ({ children, ...props }) => {
  return (
    <Flex alignItems="flex-start" justifyContent="space-between" marginBottom="24px" {...props}>
      <Image
        aria-hidden
        height={['32px', '40px']}
        marginRight="12px"
        src={EternalGem}
        transform="scaleX(-1)"
        width={['32px', '40px']}
      />
      <Heading color={theme.colors.white} fontSize={['24px', '28px', '32px']} textAlign="center">
        {children}
      </Heading>
      <Image
        aria-hidden
        height={['32px', '40px']}
        marginLeft="12px"
        src={EternalGem}
        width={['32px', '40px']}
      />
    </Flex>
  );
};

export default GemTitle;
