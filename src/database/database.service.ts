import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from '../clients/schemas/client.schema'; // 🔹 Ahora importa el esquema
import { File } from '../file/schemas/file.schema'; // 🔹 Ahora importa el esquema

@Injectable()
export class DatabaseService {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(File.name) private readonly fileModel: Model<File>,
  ) {}

  async getClients() {
    return this.clientModel.find().exec();
  }

  async getFiles() {
    return this.fileModel.find().exec();
  }
}
