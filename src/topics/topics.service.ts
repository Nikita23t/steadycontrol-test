import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class TopicsService {
  private readonly RPC_URL = `${process.env.LINK_EVM_HAQQ}`;

  constructor(private readonly httpService: HttpService) { }

  
}