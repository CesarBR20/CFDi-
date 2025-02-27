import { JwtStrategy } from '../jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'testSecretKey';
              return null;
            }),
          },
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('Debe estar definido', () => {
    expect(jwtStrategy).toBeDefined();
  });

  it('Debe validar un payload correctamente', async () => {
    const payload = { username: 'testUser' };
    const result = await jwtStrategy.validate(payload);

    expect(result).toEqual({ username: 'testUser' });
  });

  it('Debe obtener la clave secreta de JWT desde ConfigService', () => {
    expect(configService.get('JWT_SECRET')).toBe('testSecretKey');
  });
});
