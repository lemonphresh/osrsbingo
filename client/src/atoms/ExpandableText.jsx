import React, { useState } from 'react';
import { Flex, Button, Collapse } from '@chakra-ui/react';
import Markdown from './Markdown';

const ExpandableText = ({ text, limit = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  return (
    <Flex flexDirection="column" maxWidth="720px" width="100%">
      <Collapse startingHeight="8rem" in={isExpanded}>
        <Markdown text={text} />
      </Collapse>
      {text.length > limit && (
        <Button onClick={toggleExpansion} margin="0 auto" marginTop="24px" size="sm">
          {isExpanded ? '⬆️ Show Less' : '⬇️ Read More'}
        </Button>
      )}
    </Flex>
  );
};

export default ExpandableText;
