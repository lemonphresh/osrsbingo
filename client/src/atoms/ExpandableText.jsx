import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flex, Button, Collapse } from '@chakra-ui/react';
import Markdown from './Markdown';

const ExpandableText = ({ text, limit = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef(null);

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  const checkContentHeight = useCallback(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setShowButton(contentHeight > limit);
    }
  }, [limit]);

  useEffect(() => {
    checkContentHeight();
  }, [text, checkContentHeight]);

  return (
    <Flex flexDirection="column" maxWidth={['100%', '720px']} width="100%">
      <Collapse
        css={{
          maxHeight: isExpanded ? 'none' : '8rem',
        }}
        animateOpacity
        startingHeight="8rem"
        in={isExpanded}
        width="100%"
      >
        <div ref={contentRef}>
          <Markdown text={text} />
        </div>
      </Collapse>
      {showButton && (
        <Button onClick={toggleExpansion} margin="0 auto" marginTop="24px" size="sm">
          {isExpanded ? '⬆️ Show Less' : '⬇️ Read More'}
        </Button>
      )}
    </Flex>
  );
};

export default ExpandableText;
