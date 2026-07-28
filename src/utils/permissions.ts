import { Role } from '@/types';

export const canAccessAdmin = (role: Role | undefined) => role === 'admin';
export const canAccessUserContent = (role: Role | undefined) => role === 'user' || role === 'admin';
