import { Flex } from '@chakra-ui/react';
import React from 'react';

const Section = ({ children, ...props }) => {
  return (
    <Flex
      backgroundColor="rgba(93, 61, 172, 0.3)"
      borderRadius="8px"
      boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
      padding="24px"
      {...props}
    >
      {children}
    </Flex>
  );
};

export default Section;
