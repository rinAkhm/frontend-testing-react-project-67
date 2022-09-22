/* linebreak-style: ["error", "windows"] */
import path from 'path';
import 'axios-debug-log';
import { promises as fs } from 'fs';
import { URL } from 'url';
import debug from 'debug';
import cheerio from 'cheerio';
import axios from 'axios';
import { prepareName, processName } from './helper.js';

const date = () => new Date().toISOString();

const log = debug('page-loader');
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

const downloadData = (dirname, files, { url, slug }) => {
  const fullPath = path.join(dirname, files, slug);
  const myUrl = url.toString();
  axios.get(myUrl, { responseType: 'arraybuffer' })
    .then((response) => fs.writeFile(fullPath, response.data))
    .catch((err) => {
      throw new Error(`Failed to save ${fullPath}. error: ${err.message}`);
    });
};

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

const pageLoader = async (pathUrl, pathFolder = '') => {
  log(`[${date()}] Inputed url ${pathUrl}`);
  log(`[${date()}] Inputed pathFolder ${pathFolder}`);
  const url = new URL(pathUrl);
  const folder = prepareName(`${url.hostname}${url.pathname}`, 'files');
  const mainFile = processName(`${url.hostname}${url.pathname}`);
  const dirname = path.resolve(process.cwd(), pathFolder);
  const fullDirname = path.join(dirname, folder);
  let data;
  let tasks;

  await fs.access(fullDirname)
    .catch(() => {
      fs.mkdir(fullDirname, { recursive: true });
      log(`[${date()}] Created Folder ${fullDirname}`);
    });

  const promise = axios.get(url.toString())
    .then((response) => {
      data = prepareData(url, folder, response.data);
    })
    .then(() => {
      tasks = data.items.map((filesList) => {
        log(`[${date()}] url ${filesList.url}`);
        log(`[${date()}] fileName ${filesList.slug}`);
        return downloadData(dirname, folder, filesList);
      });
      return Promise.all(tasks);
    })
  
    .then(() => {
      log(`[${date()}] It was created the mainHtml`);
      return fs.writeFile(path.join(dirname, mainFile), data.html);
    })
    
    .then(() => ({ filepath: path.join(dirname, mainFile) }));
  log(`[${date()}] Successfully completed script ${mainFile}`);
  return promise;
};
export default pageLoader;
