import '@testing-library/jest-dom';

// Mock window.location for React Router testing
delete window.location;
window.location = { 
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  reload: jest.fn(),
  assign: jest.fn(),
  replace: jest.fn()
};

// Mock localStorage with Jest functions
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.alert
global.alert = jest.fn();

// Mock fetch
global.fetch = jest.fn();

// Mock HTML5 file APIs
Object.defineProperty(global, 'File', {
  value: class MockFile {
    constructor(bits, name, options = {}) {
      this.bits = bits;
      this.name = name;
      this.size = bits.length;
      this.type = options.type || '';
      this.lastModified = Date.now();
    }
  }
});

Object.defineProperty(global, 'FileReader', {
  value: class MockFileReader {
    constructor() {
      this.result = null;
      this.error = null;
      this.readyState = 0;
      this.onload = null;
      this.onerror = null;
    }
    
    readAsDataURL() {
      this.readyState = 2;
      this.result = 'data:image/png;base64,mock-base64-data';
      if (this.onload) this.onload();
    }
    
    readAsText() {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload();
    }
  }
});

// Mock console.log to reduce noise in tests
const originalConsoleLog = console.log;
console.log = (...args) => {
  // Only show console.log in tests if it contains 'TEST:' prefix
  if (args.some(arg => typeof arg === 'string' && arg.includes('TEST:'))) {
    originalConsoleLog(...args);
  }
};
