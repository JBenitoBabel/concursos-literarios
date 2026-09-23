import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

/// <reference types="jest" />

const util = require('util');
(globalThis as any).TextEncoder = util.TextEncoder;
(globalThis as any).TextDecoder = util.TextDecoder;

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

Object.defineProperty(window, 'matchMedia', {
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  })),
  writable: true
});

(window as any).scrollTo = jest.fn();