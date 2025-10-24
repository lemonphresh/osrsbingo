import React, { useRef, useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';

/**
 * TableContainer with scroll gradient indicators
 * Shows gradients on left/right edges when there's more content to scroll
 */
export const ScrollableTableContainer = ({ children, ...props }) => {
  const scrollRef = useRef(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: true,
  });

  const updateScrollState = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setScrollState({
      canScrollLeft: scrollLeft > 0,
      canScrollRight: scrollLeft < scrollWidth - clientWidth - 5, // 5px threshold
    });
  };

  useEffect(() => {
    updateScrollState();
    const container = scrollRef.current;

    if (container) {
      container.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState);

      return () => {
        container.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [children]);

  return (
    <Box position="relative" width="100%">
      {/* Left gradient indicator */}
      {scrollState.canScrollLeft && (
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          width={['40px', '72px']}
          bgGradient="linear(to-r, blackAlpha.400, transparent)"
          pointerEvents="none"
          zIndex={2}
          transition="opacity 0.2s"
        />
      )}

      {/* Right gradient indicator */}
      {scrollState.canScrollRight && (
        <Box
          position="absolute"
          right={0}
          top={0}
          bottom={0}
          width={['40px', '72px']}
          bgGradient="linear(to-l, blackAlpha.400, transparent)"
          pointerEvents="none"
          zIndex={2}
          transition="opacity 0.2s"
        />
      )}

      {/* Scrollable container */}
      <Box
        ref={scrollRef}
        overflowX="auto"
        overflowY="hidden"
        width="100%"
        sx={{
          '&::-webkit-scrollbar': {
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(255, 255, 255, 0.4)',
          },
        }}
        {...props}
      >
        {children}
      </Box>
    </Box>
  );
};

export default ScrollableTableContainer;
