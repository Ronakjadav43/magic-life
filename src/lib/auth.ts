// JWT Authentication system
import { SignJWT, jwtVerify } from 'jose';
import type { StaffRole } from './types';

const JWT_SECRET = new TextEncoder().encode('magic-life-ops-secret-key-2026');
const TOKEN_KEY = 'ops_auth_token';
const USERS_KEY = 'ops_auth_users';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  initials: string;
  color: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

// Pre-seed default users
const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'admin-001',
    name: 'Admin User',
    email: 'admin@magiclife.com',
    password: 'admin123',
    role: 'Admin',
    initials: 'AU',
    color: '#f43f5e',
  },
  {
    id: 'manager-001',
    name: 'Project Manager',
    email: 'manager@magiclife.com',
    password: 'manager123',
    role: 'Manager',
    initials: 'PM',
    color: '#f97316',
  },
  {
    id: 'staff-001',
    name: 'Dev Staff',
    email: 'staff@magiclife.com',
    password: 'staff123',
    role: 'Staff',
    initials: 'DS',
    color: '#3b82f6',
  },
];

// Initialize default users if none exist
function ensureUsers(): StoredUser[] {
  if (typeof window === 'undefined') return DEFAULT_USERS;
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  try {
    const users = JSON.parse(raw) as StoredUser[];
    return users.length > 0 ? users : DEFAULT_USERS;
  } catch {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
}

// Generate JWT token
export async function generateToken(user: AuthUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
    color: user.color,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  return token;
}

// Verify JWT token
export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as StaffRole,
      initials: payload.initials as string,
      color: payload.color as string,
    };
  } catch {
    return null;
  }
}

// Login
export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: AuthUser; error?: string }> {
  const users = ensureUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    initials: user.initials,
    color: user.color,
  };

  const token = await generateToken(authUser);
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }

  return { success: true, token, user: authUser };
}

// Get current user from stored token
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  return verifyToken(token);
}

// Logout
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

// Register new user (Admin only)
export async function registerUser(
  data: { name: string; email: string; password: string; role: StaffRole }
): Promise<{ success: boolean; error?: string }> {
  const users = ensureUsers();

  if (users.find(u => u.email.toLowerCase() === data.email.toLowerCase())) {
    return { success: false, error: 'Email already exists' };
  }

  const initials = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#3b82f6'];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const newUser: StoredUser = {
    id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role,
    initials,
    color,
  };

  users.push(newUser);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  return { success: true };
}

// Get all registered users (for assignment dropdowns)
export function getAllUsers(): AuthUser[] {
  const users = ensureUsers();
  return users.map(({ password, ...rest }) => rest);
}

// Check role permissions
export function canAssignTasks(role: StaffRole): boolean {
  return role === 'Admin' || role === 'Manager';
}

export function canApprove(role: StaffRole): boolean {
  return role === 'Admin' || role === 'Manager';
}

export function canManageStaff(role: StaffRole): boolean {
  return role === 'Admin';
}

export function canViewAllTasks(role: StaffRole): boolean {
  return role === 'Admin' || role === 'Manager';
}
