import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CategoriesService {
  private readonly RPC_URL = `${process.env.LINK_COSMOS}`;

  
}