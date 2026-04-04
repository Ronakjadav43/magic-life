// JWT Authentication system — DB-backed via API
import { jwtVerify } from 'jose';
import type { StaffRole } from './types';

const JWT_SECRET = new TextEncoder().encode('magic-life-ops-secret-key-2026');
const TOKEN_KEY = 'ops_auth_token';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  initials: string;
  color: string;
}

// Verify JWT token (client-side)
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

// Login via API
export async function login(email: string, password: string): Promise<{ success: boolean; token?: string; user?: AuthUser; error?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (data.success && data.token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      return { success: true, token: data.token, user: data.user };
    }
    return { success: false, error: data.error || 'Login failed' };
  } catch {
    return { success: false, error: 'Network error' };
  }
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

// Get all users from API (for assignment dropdowns)
export async function getAllUsers(): Promise<AuthUser[]> {
  try {
    const res = await fetch('/api/staff');
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
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
