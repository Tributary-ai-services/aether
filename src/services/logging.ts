// Frontend Logging Service - sends logs to backend for collection by Loki
import { aetherApi } from './aetherApi.js';

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp?: Date;
  url?: string;
  user_agent?: string;
  session_id?: string;
  stack_trace?: string;
  extra?: Record<string, any>;
}

interface LogBatchRequest {
  logs: LogEntry[];
}

class LoggingService {
  private logBuffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 20;
  private sessionId: string;
  private flushTimer?: number;
  private isEnabled: boolean = true;

  // Store original console methods to avoid infinite recursion when we override them
  private originalConsoleError: typeof console.error;
  private originalConsoleWarn: typeof console.warn;
  private originalConsoleInfo: typeof console.info;
  private originalConsoleDebug: typeof console.debug;

  constructor() {
    // Store original console methods BEFORE any overrides
    this.originalConsoleError = console.error.bind(console);
    this.originalConsoleWarn = console.warn.bind(console);
    this.originalConsoleInfo = console.info.bind(console);
    this.originalConsoleDebug = console.debug.bind(console);

    this.sessionId = this.generateSessionId();
    this.setupErrorCapture();
    this.startPeriodicFlush();

    // Log initialization
    console.log('[Logging Service] Initialized with session ID:', this.sessionId);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupErrorCapture() {
    // Capture global JavaScript errors
    window.addEventListener('error', (event) => {
      this.error(event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack_trace: event.error?.stack,
        event_type: 'javascript_error',
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error(`Unhandled Promise Rejection: ${event.reason}`, {
        stack_trace: event.reason?.stack,
        event_type: 'promise_rejection',
      });
    });

    // Capture console errors (wrap original console.error)
    // Use stored original method to avoid issues with the override
    console.error = (...args: any[]) => {
      this.originalConsoleError.apply(console, args);

      // Send to logging service
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      this.error(message, {
        event_type: 'console_error',
      });
    };
  }

  private addLog(entry: LogEntry) {
    const enrichedEntry: LogEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date(),
      url: entry.url || window.location.href,
      user_agent: entry.user_agent || navigator.userAgent,
      session_id: entry.session_id || this.sessionId,
    };

    this.logBuffer.push(enrichedEntry);

    // Flush immediately for errors
    if (entry.level === 'error') {
      this.flush();
    } else if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  public async flush(): Promise<void> {
    if (!this.isEnabled || this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const request: LogBatchRequest = {
        logs: logsToSend,
      };

      await aetherApi.request('/logs', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      console.log(`[Logging Service] Successfully sent ${logsToSend.length} log entries to backend`);
    } catch (error) {
      // Don't log errors from logging service to avoid infinite loops
      // Just restore the logs to the buffer and try again later
      this.logBuffer = [...logsToSend, ...this.logBuffer];

      // Limit buffer size to prevent memory issues
      if (this.logBuffer.length > 100) {
        this.logBuffer = this.logBuffer.slice(-100);
      }

      console.warn('[Logging Service] Failed to send logs to backend:', error);
    }
  }

  private startPeriodicFlush() {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  public stopPeriodicFlush() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  public disable() {
    this.isEnabled = false;
    this.stopPeriodicFlush();
  }

  public enable() {
    this.isEnabled = true;
    this.startPeriodicFlush();
  }

  // Public logging methods - use original console methods to avoid infinite recursion
  public error(message: string, extra?: Record<string, any>) {
    this.originalConsoleError('[Frontend Error]', message, extra);
    this.addLog({ level: 'error', message, extra });
  }

  public warn(message: string, extra?: Record<string, any>) {
    this.originalConsoleWarn('[Frontend Warn]', message, extra);
    this.addLog({ level: 'warn', message, extra });
  }

  public info(message: string, extra?: Record<string, any>) {
    this.originalConsoleInfo('[Frontend Info]', message, extra);
    this.addLog({ level: 'info', message, extra });
  }

  public debug(message: string, extra?: Record<string, any>) {
    this.originalConsoleDebug('[Frontend Debug]', message, extra);
    this.addLog({ level: 'debug', message, extra });
  }

  // Utility method to log user actions
  public logUserAction(action: string, details?: Record<string, any>) {
    this.info(`User action: ${action}`, {
      ...details,
      event_type: 'user_action',
      action,
    });
  }

  // Utility method to log API calls
  public logApiCall(endpoint: string, method: string, status?: number, error?: any) {
    const message = error
      ? `API call failed: ${method} ${endpoint}`
      : `API call succeeded: ${method} ${endpoint}`;

    const level = error ? 'error' : 'info';

    this.addLog({
      level,
      message,
      extra: {
        event_type: 'api_call',
        endpoint,
        method,
        status,
        error: error?.message,
      },
    });
  }

  // Utility method to log component lifecycle events
  public logComponentLifecycle(component: string, event: 'mount' | 'unmount' | 'update', details?: Record<string, any>) {
    this.debug(`Component ${event}: ${component}`, {
      ...details,
      event_type: 'component_lifecycle',
      component,
      lifecycle_event: event,
    });
  }

  // Flush logs before page unload
  public setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      // Synchronous flush (best effort)
      if (this.logBuffer.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        const request: LogBatchRequest = {
          logs: logsToSend,
        };

        const blob = new Blob([JSON.stringify(request)], { type: 'application/json' });
        const url = `${aetherApi.baseURL}/logs`;

        // sendBeacon returns false if the request could not be queued
        const queued = navigator.sendBeacon(url, blob);

        if (!queued) {
          console.warn('[Logging Service] Failed to queue logs for sending on unload');
        }
      }
    });
  }
}

// Export singleton instance
export const logger = new LoggingService();

// Setup before unload handler
logger.setupBeforeUnload();

// Export for testing/debugging
if (import.meta.env.DEV) {
  (window as any).logger = logger;
}
