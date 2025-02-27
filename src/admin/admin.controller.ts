import { Controller, Get, Post, Delete, Patch, Body, UseGuards, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClientDto } from '../clients/dto/create-client.dto';
import { UpdateClientDto } from '../clients/dto/update-client.dto';
import { query } from 'express';

@Controller('admin')
@UseGuards(JwtAuthGuard) // 🔹 Protege todas las rutas con autenticación
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * 📌 OBTENER CLIENTES (Protegido con JWT)
   */
  @Get('clients')
  async getClients() {
    return this.adminService.getClients();
  }

  /**
   * 📌 BÚSQUEDA EN VIVO DE CLIENTES (Protegido con JWT)
   */
  @Get('clients/search')
  async searchClients(@Query('query') query: string) {
    return this.adminService.searchClients(query);
  }

  /**
   * 📌 CREAR CLIENTE (Protegido con JWT)
   */
  @Post('clients')
  async createClient(@Body() clientData: CreateClientDto) {
      console.log('📌 Datos recibidos en el controlador:', clientData);
      console.log('📌 Tipo de clientData:', typeof clientData);
      return this.adminService.createClient(clientData);
  }
  

  /**
   * 📌 ACTUALIZAR CLIENTE (Protegido con JWT)
   */
  @Patch('clients/:id')
  async updateClient(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.adminService.updateClient(id, updateClientDto);
  }

  /**
   * 📌 ELIMINAR CLIENTE POR NOMBRE (Protegido con JWT)
   */
  @Delete('clients/:username')
  async deleteClient(@Param('username') username: string) {
    return this.adminService.deleteClientByQuery(username);
  }


}
