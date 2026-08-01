import { useState, useEffect } from 'react';
import { Box } from '@chakra-ui/react';

export default function FloatingEmote({ emote, x, y, onDone }) {
  const [visible, setVisible] = useState(true);
  const [top, setTop] = useState(y);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setVisible(false);
      setTop(y - 120);
    }, 50);
    const t2 = setTimeout(onDone, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone, y]);

  return (
    <Box
      position="absolute"
      left={`${x}%`}
      top={`${top}px`}
      fontSize="28px"
      opacity={visible ? 1 : 0}
      transition="top 1.1s ease-out, opacity 1.1s ease-out"
      pointerEvents="none"
      userSelect="none"
      zIndex={10}
    >
      {emote}
    </Box>
  );
}
