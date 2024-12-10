import { Flex } from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';

const Section = ({ children, ...props }) => {
  return (
    <Flex
      backgroundColor="rgba(0, 200, 200, 0.3)"
      borderRadius="8px"
      boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
      fontFamily={theme.fonts.introText}
      padding="24px"
      {...props}
    >
      {children}
    </Flex>
  );
};

export default Section;
