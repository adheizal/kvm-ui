import { AuthController } from '@/controllers/auth.controller';
import { authBusinessService } from '@/services/auth.service';

// Mock the service
jest.mock('@/services/auth.service');

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    authController = new AuthController();
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should return 201 on successful registration', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (authBusinessService.register as jest.Mock).mockResolvedValue({
        success: true,
        message: 'User created successfully',
      });

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User created successfully',
      });
    });

    it('should return 400 on failed registration', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (authBusinessService.register as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Username already exists',
      });

      await authController.register(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Username already exists',
      });
    });
  });

  describe('login', () => {
    it('should return token on successful login', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' };
      (authBusinessService.login as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Login successful',
        token: 'fake-jwt-token',
      });

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'fake-jwt-token',
      });
    });

    it('should return 401 on failed login', async () => {
      mockRequest.body = { username: 'testuser', password: 'wrongpassword' };
      (authBusinessService.login as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Invalid username or password',
      });

      await authController.login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid username or password',
      });
    });
  });
});
