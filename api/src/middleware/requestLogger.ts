import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware de logging para trazabilidad de cada request.
 * Genera un requestId único por petición y registra:
 * - Inicio: método, URL, IP, user-agent, requestId
 * - Fin: status code, duración en ms
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Attach requestId to request for downstream use
  (req as unknown as Record<string, unknown>)['requestId'] = requestId;

  // Set requestId header in response for client traceability
  res.setHeader('X-Request-Id', requestId);

  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.socket.remoteAddress || '-';
  const userAgent = req.get('user-agent') || '-';

  console.log(
    `[${timestamp}] ➡️  ${method} ${url} | requestId=${requestId} | ip=${ip} | ua=${userAgent}`
  );

  // Hook into response finish to log completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const finishTimestamp = new Date().toISOString();

    const statusIcon = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';

    console.log(
      `[${finishTimestamp}] ${statusIcon} ${method} ${url} | requestId=${requestId} | status=${status} | ${duration}ms`
    );
  });

  next();
}
