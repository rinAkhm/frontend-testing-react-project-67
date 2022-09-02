/* eslint linebreak-style: ["error", "unix"] */
import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { beforeAll } from '@jest/globals';
import pageLoader from '../src/index.js';

let data = '';
let dirPath = '';
const actualHtml = 'ru-hexlet-io-courses.html';
const expectFile = 'courses.html';
const fakeFile = 'fake_file.html';

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);
const getContentFile = async (pathFile, name) => fs.readFile(path.join(pathFile, name), 'utf-8');

beforeAll(async () => {
  dirPath = await fs.mkdtemp(os.tmpdir());
  await fs.copyFile(
    path.join(getFixturePath(expectFile)),
    path.join(dirPath, 'after.html'),
  );
  await fs.copyFile(
    path.join(getFixturePath(fakeFile)),
    path.join(dirPath, 'fake_file.html'),
  );
});

beforeEach(async () => {
  data = {
    baseUrl: 'https://ru.hexlet.io',
    uri: '/courses',
    pathFolder: './page_loader',
    actualFiles: 'ru-hexlet-io-courses_files',
  };
});

test('page loader', async () => {
  const resHtml = await getContentFile(dirPath, fakeFile);
  nock(data.baseUrl).persist().get(data.uri).reply(200, resHtml);
  await pageLoader(`${data.baseUrl}${data.uri}`, data.pathFolder);
  const actualFolder = path.join(
    __dirname,
    '..',
    data.pathFolder.split('/')[1],
    data.actualFiles,
  );
  const actual = await getContentFile(actualFolder, actualHtml);
  expect(actual.trim()).toEqual(resHtml.trim());
});
