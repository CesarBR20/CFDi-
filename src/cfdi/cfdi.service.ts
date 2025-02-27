import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CFDI } from '../cfdi/schemas/cfdi.schema';
import { Client } from '../clients/schemas/client.schema';
import * as XLSX from 'xlsx';

@Injectable()
export class CfdiService {
  constructor(
    @InjectModel(CFDI.name) private readonly cfdiModel: Model<CFDI>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
  ) {}

  /**
   * 📌 Guardar CFDI en la base de datos (actualiza si ya existe)
   */
  async saveCFDI(data: CFDI) {
    return this.cfdiModel.updateOne(
      { emisorRfc: data.emisorRfc, receptorRfc: data.receptorRfc, claveProdServ: data.claveProdServ },
      { $set: data },
      { upsert: true }
    );
  }

  /**
   * 📌 Obtener todos los CFDIs sin filtros (solo admin)
   */
  async getAllCFDIs() {
    return this.cfdiModel.find().exec();
  }

  /**
   * 📌 Obtener CFDIs filtrados por RFC del cliente (cliente autenticado)
   */
  async getCFDIsForClient(username: string) {
    const client = await this.clientModel.findOne({ username }).exec();
    if (!client) {
        throw new NotFoundException('Cliente no encontrado');
    }

    if (!client.rfcList || client.rfcList.length === 0) {
        throw new BadRequestException('El cliente no ha subido un archivo XLSX con RFCs.');
    }

    // 🔹 Eliminar RFCs duplicados
    const uniqueRfcs = [...new Set(client.rfcList)];
    console.log('📌 RFCs del cliente (limpios):', uniqueRfcs);

    // 🔹 Ver todos los RFCs guardados en la base de datos (para depuración)
    const allCfdis = await this.cfdiModel.find().select('emisorRfc receptorRfc').exec();
    console.log('📌 Todos los receptorRfc en la base de datos:', allCfdis.map(c => c.receptorRfc));

    // 🔹 Buscar CFDIs donde el RFC del cliente sea EMISOR o RECEPTOR y el otro RFC también sea del cliente
    const cfdis = await this.cfdiModel.find({
        $or: [
            { emisorRfc: { $in: uniqueRfcs }, receptorRfc: { $in: uniqueRfcs } }, // Cliente como emisor
            { receptorRfc: { $in: uniqueRfcs }, emisorRfc: { $in: uniqueRfcs } }  // Cliente como receptor
        ]
    }).exec();

    console.log('📌 CFDIs encontrados:', cfdis);

    return cfdis;
}

  /**
   * 📌 Exportar CFDIs a formato XLSX (clientes)
   */
  async exportCFDIsToXLSX(username: string) {
    const client = await this.clientModel.findOne({ username }).exec();
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }
    if (!client.rfcList || client.rfcList.length === 0) {
      throw new BadRequestException('El cliente no ha subido un archivo XLSX con RFCs.');
    }

    const cfdis = await this.getCFDIsForClient(username);

    if (!cfdis.length) {
      throw new NotFoundException('No hay CFDIs disponibles para exportar.');
    }

    const data = cfdis.map(cfdi => ({
      RFC_Emisor: cfdi.emisorRfc,
      Nombre_Emisor: cfdi.emisorNombre,
      RFC_Receptor: cfdi.receptorRfc,
      Clave_Prod_Serv: cfdi.claveProdServ,
      Periodo: cfdi.periodo,
      Monto_Pesos: cfdi.total,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CFDIs');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
