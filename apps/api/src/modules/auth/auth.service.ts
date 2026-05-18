import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

const BCRYPT_ROUNDS = 12;

export async function registerUser(db: DB, input: RegisterInput) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (existing) {
    throw new Error('EMAIL_TAKEN');
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      password: hashedPassword,
      name: input.name,
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      level: users.level,
      placementTestDone: users.placementTestDone,
      role: users.role,
    });

  if (!user) throw new Error('Failed to create user');
  return user;
}

export async function loginUser(db: DB, input: LoginInput) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, input.email),
  });

  if (!user || !user.password) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    level: user.level,
    placementTestDone: user.placementTestDone,
    role: user.role,
  };
}
