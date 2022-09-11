/* linebreak-style: ["error", "windows"] */
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

const downloadData = async (pageFolder, parseObject) => {
  axios.get(parseObject.url.toString(), { responseType: 'arraybuffer' })
    .then((res) => {
      fs.writeFile(path.join(pageFolder, parseObject.pathName), res.data);
    })
    .catch((err) => log(`Unsuccessful download with urk ${parseObject.url}\n${err}`));
};

const prepareData = (website, baseDirname, html) => {
  const data = [];
  const $ = cheerio.load(html);
  // пербор элеметов из запроса с фильтарицей
  attributeMapping.forEach((item) => {
    const listElements = $(item.tag).toArray();
    const items = listElements
      .map((element) => $(element))
      .filter((element) => element.attr(item.attr))
      .map((args) => ({
        args,
        url: new URL(args.attr(item.attr), website),
      }));
    // Заменяем html
    items.forEach(({ args, url }) => {
      const slug = urlToFilename(`${url.hostname}${url.pathname}`);
      const pathName = path.join(baseDirname, slug);
      args.attr(item.attr, pathName);
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
      data = prepareData(url, folder, response.data);
      fs.writeFile(path.join(fullDirname, mainFile), data.html);
    });

  data.data.map((filesList) => downloadData(dirname, filesList));
};
export default pageLoader;
