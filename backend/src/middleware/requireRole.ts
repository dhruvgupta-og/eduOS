import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authenticateRequest';

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        error: `Access denied: Requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.auth.role}`
      });
    }

    next();
  };
}
