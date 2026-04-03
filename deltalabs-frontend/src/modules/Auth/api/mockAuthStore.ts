/**
 * Persistent mock user + recovery store (localStorage).
 * Replace with real API calls later; session is handled separately in AuthSession_Context.
 */
import type { AuthenticatedUser, SignupInput } from "@/modules/Auth/types/auth";

const USERS_KEY = "dl.mock.auth.users.v1";
const RECOVERY_KEY = "dl.mock.auth.recovery.v1";

export type MockUserRecord = Readonly<{
  id: string;
  email: string;
  phone: string;
  userName: string;
  firstName: string;
  lastName: string;
  /** MOCK ONLY — never store plain passwords in production. */
  password: string;
  day: string;
  month: string;
  year: string;
}>;

type RecoveryRecord = Readonly<{
  otp: string;
  expiresAt: number;
}>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

function seedUsers(): MockUserRecord[] {
  return [
    {
      id: "mock_user_success",
      email: "success@demo.com",
      phone: "+251911000000",
      userName: "demo_user",
      firstName: "Demo",
      lastName: "User",
      password: "Password123!",
      day: "15",
      month: "6",
      year: "1995",
    },
    {
      id: "mock_user_fail",
      email: "fail@demo.com",
      phone: "+251922000000",
      userName: "fail_user",
      firstName: "Fail",
      lastName: "Case",
      password: "WrongPassword1!",
      day: "1",
      month: "1",
      year: "1990",
    },
  ];
}

export function normalizeIdentifier(raw: string): string {
  return raw.trim();
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function loadUsers(): MockUserRecord[] {
  let list = readJSON<MockUserRecord[]>(USERS_KEY, []);
  if (list.length === 0) {
    list = seedUsers();
    writeJSON(USERS_KEY, list);
  }
  return list;
}

export function saveUsers(users: MockUserRecord[]): void {
  writeJSON(USERS_KEY, users);
}

export function toPublicUser(row: MockUserRecord): AuthenticatedUser {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    userName: row.userName,
    firstName: row.firstName,
    lastName: row.lastName,
  };
}

export function findUserByIdentifier(identifier: string): MockUserRecord | undefined {
  const id = normalizeIdentifier(identifier);
  if (!id) return undefined;
  const users = loadUsers();
  const emailKey = normalizeEmail(id);
  const phoneKey = normalizePhone(id);
  return users.find(
    (u) => normalizeEmail(u.email) === emailKey || normalizePhone(u.phone) === phoneKey,
  );
}

export function findUserByEmail(email: string): MockUserRecord | undefined {
  const key = normalizeEmail(email);
  return loadUsers().find((u) => normalizeEmail(u.email) === key);
}

export function findUserByUserName(userName: string): MockUserRecord | undefined {
  const key = userName.trim().toLowerCase();
  return loadUsers().find((u) => u.userName.toLowerCase() === key);
}

export function createUserFromSignup(input: SignupInput): MockUserRecord {
  const users = loadUsers();
  const id = `mock_user_${crypto.randomUUID?.() ?? `${Date.now()}`}`;
  const row: MockUserRecord = {
    id,
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    userName: input.userName.trim(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    password: input.password,
    day: input.day,
    month: input.month,
    year: input.year,
  };
  saveUsers([...users, row]);
  return row;
}

type RecoveryMap = Record<string, RecoveryRecord>;

function recoveryKey(identifier: string): string {
  const id = normalizeIdentifier(identifier);
  if (id.includes("@")) return `e:${normalizeEmail(id)}`;
  return `p:${normalizePhone(id)}`;
}

export function setRecoveryOtp(identifier: string, otp: string, ttlMs: number): void {
  const map = readJSON<RecoveryMap>(RECOVERY_KEY, {});
  map[recoveryKey(identifier)] = { otp, expiresAt: Date.now() + ttlMs };
  writeJSON(RECOVERY_KEY, map);
}

export function consumeRecoveryOtp(identifier: string, otp: string): boolean {
  const key = recoveryKey(identifier);
  const map = readJSON<RecoveryMap>(RECOVERY_KEY, {});
  const rec = map[key];
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    delete map[key];
    writeJSON(RECOVERY_KEY, map);
    return false;
  }
  if (rec.otp !== otp.trim()) return false;
  delete map[key];
  writeJSON(RECOVERY_KEY, map);
  return true;
}

/** Demo / test bypass: always valid if user exists (documented for mock only). */
export const MOCK_RECOVERY_OTP_DEMO = "123456";

export function updateUserPassword(userId: string, newPassword: string): void {
  const users = loadUsers();
  const next = users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u));
  saveUsers(next);
}
