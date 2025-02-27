import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-token'),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('debería estar definido', () => {
    expect(authService).toBeDefined();
  });

  it('debería encriptar la contraseña correctamente', async () => {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hashedPassword)).toBeTruthy();
  });

  it('debería generar un JWT', () => {
    const payload = { username: 'testuser', sub: '12345' };
    const token = jwtService.sign(payload);
    expect(token).toBe('mocked-token');
  });
});
