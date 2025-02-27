import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from '../clients.service';
import { getModelToken } from '@nestjs/mongoose';
import { Client } from '../schemas/client.schema';
import { Model } from 'mongoose';

describe('ClientsService', () => {
  let service: ClientService;
  let model: Model<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        {
          provide: getModelToken('Client'),
          useValue: {
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([{ _id: '1', name: 'Cesar', rfc: 'ABC123' }]),
            }),
            create: jest.fn().mockImplementation((dto) => ({
              ...dto,
              _id: '1',
              save: jest.fn().mockResolvedValue({ _id: '1', ...dto }),
            })),
            findByIdAndUpdate: jest.fn().mockImplementation((id, dto) =>
              Promise.resolve({ _id: id, ...dto }),
            ),
          },
        },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    model = module.get<Model<Client>>(getModelToken('Client'));
  });

  it('Debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('Debe obtener todos los clientes', async () => {
    const result = await service.getClients();
    expect(result).toEqual([{ _id: '1', name: 'Cesar', rfc: 'ABC123' }]);
  });

  it('Debe crear un cliente', async () => {
    const newClient = { name: 'Nuevo Cliente', rfc: 'RFC123' };
    const createdClient = await service.createClient(newClient);
    expect(createdClient).toEqual({ _id: '1', ...newClient });
  });

  it('Debe actualizar un cliente', async () => {
    const updatedClient = await service.updateClient('1', { name: 'Cliente Actualizado' });
    expect(updatedClient).toEqual({ _id: '1', name: 'Cliente Actualizado' });
  });
});
