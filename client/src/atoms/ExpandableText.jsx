import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flex, Button, Collapse } from '@chakra-ui/react';
import Markdown from './Markdown';
import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

const ExpandableText = ({ text, limit = 180, startingHeight = 110 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const contentRef = useRef(null);

  const toggleExpansion = () => setIsExpanded(!isExpanded);

  const checkLimit = useCallback(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const exceedsHeight = contentHeight > startingHeight;
      const exceedsTextLimit = text.length > limit;

      setShowButton(exceedsHeight || exceedsTextLimit);
    }
  }, [text, limit, startingHeight]);

  useEffect(() => {
    checkLimit();

    const images = contentRef.current?.querySelectorAll('img') || [];
    const handleImageLoad = () => checkLimit();

    images.forEach((img) => img.addEventListener('load', handleImageLoad));
    return () => {
      images.forEach((img) => img.removeEventListener('load', handleImageLoad));
    };
  }, [text, checkLimit]);

  return (
    <Flex flexDirection="column" maxWidth={['100%', '720px']} width="100%">
      <Collapse
        css={{
          maxHeight: isExpanded ? 'none' : `${startingHeight}px`,
        }}
        animateOpacity
        startingHeight={`${startingHeight}px`}
        in={isExpanded}
        width="100%"
      >
        <div ref={contentRef}>
          <Markdown text={text} />
        </div>
      </Collapse>
      {showButton && (
        <Button
          _hover={{
            color: 'white',
          }}
          color="white"
          leftIcon={isExpanded ? <MdArrowUpward /> : <MdArrowDownward />}
          onClick={toggleExpansion}
          margin="0 auto"
          marginTop="24px"
          size="sm"
          variant="outline"
        >
          {isExpanded ? 'Show Less' : 'Read More'}
        </Button>
      )}
    </Flex>
  );
};

export default ExpandableText;
