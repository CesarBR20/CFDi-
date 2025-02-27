import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Client } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CFDI } from '../cfdi/schemas/cfdi.schema'

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(CFDI.name) private readonly cfdiModel: Model<CFDI>
) {}

  async createClient(createClientDto: CreateClientDto) {
    const existingClient = await this.clientModel.findOne({ name: createClientDto.name }).exec();
    if (existingClient) {
      throw new BadRequestException('Este nombre de usuario ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(createClientDto.password, 10);
    const newClient = new this.clientModel({
      name: createClientDto.name,
      password: hashedPassword, 
      acceptedTerms: false, 
      rfcList: [], 
    });

    return newClient.save();
  }

  async getClients() {
    return this.clientModel.find().select('-password').exec();
  }

  async updateClient(id: string, updateClientDto: UpdateClientDto) {
    if (updateClientDto.password) {
      updateClientDto.password = await bcrypt.hash(updateClientDto.password, 10);
    }
    return this.clientModel.findByIdAndUpdate(id, updateClientDto, { new: true }).select('-password').exec();
  }

  async acceptTerms(clientId: string, accepted: boolean) {
    console.log(`📌 Buscando cliente con ID: ${clientId}`);

    const updatedClient = await this.clientModel.findByIdAndUpdate(
        clientId, 
        { acceptedTerms: accepted }, 
        { new: true }
    ).exec();

    if (!updatedClient) {
        console.warn('⚠️ No se encontró el cliente.');
        throw new NotFoundException('Cliente no encontrado.');
    }

    console.log(`✅ Cliente actualizado: ${updatedClient}`);
    return updatedClient;
  }

  async saveRFCsFromXLSX(clientId: string, rfcList: string[]) {
    if (!Array.isArray(rfcList) || rfcList.length === 0) {
      throw new BadRequestException('Debe proporcionar al menos un RFC válido.');
    }

    return this.clientModel.findByIdAndUpdate(clientId, { rfcList }, { new: true }).exec();
  }

  async getCFDIsForClient(username: string) {
    if (!username) {
      throw new BadRequestException('Debe proporcionar un nombre de usuario.');
    }
  
    return this.cfdiModel
      .find({ clientUsername: username }) // Filtrar por cliente
      .select('-_id -__v') // Excluir campos innecesarios
      .exec();
  }
  
  
  async searchClientsByName(name: string) {
    if (!name) {
      throw new BadRequestException('Debe proporcionar un nombre para la búsqueda.');
    }
  
    return this.clientModel
      .find({ username: { $regex: name, $options: 'i' } }) 
      .select('-password') 
      .exec();
  }
}
