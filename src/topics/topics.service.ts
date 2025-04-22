import { Injectable } from '@nestjs/common';
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
    this.cookie = cookies.map(c => c.split(';')[0]).join('; ');
  }

  async saveCategory(name: string, url: string, subcategories: string[]) {
    return await this.categoryModel.updateOne(
      { name },
      { name, url, subcategories },
      { upsert: true },
    );
  }

  async parseTopicsFromSubcategory(url: string, subcategoryName: string) {
    const res = await axios.get(url, { headers: { Cookie: this.cookie } });
    const $ = cheerio.load(res.data);

    const promises = $('tr.hl-tr').map(async (_, el) => {
      const title = $(el).find('.t-title a').text().trim();
      const topicUrl = this.baseUrl + $(el).find('.t-title a').attr('href');
      const author = $(el).find('.t-author').text().trim();
      const releaseDateText = $(el).find('.row4.small').last().text().trim();
      const releaseDate = new Date(); // можно доработать парсинг

      const topicDetails = await this.parseTopicDetails(topicUrl);

      await this.topicModel.updateOne(
        { title },
        {
          title,
          description: topicDetails.description,
          releaseDate,
          author,
          magnetLink: topicDetails.magnet,
          torrentFileUrl: topicDetails.torrent,
          thanks: topicDetails.thanks as any, // TS workaround для массива объектов
          topicUrl,
          subcategory: subcategoryName,
        },
        { upsert: true },
      );
    });

    await Promise.all(promises.get());
  }

  async parseTopicDetails(url: string) {
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
      const dateText = $(el).find('i').text().trim();
      const date = new Date();
      thanks.push({ name, date });
    });

    return { magnet, torrent, description, thanks };
  }
}