import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const email = process.env.ADMIN_SEED_EMAIL;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!email || !password || password.length < 8) {
  throw new Error('ADMIN_SEED_EMAIL i ADMIN_SEED_PASSWORD (najmanje 8 znakova) moraju biti podešeni.');
}

const passwordHash = await hash(password, 12);

await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash, role: UserRole.ADMIN, isActive: true },
  create: { email: email.toLowerCase(), passwordHash, role: UserRole.ADMIN },
});

console.log(`Administratorski nalog je spreman: ${email.toLowerCase()}`);
await prisma.$disconnect();
