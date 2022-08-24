/* eslint linebreak-style: ["error", "unix"] */
import axios from 'axios';
import debug from 'debug';
import { URL } from 'url';
import { promises as fs } from 'fs';
import path from 'path';

const log = debug('page-loader');

const getData = async (url) => {
  const res = axios.get(url);
  return res;
};

const checkPath = async (path) => fs.access(path);

const prepareName = (url, key) => {
  const name = url.replace(/[\W]+/gi, '-');
  let rez;
  switch (key) {
    case 'folder':
      rez = `${name}_files`;
      break;
    case 'html':
      rez = `${name}.html`;
      break;
    default:
      log('invalid key param');
      break;
  }
  return rez;
};

const pageLoader = async (pathUrl, pathFolder = '') => {
  const url = new URL(pathUrl);
  const folder = prepareName(`${url.hostname}${url.pathname}`, 'folder');
  const filename = prepareName(`${url.hostname}${url.pathname}`, 'html');
  const dirname = path.resolve(process.cwd(), pathFolder);
  const fullDirname = path.join(dirname, folder);
  await checkPath(fullDirname)
    .then(() => console.log('Path is exist'))
    .catch(() => {
      fs.mkdir(fullDirname, { recursive: true });
    });

  await getData(url.toString())
    .then((response) => {
      fs.writeFile(path.join(fullDirname, filename), response.data);
    })
    .catch((err) => {
      log(err);
    });
};
export default pageLoader;
