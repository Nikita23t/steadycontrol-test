import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Categories } from 'src/schemas/categories.schema';
import { Topics } from 'src/schemas/topics.schema';

@Injectable()
export class ParserService {
  private baseUrl = 'https://rutracker.org/forum/';
  private cookie = '';
  private readonly logger = new Logger(ParserService.name);

  constructor(
    @InjectModel('Categories') private categoryModel: Model<Categories>,
    @InjectModel('Topics') private topicModel: Model<Topics>,
  ) {}

  async login(username: string, password: string): Promise<void> {
    const res = await axios.post(
      'https://rutracker.org/forum/login.php',
      new URLSearchParams({
        login_username: username,
        login_password: password,
        login: 'Вход',
      }),
      { maxRedirects: 0, validateStatus: null },
    );

    const cookies = res.headers['set-cookie'];
    if (!cookies) throw new Error('Не удалось получить cookie после логина');

    const coki = this.cookie = cookies.map(c => c.split(';')[0]).join('; ');
    this.logger.log('Успешно залогинились и получили cookie');
    this.logger.log(coki)
  }

  async saveCategory(
    name: string,
    url: string,
    subcategories: { name: string; url: string }[]
  ) {
    const result = await this.categoryModel.updateOne(
      { name },
      { name, url, subcategories },
      { upsert: true },
    );
    this.logger.log(`📁 Категория "${name}" сохранена/обновлена: ${JSON.stringify(result)}`);
    return result;
  }
  

  async parseAllCategories() {
    this.logger.log('Парсим все категории и подкатегории');
  
    const res = await axios.get(this.baseUrl + 'index.php', {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });
  
    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);
  
    const categories: {
      name: string;
      url: string;
      subcategories: { name: string; url: string }[];
    }[] = [];
  
    $('div.category').each((_, catElem) => {
      const categoryName = $(catElem).find('h3.cat_title a').text().trim();
      const categoryUrl = this.baseUrl + $(catElem).find('h3.cat_title a').attr('href')?.trim();
  
      const subcategories: { name: string; url: string }[] = [];
  
      $(catElem)
        .find('table.forums tr[id^="f-"]')
        .each((_, tr) => {
          const link = $(tr).find('a[href^="viewforum.php"]');
          const name = link.text().trim();
          const url = this.baseUrl + link.attr('href');
          if (name && url) {
            subcategories.push({ name, url });
          }
        });
  
      categories.push({
        name: categoryName,
        url: categoryUrl,
        subcategories,
      });
    });
  
    for (const cat of categories) {
      await this.saveCategory(cat.name, cat.url, cat.subcategories);
    }
  
    this.logger.log(`Спарсили и сохранили ${categories.length} категорий`);
  }
  
  


}
