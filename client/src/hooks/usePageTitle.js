import { useEffect, useRef } from 'react';

const BASE_TITLE = 'OSRS Bingo Hub';

/**
 * Sets the document title dynamically.
 * Resets to base title on unmount (not previous title, to avoid conflicts).
 *
 * @param {string|null} title - Page-specific title (null = base title only)
 * @param {object} options
 * @param {boolean} options.includeBase - Whether to append base title (default: true)
 * @param {string} options.separator - Separator between title and base (default: ' | ')
 */
export const usePageTitle = (title, options = {}) => {
  const { includeBase = true, separator = ' | ' } = options;
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Skip the first render's cleanup to avoid race conditions
    isFirstMount.current = false;

    if (title) {
      document.title = includeBase ? `${title}${separator}${BASE_TITLE}` : title;
    } else {
      document.title = BASE_TITLE;
    }

    // Reset to base on unmount (not previous, to avoid conflicts with other hooks)
    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, includeBase, separator]);
};

export default usePageTitle;
