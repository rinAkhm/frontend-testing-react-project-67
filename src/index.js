/* linebreak-style: ["error", "windows"] */
import { promises as fs } from 'fs';
import axios from 'axios';
import { URL } from 'url';
import _ from 'lodash';
import path from 'path';
import cheerio from 'cheerio';
import debug from 'debug';
import { prepareName, processName } from './helper.js';

const log = debug('page-loader');
const date = () => new Date().toISOString();

const attributeMapping = [
  {
    tag: 'link',
    attr: 'href',
  },
  {
    tag: 'script',
    attr: 'src',
  },
  {
    tag: 'img',
    attr: 'src',
  },
];

const prepareData = (website, folder, html) => {
  const rez = [];
  const $ = cheerio.load(html, { decodeEntities: false });
  // пербор элеметов из запроса с фильтарицей
  attributeMapping.forEach((item) => {
    const listElements = $(item.tag).toArray();
    const items = listElements
      .map((element) => $(element))
      .filter((element) => element.attr(item.attr))
      .map((args) => ({
        args,
        url: new URL(args.attr(item.attr), website),
      }))
      .filter(({ url }) => url.origin === website.origin);
    // Заменяем html
    items.forEach(({ args, url }) => {
      const slug = processName(`${url.hostname}${url.pathname}`);
      args.attr(item.attr, path.join(folder, slug));
      rez.push({ url, slug });
    });
  });

  return { html: $.html(), items: rez };
};

const downloadData = (dirname, { url, slug }) => (
  axios.get(url.toString(), { responseType: 'arraybuffer' })
    .then((response) => {
      const fullPath = path.join(dirname, slug);
      return fs.writeFile(fullPath, response.data);
    })
);

const pageLoader = (pageUrl, outputDirname = '') => {
  log(`[${date()}] Inputed url ${pageUrl}`);
  log(`[${date()}] Inputed pathFolder ${outputDirname}`);
  const url = new URL(pageUrl);
  const slug = `${url.hostname}${url.pathname}`;
  const mainFile = processName(slug);
  const dirname = path.resolve(process.cwd(), outputDirname);
  const fullOutputFilename = path.join(dirname, mainFile);
  const folder = prepareName(slug, 'files');
  const fullDirname = path.join(dirname, folder);

  let data;
  const promise = axios.get(pageUrl)
    .then((response) => {
      data = prepareData(url, folder, response.data);
      log('create (if not exists) directory for assets', fullDirname);
      return fs.access(fullDirname)
        .catch(() => {
          fs.mkdir(fullDirname, { recursive: true });
          log(`[${date()}] Created Folder ${fullDirname}`);
        });
    })
    .then(() => {
      log(`[${date()}] It was created the mainHtml`);
      return fs.writeFile(fullOutputFilename, data.html);
    })
    .then(() => {
      const tasks = data.items.map((filesList) => downloadData(fullDirname, filesList)
        .catch(_.noop()));
      return Promise.all(tasks);
    })
    .then(() => ({ filepath: fullOutputFilename }));
  log(`[${date()}] Successfully completed script ${mainFile}`);
  return promise;
};
export default pageLoader;
