/**
 * Express Request type extensions
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        tenantId: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export {};