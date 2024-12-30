import { useMemo } from 'react';
import theme from '../theme';

const useBingoTileTheme = (themeName = 'DEFAULT') => {
  const tileTheme = useMemo(() => {
    const colorMapping = {
      DEFAULT: {
        hoverBackgroundColor: theme.colors.blue[500],
        backgroundColor: theme.colors.blue[600],
        completeBackgroundColor: theme.colors.green[400],
        completeHoverBackgroundColor: theme.colors.green[300],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      blue: {
        hoverBackgroundColor: theme.colors.blue[400],
        backgroundColor: theme.colors.blue[500],
        completeBackgroundColor: theme.colors.orange[200],
        completeHoverBackgroundColor: theme.colors.orange[100],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      green: {
        hoverBackgroundColor: theme.colors.green[400],
        backgroundColor: theme.colors.green[500],
        completeBackgroundColor: theme.colors.green[200],
        completeHoverBackgroundColor: theme.colors.green[100],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      purple: {
        hoverBackgroundColor: theme.colors.purple[500],
        backgroundColor: theme.colors.purple[600],
        completeBackgroundColor: theme.colors.pink[300],
        completeHoverBackgroundColor: theme.colors.pink[200],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      teal: {
        hoverBackgroundColor: theme.colors.teal[500],
        backgroundColor: theme.colors.teal[600],
        completeBackgroundColor: theme.colors.blue[300],
        completeHoverBackgroundColor: theme.colors.blue[200],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      red: {
        hoverBackgroundColor: theme.colors.red[600],
        backgroundColor: theme.colors.red[700],
        completeBackgroundColor: theme.colors.red[300],
        completeHoverBackgroundColor: theme.colors.red[200],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      cyan: {
        hoverBackgroundColor: theme.colors.cyan[500],
        backgroundColor: theme.colors.cyan[600],
        completeBackgroundColor: theme.colors.gray[300],
        completeHoverBackgroundColor: theme.colors.gray[200],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      orange: {
        hoverBackgroundColor: theme.colors.orange[400],
        backgroundColor: theme.colors.orange[500],
        completeBackgroundColor: theme.colors.yellow[300],
        completeHoverBackgroundColor: theme.colors.yellow[200],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      yellow: {
        hoverBackgroundColor: theme.colors.yellow[400],
        backgroundColor: theme.colors.yellow[500],
        completeBackgroundColor: theme.colors.gray[100],
        completeHoverBackgroundColor: theme.colors.gray[300],
        textColor: theme.colors.gray[800],
        completeTextColor: theme.colors.gray[800],
      },
      pink: {
        hoverBackgroundColor: theme.colors.pink[500],
        backgroundColor: theme.colors.pink[600],
        completeBackgroundColor: theme.colors.pink[200],
        completeHoverBackgroundColor: theme.colors.pink[100],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
      gray: {
        hoverBackgroundColor: theme.colors.gray[500],
        backgroundColor: theme.colors.gray[600],
        completeBackgroundColor: theme.colors.yellow[400],
        completeHoverBackgroundColor: theme.colors.yellow[300],
        textColor: theme.colors.white,
        completeTextColor: theme.colors.gray[800],
      },
    };

    return colorMapping[themeName] || colorMapping.DEFAULT;
  }, [themeName]);

  return tileTheme;
};

export default useBingoTileTheme;
