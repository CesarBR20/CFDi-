import { Injectable, BadRequestException, NotFoundException, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as AWS from 'aws-sdk';
import { ConfigService } from '../config/config.service';
import { FileUpload } from './schemas/file-upload.schema';
import { Client } from '../clients/schemas/client.schema';
import { CFDI } from '../cfdi/schemas/cfdi.schema';
import * as XLSX from 'xlsx';
import * as xml2js from 'xml2js';
import * as unzipper from 'unzipper';

@Injectable()
export class FileService {
  private s3: AWS.S3;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(FileUpload.name) private readonly fileUploadModel: Model<FileUpload>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(CFDI.name) private readonly cfdiModel: Model<CFDI>,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.awsAccessKeyId,
      secretAccessKey: this.configService.awsSecretAccessKey,
      region: "us-east-1",
      httpOptions: { 
        timeout: 60000,
        connectTimeout: 30000,
       },
       maxRetries: 5,
    });
  }

  /**
   * 📌 SUBIR ARCHIVOS (ZIP y XLSX) A S3 Y REGISTRARLOS EN LA BASE DE DATOS
   */
  async uploadFiles(files: Express.Multer.File[], username: string) {
    console.log(`📌 Recibiendo archivos para el usuario: ${username}`);
    console.log(`📦 Total de archivos recibidos: ${files.length}`);

    if (!files || files.length === 0) {
      console.error("❌ No se han subido archivos.");
      throw new BadRequestException('No se han subido archivos.');
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    const uploadFolder = `${username}/${timestamp}`;

    console.log(`📂 Carpeta de subida en S3: ${uploadFolder}`);

    // 🔹 Buscar el archivo RFC.xlsx
    const xlsxFile = files.find(file => file.originalname.toLowerCase() === 'rfc.xlsx');
    if (!xlsxFile) {
      console.error("❌ Error: No se encontró el archivo rfc.xlsx");
      throw new BadRequestException('Debe incluir un archivo llamado "rfc.xlsx" con los RFCs.');
    }

    console.log("✅ Archivo rfc.xlsx encontrado. Procesando...");
    const rfcList = await this.processXLSX(xlsxFile, username);

    // 🔹 Filtrar los archivos ZIP
    const zipFiles = files.filter(file => file.mimetype === 'application/x-zip-compressed');
    if (zipFiles.length === 0) {
      console.error("❌ No se encontraron archivos ZIP en la subida.");
      throw new BadRequestException('Debe incluir al menos un archivo ZIP con XMLs.');
    }

    console.log(`📦 Archivos ZIP detectados: ${zipFiles.length}`);

    try {
      // 📌 Subir ZIPs a S3
      console.log("⬆️ Subiendo archivos ZIP a S3...");
      const uploadedZips = await Promise.all(zipFiles.map(file => this.uploadFileToS3(file, uploadFolder)));

      console.log("✅ Todos los archivos ZIP han sido subidos correctamente.");

      // 📌 Guardar en MongoDB el registro de la subida
      const uploadRecord = new this.fileUploadModel({
        clientUsername: username,
        uploadDate: new Date(),
        uploadFolder,
        rfcList,
        zipFiles: uploadedZips,
      });

      await uploadRecord.save();
      console.log("✅ Registro de subida guardado en la base de datos.");

      return { message: 'Archivos subidos correctamente', uploadId: uploadRecord._id };
    } catch (error) {
      console.error("❌ Error general en la subida de archivos:", error);
      throw new InternalServerErrorException('Error al subir los archivos.');
    }
  }

  /**
   * 📌 PROCESAR ARCHIVO XLSX PARA EXTRAER RFCs
   */
  async processXLSX(file: Express.Multer.File, username: string): Promise<string[]> {
    try {
      console.log(`📂 Procesando archivo XLSX: ${file.originalname}`);

      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        console.error("❌ El archivo XLSX no tiene hojas válidas.");
        throw new BadRequestException('El archivo XLSX no tiene hojas válidas.');
      }

      const sheet = workbook.Sheets[sheetName];
      const data: { RFC?: string }[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

      const rfcList: string[] = data.map(row => row.RFC?.trim() || '').filter(rfc => rfc !== '');
      if (rfcList.length === 0) {
        console.error("❌ El archivo XLSX no contiene RFCs válidos.");
        throw new BadRequestException('El archivo XLSX no contiene RFCs válidos.');
      }

      await this.clientModel.updateOne({ username }, { $set: { rfcList } });

      console.log(`✅ RFCs extraídos y guardados en BD para el usuario: ${username}`);

      return rfcList;
    } catch (error) {
      console.error(`❌ Error procesando XLSX: ${error.message}`);
      throw new InternalServerErrorException('Error al procesar el archivo XLSX.');
    }
  }

  /**
   * 📌 SUBIR ARCHIVO ZIP A S3
   */
  async uploadFileToS3(file: Express.Multer.File, folder: string) {
    const safeFilename = file.originalname.replace(/[\s\(\)\+]/g, '_');
    const fileKey = `${folder}/${safeFilename}`;

    console.log(`📤 Subiendo archivo a S3: ${fileKey}`);

    const params = {
      Bucket: this.configService.awsBucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const uploadResult = await this.s3.upload(params).promise();
      console.log(`✅ Archivo subido a S3: ${uploadResult.Location}`);
      return { filename: file.originalname, s3Url: uploadResult.Location };
    } catch (error) {
      console.error(`❌ Error al subir ${file.originalname} a S3:`, error.message);
      throw new InternalServerErrorException(`Error al subir ${file.originalname}`);
    }
  }

  /**
   * 📌 PROCESAR CFDIs DESDE ARCHIVOS ZIP EN S3
   */
  async processCFDIsFromS3(username: string) {
    const client = await this.clientModel.findOne({ username }).exec();
    if (!client) {
      throw new NotFoundException('Cliente no encontrado.');
    }
  
    const rfcList = client.rfcList || [];
  
    const lastUpload = await this.fileUploadModel.findOne({ clientUsername: username }).sort({ uploadDate: -1 }).exec();
    if (!lastUpload) {
      throw new NotFoundException('No se encontraron archivos para procesar.');
    }
  
    console.log(`📌 Procesando archivos de la carpeta: ${lastUpload.uploadFolder}`);
    console.log('📂 Archivos ZIP a procesar:', lastUpload.zipFiles);
  
    const zipFiles = lastUpload.zipFiles;
    if (!zipFiles || zipFiles.length === 0) {
      throw new NotFoundException('No hay archivos ZIP para procesar.');
    }
  
    await Promise.all(zipFiles.map(file => {
      console.log(`⏳ Intentando procesar: ${file.s3Url}`);
      return this.processZIP(file.s3Url, rfcList, username);
    }));
  
    return { message: 'CFDIs procesados correctamente' };
  }
  

  /**
   * 📌 PROCESAR ARCHIVO ZIP DESDE S3 Y EXTRAER XMLs
   */
  async processZIP(fileUrl: string, rfcList: string[], username: string) {
    console.log(`⏳ Procesando archivo ZIP desde S3: ${fileUrl}`);

    const decodedUrl = decodeURIComponent(fileUrl);
    const fileKey = decodedUrl.split('.com/')[1];

    const params = {
        Bucket: this.configService.awsBucketName,
        Key: fileKey,
    };

    try {
        console.log(`📥 Descargando archivo desde S3: ${fileKey}`);
        const s3Stream = this.s3.getObject(params).createReadStream();
        
        // Descargar el archivo ZIP
        const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            s3Stream.on('data', chunk => chunks.push(chunk));
            s3Stream.on('end', () => resolve(Buffer.concat(chunks)));
            s3Stream.on('error', reject);
        });

        console.log(`📦 Archivo ZIP descargado. Procesando contenido...`);

        // Abrir el archivo ZIP
        const zip = await unzipper.Open.buffer(fileBuffer);
        const xmlFiles = zip.files.filter(file => file.path.endsWith('.xml'));

        console.log(`📄 Archivos XML encontrados: ${xmlFiles.length}`);

        const groupedCFDIs = new Map<string, any>(); // Para agrupar CFDIs dentro de la carga actual

        for (const file of xmlFiles) {
            const cfdiData = await this.processXML(file, rfcList, username);

            if (!cfdiData) continue; // Si es nulo, no lo procesamos

            // 🔹 Generamos una clave única por emisor, receptor y claveProdServ
            const key = `${cfdiData.emisorRfc}_${cfdiData.receptorRfc}_${cfdiData.claveProdServ}`;

            if (groupedCFDIs.has(key)) {
                // 🔥 Si ya existe en la carga actual, sumamos los valores
                const existingData = groupedCFDIs.get(key);
                existingData.total += cfdiData.total;
                existingData.totalMXN += cfdiData.totalMXN;
            } else {
                // 🔹 Si es un nuevo registro en la carga actual, lo guardamos
                groupedCFDIs.set(key, cfdiData);
            }
        }

        // Guardamos todos los CFDIs procesados en la BD como un nuevo lote de registros
        if (groupedCFDIs.size > 0) {
            console.log(`✅ Guardando ${groupedCFDIs.size} CFDIs en la base de datos...`);
            await this.cfdiModel.insertMany(Array.from(groupedCFDIs.values()));
        } else {
            console.warn("⚠️ No se guardó ningún CFDI, puede que no haya coincidencias en RFCs.");
        }

    } catch (error) {
        console.error(`❌ Error al procesar ZIP: ${error.message}`);
        throw new NotFoundException(`No se pudo procesar el archivo ZIP.`);
    }
  }
  
  /**
     * 📌 PROCESAR CFDI DESDE UN XML (Mejorado para `ClaveProdServ` y conversión a MXN)
     */
  async processXML(file: unzipper.File, rfcList: string[], username: string) {
    try {
        const content = await file.buffer();
        const fileName = file.path;

        const parser = new xml2js.Parser({ explicitArray: false });
        const xmlData = await parser.parseStringPromise(content.toString());

        if (!xmlData['cfdi:Comprobante']) {
            throw new BadRequestException(`El archivo no tiene la estructura de un CFDI válido.`);
        }

        // 📌 Extraer datos del XML
        const emisorRfc = xmlData['cfdi:Comprobante']['cfdi:Emisor']?.$?.Rfc?.trim() || '';
        const emisorNombre = xmlData['cfdi:Comprobante']['cfdi:Emisor']?.$?.Nombre?.trim() || '';
        const receptorRfc = xmlData['cfdi:Comprobante']['cfdi:Receptor']?.$?.Rfc?.trim() || '';
        const receptorNombre = xmlData['cfdi:Comprobante']['cfdi:Receptor']?.$?.Nombre?.trim() || '';

        // 🔹 Extraer ClaveProdServ
        let claveProdServ = 'NO_ESPECIFICADO';
        const conceptos = xmlData['cfdi:Comprobante']['cfdi:Conceptos'];
        if (conceptos) {
            const conceptosArray = Array.isArray(conceptos['cfdi:Concepto']) ? conceptos['cfdi:Concepto'] : [conceptos['cfdi:Concepto']];
            for (const concepto of conceptosArray) {
                if (concepto?.$?.ClaveProdServ) {
                    claveProdServ = concepto.$.ClaveProdServ.trim();
                    break; // Tomamos la primera ClaveProdServ que encontremos
                }
            }
        }

        const moneda = xmlData['cfdi:Comprobante']?.$?.Moneda?.trim() || 'MXN';
        const tipoCambio = parseFloat(xmlData['cfdi:Comprobante']?.$?.TipoCambio) || 1;
        const subTotal = parseFloat(xmlData['cfdi:Comprobante']?.$?.SubTotal) || 0;
        const totalMXN = moneda === 'MXN' ? subTotal : subTotal * tipoCambio;

        // 🔹 Extraer periodo desde la fecha del CFDI
        const fecha = xmlData['cfdi:Comprobante']?.$?.Fecha?.trim();
        if (!fecha) throw new BadRequestException(`El CFDI no tiene fecha.`);
        const periodo = fecha.substring(0, 7); // 🔥 Extraer el formato YYYY-MM (Año-Mes)

        // ✅ Solo procesamos si el RFC del emisor y receptor están en el XLSX actual
        if (!rfcList.includes(emisorRfc) || !rfcList.includes(receptorRfc)) {
            console.warn(`⚠️ CFDI ignorado: ${fileName} - RFCs no coinciden con los del XLSX.`);
            return null;
        }

        // 📌 Guardar CFDI con los campos requeridos
        const cfdiData: Partial<CFDI> = {
            clientUsername: username,
            emisorRfc,
            emisorNombre,
            receptorRfc,
            receptorNombre,
            claveProdServ,
            moneda,
            tipoCambio,
            total: subTotal,
            totalMXN,
            periodo,
            uploadDate: new Date()
        };

        return cfdiData; // Se devuelve para ser procesado en el agrupamiento

    } catch (error) {
        console.error(`❌ Error procesando CFDI: ${error.message}`);
        return null;
    }
  }

  /**
   * 📌 OBTENER TODAS LAS CARGAS DE UN CLIENTE
   */
  async getUploadsByClient(username: string) {
    return this.fileUploadModel.find({ clientUsername: username }).select('-zipFiles').exec();
  }

  /**
   * 📌 OBTENER CFDIs FILTRADOS POR RFCs DEL CLIENTE
   */
  async getRFCRelationships(username: string) {
    const client = await this.clientModel.findOne({ username }).exec();
    if (!client) {
      throw new NotFoundException('Cliente no encontrado.');
    }
  
    // 📌 Obtener la última carga del usuario
    const lastUpload = await this.fileUploadModel
      .findOne({ clientUsername: username })
      .sort({ uploadDate: -1 }) // Ordenamos por fecha descendente
      .exec();
  
    if (!lastUpload) {
      throw new NotFoundException('No se encontró ninguna carga reciente.');
    }
  
    return this.cfdiModel.find({
      clientUsername: username,
      uploadDate: { $gte: lastUpload.uploadDate }, // Filtra los CFDIs de la última carga
      $or: [{ emisorRfc: { $in: client.rfcList } }, { receptorRfc: { $in: client.rfcList } }],
    }).exec();
  }
  
  

  /**
  * 📌 Descargar formato XLSX para RFC
  */
  async generateSignedUrl(clientId: string) {
    const client = await this.clientModel.findById(clientId);
    if (!client) {
      throw new ForbiddenException('Cliente no encontrado.');
    }

    const params = {
      Bucket: this.configService.awsBucketName,
      Key: 'templates/rfc.xlsx', 
      Expires: 60 * 5, // 📌 5 minutos de validez
    };

    const url = await this.s3.getSignedUrlPromise('getObject', params);
    return { downloadUrl: url };
  }
}