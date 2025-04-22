import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
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
    if (!cookies) throw new Error('❌ Не удалось получить cookie после логина');

    const coki = this.cookie = cookies.map(c => c.split(';')[0]).join('; ');
    this.logger.log('✅ Успешно залогинились и получили cookie');
    this.logger.log(coki)
  }

  async saveCategory(name: string, url: string, subcategories: string[]) {
    const result = await this.categoryModel.updateOne(
      { name },
      { name, url, subcategories },
      { upsert: true },
    );
    this.logger.log(`📁 Категория "${name}" сохранена/обновлена: ${JSON.stringify(result)}`);
    return result;
  }

  async parseTopicsFromSubcategory(url: string, subcategoryName: string) {
    this.logger.log(`📥 Начинаем парсинг топиков из: ${url}`);
    const res = await axios.get(url, { headers: { Cookie: this.cookie } });
    const $ = cheerio.load(res.data);

    const elements = $('tr.hl-tr');

    this.logger.log(`🔍 Найдено топиков: ${elements.length}`);

    const promises = elements.map(async (_, el) => {
      try {
        const title = $(el).find('.t-title a').text().trim();
        const topicHref = $(el).find('.t-title a').attr('href');
        if (!topicHref) {
          this.logger.warn(`❗️ Пропущен топик без ссылки`);
          return;
        }
        const topicUrl = this.baseUrl + topicHref;
        const author = $(el).find('.t-author').text().trim();
        const releaseDateText = $(el).find('.row4.small').last().text().trim();
        const releaseDate = new Date(); // доработать можно позже

        const topicDetails = await this.parseTopicDetails(topicUrl);

        const topicData = {
          title,
          description: topicDetails.description,
          releaseDate,
          author,
          magnetLink: topicDetails.magnet,
          torrentFileUrl: topicDetails.torrent,
          thanks: topicDetails.thanks as any,
          topicUrl,
          subcategory: subcategoryName,
        };

        const result = await this.topicModel.updateOne(
          { title },
          topicData,
          { upsert: true },
        );

        this.logger.log(`✅ Сохранён топик "${title}" | Обновлено: ${result.modifiedCount}, Вставлено: ${result.upsertedCount}`);
      } catch (error) {
        this.logger.error(`❌ Ошибка при парсинге одного из топиков: ${error.message}`);
      }
    });

    await Promise.all(promises.get());
    this.logger.log('🏁 Парсинг топиков завершён');
  }

  async parseTopicDetails(url: string) {
    try {
      const res = await axios.get(url, { headers: { Cookie: this.cookie } });
      const $ = cheerio.load(res.data);

      const magnet = $('a[href^="magnet:?xt="]').attr('href') || '';
      const torrent = $('a[href^="dl.php"]').attr('href')
        ? this.baseUrl + $('a[href^="dl.php"]').attr('href')
        : '';
      const description = $('#topic_main').text().trim();

      const thanks: { name: string; date: Date }[] = [];
      $('#thx_list .thanked-users > div').each((_, el) => {
        const name = $(el).find('b').text().trim();
        const date = new Date(); // доработать если формат будет известен
        thanks.push({ name, date });
      });

      return { magnet, torrent, description, thanks };
    } catch (err) {
      this.logger.error(`❌ Ошибка при получении деталей топика: ${url} — ${err.message}`);
      return { magnet: '', torrent: '', description: '', thanks: [] };
    }
  }
}
