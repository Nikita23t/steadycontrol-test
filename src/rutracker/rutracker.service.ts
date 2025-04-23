import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Categories } from 'src/schemas/categories.schema';
import { Topic, TopicSchema } from 'src/schemas/topics.schema';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';

@Injectable()
export class RutrackerService {
  private baseUrl = 'https://rutracker.org/forum/';
  private cookie = '';
  private readonly logger = new Logger(RutrackerService.name);

  constructor(
    @InjectModel('Categories') private categoryModel: Model<Categories>,
    @InjectModel('Topics') private topicModel: Model<TopicSchema>,
  ) {}

  async login() {
    const res = await axios.post(
      'https://rutracker.org/forum/login.php',
      new URLSearchParams({
        login_username: `${process.env.USERNAME}`,
        login_password: `${process.env.PASSWORD}`,
        login: 'Вход',
      }),
      { maxRedirects: 0, validateStatus: null },
    );

    const cookies = res.headers['set-cookie'];
    if (!cookies) throw new Error('не удалось получить куки');

    const coki = this.cookie = cookies.map(c => c.split(';')[0]).join('; ');
    this.logger.log('Удалось аойти и получить куки');
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
    this.logger.log(`Категория "${name}" сохранена ${JSON.stringify(result)}`);
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
  
    this.logger.log(`сохранили ${categories.length} категорий`);
  }
  
  async parseTopicsFromSubcategory(subcategoryUrl: string) {
    if (!this.cookie) {
      await this.login();
    }
  
    const res = await axios.get(subcategoryUrl, {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });
  
    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);
  
    const topics: Topic[] = [];
  
    $('tr.hl-tr').each((_, el) => {
      const topicLink = $(el).find('a.tLink');
      const title = topicLink.text().trim();
      const url = this.baseUrl + topicLink.attr('href');
  
      if (title && url) {
        topics.push({ title, url });
      }
    });
  
    this.logger.log(`найдено ${topics.length} топиков`);
  
    let saved = 0;
  
    for (const topic of topics.slice(0, 100)) {
      const data = await this.parseTopicDetails(topic.url);
      if (data) {
        await this.topicModel.updateOne(
          { url: data.url },
          { $set: data },
          { upsert: true }
        );
        saved++;
      }
    }
  
    this.logger.log(`сохранено ${saved} топиков`);
    return `сохранено ${saved} топиков`;
  }
  

  async parseTopicDetails(url: string) {
    const res = await axios.get(url, {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });
  
    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);
  
    const title = $('div#topic_main h1').text().trim();
    const post = $('div.post_body').first();
  
    const author = $('p.post-head a.gen').first().text().trim();
    const postedAt = $('div.posted_since').text().trim();
  
    const details: Record<string, string> = {};
    post.find('span.post-label').each((_, el) => {
      const key = $(el).text().trim().replace(':', '');
      const val = $(el).next().text().trim();
      if (key && val) details[key] = val;
    });
  
    const desc = post.find('span[style*="font-size"]').text().trim();
    if (desc) {
      details['Описание'] = desc;
    }
  
    const magnetLink = post.find('a[href^="magnet:?xt=urn"]').attr('href') || '';
    const torrentFileLink = this.baseUrl + $('div#tor-action-menu a[title="Скачать .torrent"]').attr('href') || '';
  
    const thanks: { username: string; date: string }[] = [];
    $('div.thank > b > a').each((_, el) => {
      const username = $(el).text().trim();
      const date = $(el).parent().next('i').text().trim();
      if (username && date) thanks.push({ username, date });
    });
  
    return {
      title,
      url,
      author,
      postedAt,
      magnetLink,
      torrentFileLink,
      details,
      thanks,
    };
  }

}
