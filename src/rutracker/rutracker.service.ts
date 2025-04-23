import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Categories, Subcategory } from 'src/schemas/categories.schema';
import { ParsedCategory, TopicSchema } from 'src/schemas/topics.schema';
import { TopicsDto } from './dto/topics.dto';
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
  ) { }

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

    this.cookie = cookies.map(c => c.split(';')[0]).join('; ');
    this.logger.log('Успешно залогинились и получили cookie');
  }

  async categories() {
    this.logger.log('Парсим все категории и подкатегории');

    const res = await axios.get(this.baseUrl + 'index.php', {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });

    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);

    const categories: ParsedCategory[] = [];
    const subcategories: Subcategory[] = [];

    $('div.category').each((_, catElem) => {
      const categoryName = $(catElem).find('h3.cat_title a').text().trim();
      const categoryUrl = this.baseUrl + $(catElem).find('h3.cat_title a').attr('href')?.trim();

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

      categories.push({ name: categoryName, url: categoryUrl, subcategories });
    });

    for (const cat of categories) {
      const result = await this.categoryModel.updateOne(
        { name: cat.name },
        { name: cat.name, url: cat.url, subcategories: cat.subcategories },
        { upsert: true },
      );
      this.logger.log(`Категория "${cat.name}" сохранена: ${JSON.stringify(result)}`);
    }

    this.logger.log(`Сохранили ${categories.length} категорий`);
  }

  async topics(body: TopicsDto) {
    this.logger.log('Парсим топики с авторизацией');

    await this.login(body.username, body.password);

    const res = await axios.get(body.url, {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });

    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);

    const rawTopics: { title: string; url: string }[] = [];

    $('a.torTopic').each((_, el) => {
      const title = $(el).text().trim();
      const href = $(el).attr('href')?.trim();
      const url = href ? this.baseUrl + href : '';
      if (title && url) {
        rawTopics.push({ title, url });
      }
    });

    this.logger.log(`Найдено ${rawTopics.length} топиков`);

    let saved = 0;

    for (const topic of rawTopics.slice(0, 100)) {
      await this.login(body.username, body.password);
      const data = await this.parseTopicDetails({ ...topic, username: body.username, password: body.password });

      if (data) {
        await this.topicModel.updateOne(
          { url: data.url },
          { $set: data },
          { upsert: true }
        );
        saved++;
      }
    }
    this.logger.log(`Сохранено ${saved} топиков`);
    return `Сохранено ${saved} топиков`;
  }

  async parseTopicDetails(body: TopicsDto) {
    const res = await axios.get(body.url, {
      headers: { Cookie: this.cookie },
      responseType: 'arraybuffer',
    });

    const decodedData = iconv.decode(res.data, 'win1251');
    const $ = cheerio.load(decodedData);

    const title = $('span.post-b').first().text().trim();
    const post = $('div.post_body').first();
    const author = $('p.nick.nick-author').first().text().trim();
    const postedAt = $('a.p-link.small').text().trim();
    const magnetLink = $('a.med.magnet-link').attr('href') || '';
    const torrentFileLink = $('a.dl-stub.dl-link.dl-topic').attr('href') || '';

    const details: Record<string, string> = {};
    let currentKey = '';

    post.contents().each((_, el) => {
      if (el.type === 'tag' && $(el).is('span.post-b')) {
        currentKey = $(el).text().replace(':', '').trim().replace(/\./g, '__');
      } else if (el.type === 'text' && currentKey) {
        const val = $(el).text().trim();
        if (val) {
          details[currentKey] = val;
          currentKey = '';
        }
      } else if (el.type === 'tag' && $(el).is('br')) {
        currentKey = '';
      }
    });

    const thanks: { username: string; date: string }[] = [];
    $('div.thx-list > a').each((_, el) => {
      const username = $(el).text().trim();
      const date = $(el).parent().next('i').text().trim();
      if (username && date) thanks.push({ username, date });
    });

    return {
      title,
      url: body.url,
      author,
      postedAt,
      magnetLink,
      torrentFileLink,
      details,
      thanks,
    };
  }
}