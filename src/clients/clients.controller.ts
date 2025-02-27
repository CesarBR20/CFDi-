import { 
  Controller, Get, Post, Patch, Body, UseGuards, Req, Query, Res 
} from '@nestjs/common';
import { ClientService } from './clients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import * as path from 'path';
import { Response } from 'express';

@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  async createClient(@Body() createClientDto: CreateClientDto) {
    return this.clientService.createClient(createClientDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getClients() {
    return this.clientService.getClients();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateClient(@Req() req, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.updateClient(req.user.sub, updateClientDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('accept-terms')
  async acceptTerms(@Req() req, @Body('accepted') accepted: boolean) {
      console.log(`📌 Recibida solicitud para aceptar términos: ${accepted} para el usuario: ${req.user.sub}`);
  
      const updatedClient = await this.clientService.acceptTerms(req.user.sub, accepted);
      console.log('✅ Cliente actualizado:', updatedClient);
  
      return updatedClient;
  } 

  @Get('download-template')
  async downloadTemplate(@Res() res: Response) {
    const filePath = path.join(__dirname, '../../assets/template.xlsx');
    res.download(filePath);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cfdis')
  async getClientCFDIs(@Query('username') username: string) {
    return this.clientService.getCFDIsForClient(username);
  }  

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchClients(@Query('name') name: string) {
    return this.clientService.searchClientsByName(name);
  }  

}

