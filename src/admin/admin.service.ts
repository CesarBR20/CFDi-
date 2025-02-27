import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as AWS from 'aws-sdk';
import { ConfigService } from '../config/config.service';
import { Client } from '../clients/schemas/client.schema';
import { File } from '../file/schemas/file.schema';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { CreateClientDto } from 'src/clients/dto/create-client.dto';


@Injectable()
export class AdminService {
  private s3: AWS.S3;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(File.name) private readonly fileModel: Model<File>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.awsAccessKeyId,
      secretAccessKey: this.configService.awsSecretAccessKey,
      region: this.configService.awsRegion,
    });
  }

  /**
   * 📌 LISTAR CLIENTES (Ocultando contraseñas)
   */
  async getClients() {
    return this.clientModel.find().select('-password').exec();
  }

  /**
   * 📌 CREAR CLIENTE (con contraseña cifrada)
   */
  async createClient(clientData: CreateClientDto) {
    console.log('📌 Datos antes de procesar:', clientData);
    console.log('📌 Propiedades en clientData:', Object.keys(clientData));

    // 🔹 Convierte el DTO en un objeto plano para evitar instancias de clases
    const plainClientData = clientData as unknown as { username: string; password: string };

    console.log('📌 Datos después de conversión:', plainClientData);
    
    const existingClient = await this.clientModel.findOne({ username: plainClientData.username }).exec();
    if (existingClient) {
      throw new BadRequestException('Este nombre de usuario ya está registrado.');
    }

    const hashedPassword = await bcrypt.hash(plainClientData.password, 10);

    const newClient = new this.clientModel({
      username: plainClientData.username,
      password: hashedPassword, 
      acceptedTerms: false,
      rfcList: [],
    });

    return newClient.save();
}


  /**
   * 📌 ACTUALIZAR CLIENTE (incluye actualización de contraseña si se envía)
   */
  async updateClient(id: string, updateClientDto: UpdateClientDto) {
    if (updateClientDto.password) {
      updateClientDto.password = await bcrypt.hash(updateClientDto.password, 10);
    }
    return this.clientModel.findByIdAndUpdate(id, updateClientDto, { new: true }).select('-password').exec();
  }

  /**
   * 📌 ELIMINAR CLIENTE Y SUS ARCHIVOS
   */
  async deleteClientByQuery(name?: string) {
    if (!name) {
      throw new NotFoundException('Debe proporcionar un nombre de usuario para eliminar.');
    }

    // Buscar el cliente por nombre
    const client = await this.clientModel.findOne({ name }).exec();
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Buscar y eliminar archivos asociados en MongoDB y S3
    const clientFiles = await this.fileModel.find({ rfc: client.username }).exec();
    for (const file of clientFiles) {
      try {
        await this.s3.deleteObject({
          Bucket: this.configService.awsBucketName,
          Key: file.s3Key,
        }).promise();
      } catch (error) {
        console.error(`Error al eliminar archivo en S3: ${file.s3Key}`, error);
      }
    }

    await this.fileModel.deleteMany({ rfc: client.username }).exec();
    await this.clientModel.deleteOne({ _id: client._id }).exec();

    return { message: 'Cliente y archivos eliminados correctamente' };
  }

  /**
   * 📌 BÚSQUEDA EN VIVO DE CLIENTES
   */
  async searchClients(query: string) {
    return this.clientModel.find({ name: { $regex: query, $options: 'i' } }).select('-password').exec();
  }

}
