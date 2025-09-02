/**
 * Comprehensive Console Disabling for Production Builds
 * 
 * This utility completely disables all console methods in production
 * to improve performance and prevent any debug information from appearing
 * in release builds.
 */

const disableConsoleInProduction = () => {
  if (!__DEV__) {
    // Disable all standard console methods
    const noop = () => {};
    
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.table = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.groupCollapsed = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.timeLog = noop;
    console.count = noop;
    console.countReset = noop;
    console.assert = noop;
    console.clear = noop;
    console.dir = noop;
    console.dirxml = noop;
    
    // Disable any additional logging methods that might exist
    // Use type assertion to avoid TypeScript errors for non-standard properties
    const consoleAny = console as any;
    if (typeof consoleAny.memory !== 'undefined') {
      delete consoleAny.memory;
    }
    if (typeof consoleAny.exception !== 'undefined') {
      consoleAny.exception = noop;
    }
    if (typeof consoleAny.profile !== 'undefined') {
      consoleAny.profile = noop;
    }
    if (typeof consoleAny.profileEnd !== 'undefined') {
      consoleAny.profileEnd = noop;
    }
    if (typeof consoleAny.timeStamp !== 'undefined') {
      consoleAny.timeStamp = noop;
    }
    
    // Override global console if it exists
    if (typeof global !== 'undefined') {
      global.console = console;
    }
    
    // Override window console for web builds
    if (typeof window !== 'undefined') {
      window.console = console;
    }
    
    console.log('Production build - All console logs disabled');
  }
};

export default disableConsoleInProduction;
