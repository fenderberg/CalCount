import { PrismaClient } from '@prisma/client';

/** Eén gedeelde Prisma-client voor de hele backend. */
export const prisma = new PrismaClient();

/** Vaste id voor het single-user profiel (v1). */
export const PROFILE_ID = 1;
