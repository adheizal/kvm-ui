import { Request, Response } from 'express';
import { authBusinessService } from '@/services/auth.service';
import { AuthRequest } from '@/types';

export class AuthController {
  async register(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body;
    const result = await authBusinessService.register(username, password);

    if (result.success) {
      res.status(201).json({ message: result.message });
    } else {
      res.status(400).json({ error: result.message });
    }
  }

  async login(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body;
    const result = await authBusinessService.login(username, password);

    if (result.success) {
      res.json({
        message: result.message,
        token: result.token,
        user: {
          username: username,
        },
      });
    } else {
      res.status(401).json({ error: result.message });
    }
  }

  async logout(_req: AuthRequest, res: Response): Promise<any> {
    // In JWT-based auth, logout is handled client-side by deleting the token
    // If using token blacklist, implement here
    return res.json({ message: 'Logout successful' });
  }

  async me(req: AuthRequest, res: Response): Promise<any> {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authBusinessService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      username: user.username,
    });
  }
}

export const authController = new AuthController();
