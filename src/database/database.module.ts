import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { Client, ClientSchema } from '../clients/schemas/client.schema';
import { File, FileSchema } from '../file/schemas/file.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: File.name, schema: FileSchema },
    ]), // 🔹 Registrar los modelos aquí
  ],
  providers: [DatabaseService],
  exports: [MongooseModule, DatabaseService], // 🔹 Exportar MongooseModule y DatabaseService
})
export class DatabaseModule {}
