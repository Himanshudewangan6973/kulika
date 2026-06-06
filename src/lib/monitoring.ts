// src/lib/monitoring.ts
import { createClient } from '@/lib/supabase/client';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: Date;
}

export class Analytics {
  private static isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

  static async track(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    try {
      const supabase = createClient();
      if (!supabase) return;

      await supabase
        .from('analytics_events')
        .insert({
          event: event.event,
          properties: event.properties,
          user_id: event.userId,
          timestamp: event.timestamp || new Date(),
          environment: process.env.NODE_ENV,
        });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  static async trackError(error: Error, context: Record<string, any> = {}) {
    await this.track({
      event: 'error',
      properties: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...context,
      },
    });
  }

  static async trackApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ) {
    await this.track({
      event: 'api_call',
      properties: {
        endpoint,
        method,
        statusCode,
        duration,
      },
    });
  }

  static async trackUserAction(
    action: string,
    properties: Record<string, any>,
    userId: string
  ) {
    await this.track({
      event: `user_${action}`,
      properties,
      userId,
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  static track(name: string, fn: () => Promise<any>) {
    return async () => {
      const start = performance.now();
      try {
        const result = await fn();
        const duration = performance.now() - start;

        if (duration > 1000) {
          console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
          await Analytics.track({
            event: 'slow_operation',
            properties: { operation: name, duration },
          });
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        await Analytics.trackError(error as Error, {
          operation: name,
          duration,
        });
        throw error;
      }
    };
  }
}
