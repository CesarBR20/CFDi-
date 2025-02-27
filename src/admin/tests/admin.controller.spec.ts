import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller';
import { AdminService } from '../admin.service'

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: {
            getClients: jest.fn().mockResolvedValue([{ name: 'Cliente 1', rfc: 'RFC123' }]),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('debería estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('debería obtener clientes', async () => {
    const clients = await controller.getClients();
    expect(clients).toEqual([{ name: 'Cliente 1', rfc: 'RFC123' }]);
    expect(service.getClients).toHaveBeenCalled();
  });
});
