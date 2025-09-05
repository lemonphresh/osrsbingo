/* CalendarGlobal.jsx */
import { Global, css } from '@emotion/react';
import { useColorModeValue, useTheme } from '@chakra-ui/react';

export default function CalendarGlobal() {
  const theme = useTheme();
  const palette = useColorModeValue(theme.colors.light, theme.colors.dark);

  return (
    <Global
      styles={css`
        /* Entire grid background */
        .rbc-month-view,
        .rbc-time-view,
        .rbc-agenda-view {
          background: ${palette.background};
          color: ${palette.textColor};
          border-radius: 10px;
        }

        /* Each day cell */
        .rbc-day-bg {
          background: ${palette.navAndFooter}; /* softer surface */
        }

        /* Today highlight */
        .rbc-today {
          background: ${palette.yellow.light};
        }

        /* Off-range days (previous/next month in grid) */
        .rbc-off-range-bg {
          background: ${palette.sandyBrown.light};
          opacity: 0.2;
        }

        /* Grid borders */
        .rbc-month-row,
        .rbc-time-content,
        .rbc-agenda-content,
        .rbc-day-bg + .rbc-day-bg {
          border-color: ${useColorModeValue('#E2E8F0', '#2D3748')};
        }
      `}
    />
  );
}
