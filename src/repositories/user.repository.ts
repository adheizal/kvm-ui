import { pool } from '@/config/database';
import { User } from '@/types';

export class UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async findById(id: number): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async create(username: string, hashedPassword: string): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );
    return result.rows[0];
  }

  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
  }

  async usernameExists(username: string): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM users WHERE username = $1', [username]);
    return result.rows.length > 0;
  }
}

export const userRepository = new UserRepository();
