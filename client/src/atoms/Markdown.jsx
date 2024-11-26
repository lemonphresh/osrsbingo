/* eslint-disable jsx-a11y/heading-has-content */
/* eslint-disable jsx-a11y/anchor-has-content */
import { Box, Heading } from '@chakra-ui/react';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import theme from '../theme';

const Markdown = ({ text }) => {
  return (
    <ReactMarkdown
      children={text}
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }) => <Heading as="h1" fontSize="28px" marginY="16px" {...props} />,
        h2: ({ node, ...props }) => <Heading as="h2" fontSize="24px" marginY="16px" {...props} />,
        h3: ({ node, ...props }) => <Heading as="h3" fontSize="22px" marginY="16px" {...props} />,
        h4: ({ node, ...props }) => <Heading as="h4" fontSize="20px" marginY="16px" {...props} />,
        h5: ({ node, ...props }) => <Heading as="h5" fontSize="18px" marginY="16px" {...props} />,
        h6: ({ node, ...props }) => <Heading as="h6" fontSize="16px" marginY="16px" {...props} />,
        p: ({ node, ...props }) => (
          <p
            style={{
              fontSize: '16px',
              marginBottom: '8px',
            }}
            {...props}
          />
        ),
        a: ({ node, ...props }) => (
          <a style={{ color: '#3182CE', textDecoration: 'underline' }} {...props} />
        ),
        ul: ({ node, ...props }) => (
          <ul style={{ marginLeft: '32px', marginBottom: '16px' }} {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol style={{ marginLeft: '32px', marginBottom: '16px' }} {...props} />
        ),
        hr: () => (
          <Box
            borderTop={`2px dotted ${theme.colors.gray[300]}`}
            height="1px"
            marginY="24px"
            width="100%"
          />
        ),
        blockquote: ({ node, ...props }) => (
          <Box
            paddingLeft="8px"
            marginLeft="24px"
            marginY="16px"
            borderLeft="1px solid white"
            {...props}
          />
        ),
        code: ({ node, ...props }) => (
          <code
            style={{
              backgroundColor: 'rgba(255, 255, 255,0.1)',
              padding: '1px',
              borderRadius: '5px',
            }}
            {...props}
          />
        ),
        br: ({ node, ...props }) => <Box height="16px" width="100%" {...props} />,
      }}
    />
  );
};

export default Markdown;
