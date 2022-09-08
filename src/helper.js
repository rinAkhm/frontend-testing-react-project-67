/* eslint linebreak-style: ["error", "unix"] */
import debug from 'debug';
import path from 'path';

const log = debug('page-loader');

export const prepareName = (url, key = '') => {
  const name = url.replace(/[\W]+/gi, '-');
  let rez;
  switch (key) {
    case 'files':
      rez = `${name}_files`;
      break;
    case '':
      rez = `${name}`;
      break;
    default:
      log('invalid key param');
      break;
  }
  return rez;
};

export const urlToFilename = (link, defaultFormat = '.html') => {
  const { dir, name, ext } = path.parse(link);
  const slug = prepareName(path.join(dir, name));
  const format = ext || defaultFormat;
  return `${slug}${format}`;
};
export default urlToFilename;
