import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import * as Joi from 'joi';
import { envValidationSchema } from './env.validation';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true, // Hace que esté disponible en toda la app
      validationSchema: envValidationSchema, // Valida las variables de entorno
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}




/*@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true }), // Importa ConfigModule como global
    DatabaseModule, // Importa DatabaseModule
  ],
})
export class AppModule {}*/
