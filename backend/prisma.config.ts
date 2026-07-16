// prisma.config.ts — Prisma v7 configuration
// Database URL is now configured here, not in schema.prisma

import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
