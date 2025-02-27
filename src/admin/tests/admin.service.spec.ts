import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../interfaces/client.interface';

describe('AdminService', () => {
  let service: AdminService;
  let model: Model<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken('Client'),
          useValue: {
            find: jest.fn().mockResolvedValue([{ name: 'Cliente 1', rfc: 'RFC123' }]),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    model = module.get<Model<Client>>(getModelToken('Client'));
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería obtener clientes', async () => {
    const clients = await service.getClients();
    expect(clients).toEqual([{ name: 'Cliente 1', rfc: 'RFC123' }]);
    expect(model.find).toHaveBeenCalled();
  });
});
