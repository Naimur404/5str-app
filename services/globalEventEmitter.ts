// React Native compatible EventEmitter implementation
class ReactNativeEventEmitter {
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  emit(event: string, ...args: any[]) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

class GlobalEventEmitter extends ReactNativeEventEmitter {
  private static instance: GlobalEventEmitter;

  private constructor() {
    super();
  }

  static getInstance(): GlobalEventEmitter {
    if (!GlobalEventEmitter.instance) {
      GlobalEventEmitter.instance = new GlobalEventEmitter();
    }
    return GlobalEventEmitter.instance;
  }

  // Force logout event
  emitForceLogout(reason?: string) {
    console.log('🔐 GlobalEventEmitter: Emitting force logout event:', reason);
    this.emit('forceLogout', { reason });
  }

  // Listen for force logout
  onForceLogout(callback: (data: { reason?: string }) => void) {
    this.on('forceLogout', callback);
    return () => this.off('forceLogout', callback);
  }

  // Authentication state change event
  emitAuthStateChange(isAuthenticated: boolean, user?: any) {
    console.log('🔐 GlobalEventEmitter: Emitting auth state change:', { isAuthenticated, user: user?.name });
    this.emit('authStateChange', { isAuthenticated, user });
  }

  // Listen for auth state changes
  onAuthStateChange(callback: (data: { isAuthenticated: boolean; user?: any }) => void) {
    this.on('authStateChange', callback);
    return () => this.off('authStateChange', callback);
  }
}

export const globalEventEmitter = GlobalEventEmitter.getInstance();
