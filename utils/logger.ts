// Store original console methods to prevent circular calls
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: 'scroll' | 'ui' | 'data' | 'navigation' | 'interaction' | 'general';
  component?: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enableConsoleOutput = __DEV__;

  private createLogEntry(
    level: LogEntry['level'],
    category: LogEntry['category'],
    message: string,
    component?: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      component,
      message,
      data,
      stackTrace: error?.stack
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (this.enableConsoleOutput) {
      const prefix = `[${entry.level.toUpperCase()}] [${entry.category}]${entry.component ? ` [${entry.component}]` : ''}`;
      const message = `${prefix} ${entry.message}`;
      
      switch (entry.level) {
        case 'error':
          originalError(message, entry.data || '');
          if (entry.stackTrace) originalError('Stack:', entry.stackTrace);
          break;
        case 'warn':
          originalWarn(message, entry.data || '');
          break;
        case 'info':
          originalInfo(message, entry.data || '');
          break;
        case 'debug':
          originalLog(message, entry.data || '');
          break;
      }
    }
  }

  debug(category: LogEntry['category'], message: string, component?: string, data?: any) {
    this.addLog(this.createLogEntry('debug', category, message, component, data));
  }

  info(category: LogEntry['category'], message: string, component?: string, data?: any) {
    this.addLog(this.createLogEntry('info', category, message, component, data));
  }

  warn(category: LogEntry['category'], message: string, component?: string, data?: any) {
    this.addLog(this.createLogEntry('warn', category, message, component, data));
  }

  error(category: LogEntry['category'], message: string, component?: string, data?: any, error?: Error) {
    this.addLog(this.createLogEntry('error', category, message, component, data, error));
  }

  // Specific logging methods for common scenarios
  scrollEvent(component: string, event: string, data?: any) {
    this.debug('scroll', `Scroll event: ${event}`, component, data);
  }

  uiInteraction(component: string, action: string, data?: any) {
    this.info('interaction', `UI interaction: ${action}`, component, data);
  }

  renderError(component: string, error: Error, data?: any) {
    this.error('ui', `Render error in component`, component, data, error);
  }

  apiError(endpoint: string, error: Error, data?: any) {
    this.error('data', `API error: ${endpoint}`, undefined, data, error);
  }

  // Get logs for debugging
  getLogs(
    category?: LogEntry['category'],
    level?: LogEntry['level'],
    component?: string,
    limit?: number
  ): LogEntry[] {
    let filtered = this.logs;

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (component) {
      filtered = filtered.filter(log => log.component === component);
    }

    return limit ? filtered.slice(0, limit) : filtered;
  }

  // Export logs as string for sharing/debugging
  exportLogs(category?: LogEntry['category'], level?: LogEntry['level']): string {
    const logs = this.getLogs(category, level);
    return logs.map(log => {
      const prefix = `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}]${log.component ? ` [${log.component}]` : ''}`;
      let output = `${prefix} ${log.message}`;
      
      if (log.data) {
        output += `\nData: ${JSON.stringify(log.data, null, 2)}`;
      }
      
      if (log.stackTrace) {
        output += `\nStack: ${log.stackTrace}`;
      }
      
      return output;
    }).join('\n\n');
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('general', 'Logs cleared');
  }

  // Get summary statistics
  getLogStats(): { total: number; byLevel: Record<string, number>; byCategory: Record<string, number> } {
    const byLevel = this.logs.reduce((acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byCategory = this.logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.logs.length,
      byLevel,
      byCategory
    };
  }
}

// Global logger instance
export const logger = new Logger();

// Hook to capture unhandled errors
if (__DEV__) {
  console.error = (...args) => {
    // Check if it's a React error or warning
    const message = args.join(' ');
    
    // Skip Metro bundler errors and our own logged messages to prevent infinite loops
    if ((message.includes('Warning:') || message.includes('Error:')) && 
        !message.includes('ENOENT') && 
        !message.includes('unknown') && 
        !message.includes('Console error detected') &&
        !message.includes('getCodeFrame') &&
        !message.includes('_symbolicate')) {
      logger.error('general', 'Console error detected', undefined, { args });
    }
    
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const message = args.join(' ');
    // Skip logging our own warning messages to prevent infinite loops
    if (!message.includes('Console warning detected') && !message.includes('shadow*')) {
      logger.warn('general', 'Console warning detected', undefined, { args });
    }
    originalWarn.apply(console, args);
  };
}

// Export common logging functions for convenience
export const logScrollEvent = (component: string, event: string, data?: any) => 
  logger.scrollEvent(component, event, data);

export const logUIInteraction = (component: string, action: string, data?: any) => 
  logger.uiInteraction(component, action, data);

export const logError = (category: LogEntry['category'], message: string, component?: string, data?: any, error?: Error) => 
  logger.error(category, message, component, data, error);

export const logInfo = (category: LogEntry['category'], message: string, component?: string, data?: any) => 
  logger.info(category, message, component, data);

export const logDebug = (category: LogEntry['category'], message: string, component?: string, data?: any) => 
  logger.debug(category, message, component, data);

export default logger;