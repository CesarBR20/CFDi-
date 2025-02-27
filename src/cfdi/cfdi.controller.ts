import { Controller, Get, Res, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { CfdiService } from './cfdi.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cfdi') // 🔹 Define la ruta base como `/cfdi`
export class CfdiController {
  constructor(private readonly cfdiService: CfdiService) {}

  /**
   * 📌 Obtener CFDIs filtrados por los RFCs subidos en el XLSX del cliente (clientes)
   */
  @Get('client')
  async getCFDIsForClient(@Req() req) {
    console.log('📌 Usuario autenticado:', req.user);
  
    if (req.user.role !== 'client') {
      throw new NotFoundException('Solo los clientes pueden ver sus CFDIs.');
    }
    return this.cfdiService.getCFDIsForClient(req.user.username);
  }

  /**
   * 📌 Obtener todos los CFDIs (solo admin)
   */
  @Get('all')
  async getAllCFDIs(@Req() req) {
    if (req.user.role !== 'admin') {
      throw new NotFoundException('No tienes permiso para ver todos los CFDIs.');
    }
    return this.cfdiService.getAllCFDIs();
  }

  /**
   * 📌 Exportar CFDIs a XLSX
   */
  @Get('export')
  async exportCFDIs(@Res() res, @Req() req) {
    if (req.user.role !== 'client') {
      throw new NotFoundException('Solo los clientes pueden exportar sus CFDIs.');
    }

    const buffer = await this.cfdiService.exportCFDIsToXLSX(req.user.sub);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="cfdis.xlsx"',
    });

    res.send(buffer);
  }

  
}
