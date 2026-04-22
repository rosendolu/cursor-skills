# Next.js Logging Reference

## Pino + pino-roll Logger (`lib/logger.ts`)

```typescript
// lib/logger.ts
import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    // Redact common sensitive fields from all log entries
    redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
        censor: '[REDACTED]',
    },
    ...(isServer && isProduction
        ? {
              // Production: write to rotating file
              transport: {
                  target: 'pino-roll',
                  options: {
                      file: './logs/app.log',
                      frequency: 'daily', // Rotate once per day
                      // OR use size-based rotation instead:
                      // size: '10m',
                      maxFiles: 14, // Keep 14 days of logs
                      mkdir: true, // Auto-create logs/ dir
                      compress: 'gzip', // Compress rotated files
                  },
              },
          }
        : {}),
});

export default logger;
```

## Request Logger Middleware (`lib/withLogger.ts`)

```typescript
// lib/withLogger.ts
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import logger from './logger';

export interface LoggerContext {
    requestId: string;
    method: string;
    url: string;
    startTime: number;
}

export function withLogger(handler: (req: NextRequest, ctx: LoggerContext) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const requestId = req.headers.get('x-request-id') ?? randomUUID();
        const startTime = Date.now();
        const ctx: LoggerContext = {
            requestId,
            method: req.method,
            url: req.nextUrl.pathname,
            startTime,
        };

        logger.info({ ...ctx, event: 'request_start' }, `${req.method} ${req.nextUrl.pathname}`);

        try {
            const response = await handler(req, ctx);
            const duration = Date.now() - startTime;

            logger.info({
                ...ctx,
                status: response.status,
                duration,
                event: 'request_end',
            });

            // Propagate request ID to client
            response.headers.set('x-request-id', requestId);
            return response;
        } catch (error) {
            const duration = Date.now() - startTime;
            const err = error instanceof Error ? error : new Error(String(error));

            logger.error({
                ...ctx,
                duration,
                error: err.message,
                stack: err.stack,
                event: 'request_error',
            });

            throw error;
        }
    };
}
```

## Usage in API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withLogger, type LoggerContext } from '@/lib/withLogger';
import logger from '@/lib/logger';

async function handler(req: NextRequest, ctx: LoggerContext) {
    logger.info({ ...ctx, action: 'fetch_users' }, 'Fetching users list');

    // Your business logic here
    const users = await fetchUsersFromDb();

    return NextResponse.json({ users });
}

export const GET = withLogger(handler);
```

## Usage in Server Components / Server Actions

```typescript
// app/actions.ts
'use server';

import logger from '@/lib/logger';

export async function submitForm(formData: FormData) {
    const email = formData.get('email') as string;

    logger.info({ email, action: 'submit_form' }, 'Form submitted');

    try {
        await saveToDb({ email });
        logger.info({ email, action: 'form_saved' }, 'Form saved successfully');
    } catch (error) {
        logger.error({
            email,
            action: 'form_save_failed',
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
```

## Instrumentation for Uncaught Exceptions (`instrumentation.ts`)

```typescript
// instrumentation.ts (project root — alongside package.json)
import logger from './lib/logger';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        process.on('uncaughtException', (error: Error) => {
            logger.fatal(
                {
                    error: error.message,
                    stack: error.stack,
                    name: error.name,
                },
                'Uncaught Exception — process exiting'
            );
            process.exit(1);
        });

        process.on('unhandledRejection', (reason: unknown) => {
            logger.fatal({ reason: String(reason) }, 'Unhandled Promise Rejection');
        });
    }
}
```

Required `next.config.js` update:

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true,
    },
};

module.exports = nextConfig;
```

## Log Output Format

**Development (pretty console):**

```
[2026-04-23 10:34:56] INFO (42): GET /api/users — request_start
[2026-04-23 10:34:57] INFO (42): {"requestId":"abc-123","status":200,"duration":45,"event":"request_end"}
```

**Production file (`logs/app.log` — JSON, one entry per line):**

```json
{"level":30,"time":1745403296000,"requestId":"abc-123","method":"GET","url":"/api/users","event":"request_start","msg":"GET /api/users"}
{"level":30,"time":1745403296045,"requestId":"abc-123","status":200,"duration":45,"event":"request_end","msg":""}
{"level":50,"time":1745403300000,"error":"Connection refused","stack":"Error: Connection refused\n    at Db.connect (...)\n","event":"request_error","msg":""}
```

**Rotated files (after daily/size threshold):**

```
logs/
  app.log              ← current, being written to
  app.log.0.gz         ← yesterday's or 10MB+ file, gzip compressed
  app.log.1.gz         ← older archive
  ...
```

## pino-roll Options Reference

| Option      | Type                | Default  | Description                                                             |
| ----------- | ------------------- | -------- | ----------------------------------------------------------------------- |
| `file`      | `string`            | required | Base path for log files                                                 |
| `frequency` | `string`            | —        | Time-based rotation: `'daily'`, `'hourly'`, `'weekly'`, `'monthly'`     |
| `size`      | `string`            | —        | Size-based rotation: `'10m'`, `'1g'`, etc. (use instead of `frequency`) |
| `maxFiles`  | `number`            | —        | Max number of rotated files to keep                                     |
| `mkdir`     | `boolean`           | `false`  | Auto-create the log directory                                           |
| `compress`  | `string \| boolean` | —        | `'gzip'` to compress rotated files                                      |

> Use either `frequency` or `size`, not both. `frequency` is recommended for most production use cases.

## Log Level Reference

| Level   | Value | When to use                                    |
| ------- | ----- | ---------------------------------------------- |
| `trace` | 10    | Very detailed debug info (rarely used in prod) |
| `debug` | 20    | Debugging info                                 |
| `info`  | 30    | General operational events (default)           |
| `warn`  | 40    | Warning conditions                             |
| `error` | 50    | Error conditions                               |
| `fatal` | 60    | Process-crashing errors                        |

Set via environment variable: `LOG_LEVEL=debug` or `LOG_LEVEL=info`.

## Security: Redacting Sensitive Fields

Pino's `redact` option strips sensitive data before logs leave the process. Add field paths to `redact.paths` to prevent credentials, tokens, and PII from being written to disk:

```typescript
redact: {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'password',
    'token',
    'secret',
    'ssn',
    'creditCard',
  ],
  censor: '[REDACTED]',
},
```

## Vercel / Serverless Alternative

On Vercel, the filesystem is ephemeral — logs cannot be written to disk reliably. Instead, stream logs to an external service:

```typescript
// lib/logger-vercel.ts
import { LogLayer } from 'loglayer';
import { PinoTransport } from '@loglayer/transport-pino';
import { DataDogTransport } from '@loglayer/transport-datadog';
import pino from 'pino';

const pinoLogger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

export const logger = new LogLayer({
    transport: [
        new PinoTransport({ logger: pinoLogger }),
        new DataDogTransport({
            enabled: process.env.NODE_ENV === 'production',
            apiKey: process.env.DD_API_KEY,
        }),
    ],
});
```

For Logtail:

```typescript
import { Logtail } from '@logtail/node';
const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);
export const logger = pino({ driver: logtail });
```
