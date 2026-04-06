import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';

const PleaseEffect = ({ children, direction = 'up' }) => {
  const [pleases, setPleases] = useState([]);
  const [hovered, setHovered] = useState(false);
  const intervalRef = useRef(null);
  const idRef = useRef(0);

  useEffect(() => {
    if (hovered) {
      intervalRef.current = setInterval(() => {
        const id = idRef.current++;
        const x = Math.random() * 80 + 10; // 10–90% horizontally
        setPleases((prev) => [...prev, { id, x }]);
        setTimeout(() => {
          setPleases((prev) => prev.filter((p) => p.id !== id));
        }, 1000);
      }, 180);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [hovered]);

  return (
    <Box
      position="relative"
      display="inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {pleases.map(({ id, x }) => (
        <Box
          key={id}
          position="absolute"
          {...(direction === 'down' ? { top: '100%' } : { bottom: '100%' })}
          left={`${x}%`}
          transform="translateX(-50%)"
          fontSize="11px"
          fontWeight="semibold"
          color="yellow.300"
          pointerEvents="none"
          userSelect="none"
          animation={`pleaseFloat${direction === 'down' ? 'Down' : 'Up'} 1s ease-out forwards`}
          sx={{
            '@keyframes pleaseFloatUp': {
              '0%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
              '100%': { opacity: 0, transform: 'translateX(-50%) translateY(-28px)' },
            },
            '@keyframes pleaseFloatDown': {
              '0%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' },
              '100%': { opacity: 0, transform: 'translateX(-50%) translateY(28px)' },
            },
          }}
        >
          PLEASE
        </Box>
      ))}
    </Box>
  );
};

export default PleaseEffect;
