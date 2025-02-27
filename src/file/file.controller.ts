import { 
  Controller, 
  Post, 
  Get, 
  UseInterceptors, 
  UploadedFiles, 
  BadRequestException, 
  Req, 
  UseGuards 
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * 📌 SUBIR ARCHIVOS (ZIP y XLSX)
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10000)) // Permite hasta 10,000 archivos
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[], @Req() req) {
    console.log("📌 Recibiendo archivos...");
    console.log("Usuario:", req.user?.username);
    console.log("Archivos recibidos:", files);
  
    if (!files || files.length === 0) {
      console.log("❌ No se subieron archivos");
      throw new BadRequestException('No se han subido archivos.');
    }
  
    console.log("✅ Subiendo archivos...");
    return this.fileService.uploadFiles(files, req.user.username);
  }

  /**
   * 📌 PROCESAR CFDIs DESDE ARCHIVOS ZIP EN S3
   */
  @UseGuards(JwtAuthGuard)
  @Post('process-cfdis')
  async processCFDIs(@Req() req) {
    return this.fileService.processCFDIsFromS3(req.user.username);
  }

  /**
   * 📌 LISTAR CARGAS ANTERIORES DEL CLIENTE
   */
  @UseGuards(JwtAuthGuard)
  @Get('uploads')
  async listUploads(@Req() req) {
    return this.fileService.getUploadsByClient(req.user.username);
  }

  /**
   * 📌 LISTAR CFDIs DEL CLIENTE (FILTRADOS)
   */
  @UseGuards(JwtAuthGuard)
  @Get('list-cfdis')
  async listCFDIs(@Req() req) {
    console.log("Usuario autenticado:", req.user);
    return this.fileService.getRFCRelationships(req.user.username);
  }  

  /**
   * 📌 Descargar formato XLSX para RFC
   */
  @UseGuards(JwtAuthGuard)
  @Get('download-excel')
  async getExcelDownloadUrl(@Req() req) {
    return this.fileService.generateSignedUrl(req.user.sub);
  }
  
}