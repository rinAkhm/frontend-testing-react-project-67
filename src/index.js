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

const attributeMapping = {
  link: 'href',
  script: 'src',
  img: 'src',
};

const prepareAssets = (website, baseDirname, html) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const assets = [];
  Object.entries(attributeMapping).forEach(([tagName, attrName]) => {
    const $elements = $(tagName).toArray();
    const elementsWithUrls = $elements.map((element) => $(element))
      .filter(($element) => $element.attr(attrName))
      .map(($element) => ({ $element, url: new URL($element.attr(attrName), website) }))
      .filter(({ url }) => url.origin === website);

    elementsWithUrls.forEach(({ $element, url }) => {
      const slug = processName(`${url.hostname}${url.pathname}`);
      const filepath = path.join(baseDirname, slug);
      assets.push({ url, filename: slug });
      $element.attr(attrName, filepath);
    });
  });

  return { html: $.html(), assets };
};

const downloadAsset = (dirname, { url, filename }) => (
  axios.get(url.toString(), { responseType: 'arraybuffer' })
    .then((response) => {
      const fullPath = path.join(dirname, filename);
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
      data = prepareAssets(url.origin, folder, response.data);
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
      const tasks = data.assets.map((asset) => {
        log('asset', asset.url.toString(), asset.filename);
        return downloadAsset(fullDirname, asset).catch(_.noop);
      });
      return Promise.all(tasks);
    })
    .then(() => ({ filepath: fullOutputFilename }));
  log(`[${date()}] Successfully completed script ${mainFile}`);
  return promise;
};
export default pageLoader;
