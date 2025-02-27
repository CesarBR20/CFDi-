import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './database.service';
import { getModelToken } from '@nestjs/mongoose';
import { Client } from '../clients/interfaces/client.interface';
import { File } from '../file/interfaces/file.interfaces';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: getModelToken('Client'),
          useValue: {},
        },
        {
          provide: getModelToken('File'),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
