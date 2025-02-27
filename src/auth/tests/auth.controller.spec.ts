import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ access_token: 'mocked-token' }),
            register: jest.fn().mockResolvedValue({ username: 'testuser' }),
          },
        },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('debería estar definido', () => {
    expect(authController).toBeDefined();
  });

  it('debería retornar un token al iniciar sesión', async () => {
    expect(await authController.login({ username: 'testuser', password: 'password123' }))
      .toEqual({ access_token: 'mocked-token' });
  });

  it('debería registrar un usuario correctamente', async () => {
    expect(await authController.register({ username: 'testuser', password: 'password123' }))
      .toEqual({ username: 'testuser' });
  });
});
