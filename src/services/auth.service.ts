import { userRepository } from '@/repositories/user.repository';
import { authService } from '@/utils/auth';
import { logger } from '@/utils/logger';
import { User } from '@/types';

export class AuthBusinessService {
  async register(
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const userCount = await userRepository.count();
      if (userCount > 0) {
        return { success: false, message: 'User registration is closed' };
      }

      const usernameExists = await userRepository.usernameExists(username);
      if (usernameExists) {
        return { success: false, message: 'Username already exists' };
      }

      const hashedPassword = await authService.hashPassword(password);
      await userRepository.create(username, hashedPassword);

      logger.info(`User created successfully: ${username}`);
      return { success: true, message: 'User created successfully' };
    } catch (error: any) {
      logger.error('Error during user creation:', error);
      return { success: false, message: 'Internal Server Error' };
    }
  }

  async login(
    username: string,
    password: string
  ): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      const user = await userRepository.findByUsername(username);
      if (!user) {
        logger.warn(`Authentication failed for user: ${username} (user not found)`);
        return { success: false, message: 'Invalid username or password' };
      }

      const validPassword = await authService.comparePassword(password, user.password);
      if (!validPassword) {
        logger.warn(`Authentication failed for user: ${username} (invalid password)`);
        return { success: false, message: 'Invalid username or password' };
      }

      const token = authService.generateToken({
        userId: user.id,
        username: user.username,
      });

      logger.info(`User logged in successfully: ${username}`);
      return { success: true, message: 'Login successful', token };
    } catch (error: any) {
      logger.error('Error during login:', error);
      return { success: false, message: 'Internal Server Error' };
    }
  }

  async getUserById(id: number): Promise<User | null> {
    return userRepository.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return userRepository.findByUsername(username);
  }
}

export const authBusinessService = new AuthBusinessService();
