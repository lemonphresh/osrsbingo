import { useState, useEffect } from 'react';

const useCompletedTileGlow = (direction) => {
  const [glowColor, setGlowColor] = useState('');
  console.log({ direction });
  useEffect(() => {
    switch (direction) {
      case 'horizontal':
        setGlowColor('0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 150, 150, 0.7)');
        break;
      case 'vertical':
        setGlowColor('0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 150, 255, 0.7)');
        break;
      case 'diagonal':
        setGlowColor('0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 255, 150, 0.7)');
        break;
      case 'horizontal-vertical':
        setGlowColor(
          '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 150, 150, 0.7), ' +
            '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 150, 255, 0.7)'
        );
        break;
      case 'horizontal-diagonal':
        setGlowColor(
          '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 150, 150, 0.7), ' +
            '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 255, 150, 0.7)'
        );
        break;
      case 'vertical-diagonal':
        setGlowColor(
          '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 150, 255, 0.7), ' +
            '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 255, 150, 0.7)'
        );
        break;
      case 'all':
        setGlowColor(
          '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 150, 150, 0.7), ' +
            '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 150, 255, 0.7), ' +
            '0 0 4px rgba(255, 255, 255, 0.8), 0 0 20px rgba(150, 255, 150, 0.7)'
        );
        break;
      default:
        setGlowColor('');
    }
  }, [direction]);

  return glowColor;
};

export default useCompletedTileGlow;
