import { Controller, Get } from '@nestjs/common';

/**
 * Root application controller.
 * Provides health check endpoint for monitoring and testing the response envelope.
 */
@Controller()
export class AppController {
  /**
   * Health check endpoint.
   * Returns 200 OK with timestamp, wrapped in standard response envelope.
   * Useful for:
   * - Verifying the API is running
   * - Testing the ResponseInterceptor
   * - Load balancer health checks
   */
  @Get()
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
