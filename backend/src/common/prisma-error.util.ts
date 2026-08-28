import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function throwPrismaConflict(error: unknown, message: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ['P2002', 'P2003'].includes(error.code)
  ) {
    throw new ConflictException(message);
  }

  throw error;
}
