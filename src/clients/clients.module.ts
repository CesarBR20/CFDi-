import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientController } from './clients.controller';
import { ClientService } from './clients.service';
import { ClientSchema } from './schemas/client.schema';
import { CFDI, CFDISchema } from '../cfdi/schemas/cfdi.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Client', schema: ClientSchema },
      { name: CFDI.name, schema: CFDISchema },
    ]),
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [MongooseModule, ClientService],
})
export class ClientModule {}
