import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from '../clients.controller';
import { ClientService } from '../clients.service';

describe('ClientsController', () => {
  let controller: ClientController;
  let service: ClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        {
          provide: ClientService,
          useValue: {
            getClients: jest.fn().mockResolvedValue([{ name: 'Cesar', rfc: 'ABC123' }]),
          },
        },
      ],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);
  });

  it('Debe obtener la lista de clientes', async () => {
    expect(await controller.getClients()).toEqual([{ name: 'Cesar', rfc: 'ABC123' }]);
  });
});
