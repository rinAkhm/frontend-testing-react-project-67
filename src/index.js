/* eslint linebreak-style: ["error", "unix"] */
import path from 'path';
import { promises as fs } from 'fs';
import { URL } from 'url';
import debug from 'debug';
import cheerio from 'cheerio';
import axios from 'axios';
import { prepareName, urlToFilename } from './helper.js';

const log = debug('page-loader');

const getData = async (url) => {
  const res = axios.get(url);
  return res;
};

/* const dataFake = '<html lang="ru"> <head>
<meta charset="utf-8"> <title>Курсы по программированию Хекслет</title>
</head> <body> <img src="/assets/professions/nodejs.png"
 alt="Иконка профессии Node.js-программист" />
 <h3> <a href="/professions/nodejs">Node.js-программист</a> </h3> </body> </html>'; */

const attributeMapping = [
  {
    tag: 'img',
    attr: 'src',
  },
];

const prepareData = (website, baseDirname, html) => {
  const data = [];
  const $ = cheerio.load(html, { decodeEntities: false });
  // пербор элеметов из запроса с фильтарицей
  attributeMapping.forEach((item) => {
    const listElements = $(item.tag).toArray();
    const items = listElements
      .map((element) => $(element))
      .filter((element) => element.attr(item.attr))
      .map((args) => ({
        args,
        url: args.attr(item.attr),
        pathName: urlToFilename(path.join(website, args.attr(item.attr))),
      }));
    // Заменяем html
    items.forEach(({ args, pathName, url }) => {
      const tmp = path.join(baseDirname, pathName);
      args.attr(item.attr, tmp);
      data.push({ url, pathName });
    });
  });
  return { html: $.html(), data };
};

const pageLoader = async (pathUrl, pathFolder = '') => {
  const url = new URL(pathUrl);
  const folder = prepareName(`${url.hostname}${url.pathname}`, 'files');
  const mainFile = urlToFilename(`${url.hostname}${url.pathname}`);
  const dirname = path.resolve(process.cwd(), pathFolder);
  const fullDirname = path.join(dirname, folder);
  let data;
  await fs.access(fullDirname)
    .then(() => log('foleds were created'))
    .catch(() => {
      log(`It is process creating folder ${fullDirname}`);
      fs.mkdir(fullDirname, { recursive: true });
    });

  await getData(url.toString())
    .then((response) => {
      data = prepareData(url.origin, folder, response.data);
      fs.writeFile(path.join(fullDirname, mainFile), data.html);
    });
};
export default pageLoader;
