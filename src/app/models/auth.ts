import { Signal } from '@angular/core';

export interface UserRole {
  staffId: string;
  authorities: string[];
}

export interface GroupAuthorityAccess {
  uniqId: number;
  groupAuthority: string;
  moduleId: string;
  accessCode: string;
  accessName: string;
  accessValue: boolean;
  entryStaff: string | null;
  entryDate: string | null;
  lastEditStaff: string | null;
  lastEditDate: string | null;
}

export enum AuthLoadingState {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export interface IAuthService {
  userRole: Signal<UserRole | null>;
  loadingStateUserRole: Signal<AuthLoadingState>;
  groupAuthorityAccesses: Signal<GroupAuthorityAccess[]>;
  fetchUserRole(): Promise<UserRole>;
  fetchGroupAuthorityAccesses(moduleId: string): Promise<GroupAuthorityAccess[]>;
  hasAccess(accessCode: string): boolean;
}
