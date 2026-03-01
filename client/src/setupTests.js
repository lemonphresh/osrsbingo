// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Suppress React warnings about Chakra-specific props leaking onto native DOM elements
// (caused by the { ...props } spread in the Chakra mock's `make` factory)
const originalConsoleError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('React does not recognize the')) return;
  if (typeof args[0] === 'string' && args[0].includes('ReactDOMTestUtils.act')) return;
  if (typeof args[0] === 'string' && args[0].includes('Function components cannot be given refs')) return;
  if (typeof args[0] === 'string' && args[0].includes('go.apollo.dev')) return;
  originalConsoleError(...args);
};

// jsdom doesn't implement matchMedia; Chakra UI requires it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
