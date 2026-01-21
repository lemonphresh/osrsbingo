// hooks/useThemeColors.js
import { useTheme, useColorMode } from '@chakra-ui/react';

/**
 * Custom hook to access theme colors based on current color mode
 * @returns {Object} Object containing:
 *   - colors: Current color palette based on color mode
 *   - colorMode: Current color mode ('light' or 'dark')
 *   - theme: Full theme object
 *   - toggleColorMode: Function to toggle between light/dark modes
 */
export const useThemeColors = () => {
  const theme = useTheme();
  const { colorMode, toggleColorMode } = useColorMode();

  // Get colors for current color mode
  const colors = theme.colors[colorMode];

  return {
    colors,
    colorMode,
    theme,
    toggleColorMode,
  };
};

// Alias for backward compatibility
export const useCurrentColors = useThemeColors;
