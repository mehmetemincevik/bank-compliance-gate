import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit:action';
export const Audit = (action: string) => SetMetadata(AUDIT_KEY, action);
