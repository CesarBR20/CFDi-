import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { CFDI, CFDISchema } from './schemas/cfdi.schema';
import { Client, ClientSchema } from '../clients/schemas/client.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CFDI.name, schema: CFDISchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  controllers: [CfdiController],
  providers: [CfdiService],
  exports: [CfdiService],
})
export class CfdiModule {}
