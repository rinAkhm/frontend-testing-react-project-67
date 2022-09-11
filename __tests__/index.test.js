/* linebreak-style: ["error", "windows"] */
import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { beforeAll } from '@jest/globals';
import pageLoader from '../src/index.js';

let data = '';
let dirPath = '';
const mainFolder = './page_loader';
const actualHtml = 'ru-hexlet-io-courses.html';
const actualFiles = 'ru-hexlet-io-courses_files';
const expectFile = 'after.html';
const fakeFile = 'fake_file.html';
const rootPath = path.join(__dirname, '..', mainFolder.split('/')[1]);

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);
const getFixtureContent = async (name) => {
  const res = fs.readFile(getFixturePath(name), 'utf-8');
  return res;
};
// const getTmpContent = (name) => fs.readFile(path.join(dirPath, name), 'utf-8');
const readCurrentFile = async (pathName, name) => fs.readFile(path.join(pathName, name));

const responseData = [
  {
    format: 'png',
    nameFile: 'nodejs.png',
    pathFile: '/assets/professions/nodejs.png',
    expectedFileName: 'ru-hexlet-io-assets-professions-nodejs.png',
  },
];

beforeAll(async () => {
  dirPath = await fs.mkdtemp(os.tmpdir());
  await fs.copyFile(
    path.join(getFixturePath('courses.html')),
    path.join(dirPath, 'after.html'),
  );
});

beforeEach(async () => {
  data = {
    baseUrl: 'https://ru.hexlet.io',
    uri: '/courses',
  };
});

test('page loader', async () => {
  const resHtml = await getFixtureContent(fakeFile);
  nock(data.baseUrl).persist().get(data.uri).reply(200, resHtml);
  await pageLoader(`${data.baseUrl}${data.uri}`, dirPath);
  const loaderPath = path.join(dirPath, actualFiles);
  const actual = await readCurrentFile(loaderPath, actualHtml);
  const expected = await readCurrentFile(dirPath, expectFile);
  expect(actual).toEqual(expected);
});

test.each(responseData)('dependens files downloads', async ({ nameFile, format }) => {
  const index = responseData.findIndex((item) => item.nameFile === nameFile);
  const resHtml = await getFixtureContent(fakeFile);
  const expected = await getFixtureContent(nameFile);
  nock(data.baseUrl).persist()
    .get(data.uri).reply(200, resHtml)
    .get(responseData[index].pathFile)
    .reply(200, expected);
  await pageLoader(`${data.baseUrl}${data.uri}`, mainFolder);
  const loaderPath = await fs.readdir(path.join(rootPath, actualFiles));
  const actualSourcesDir = loaderPath.find((file) => file.match(`${format}$`));
  const actualSourcesDirPath = path.join(rootPath, 'ru-hexlet-io-courses_files');
  const actualValue = await readCurrentFile(actualSourcesDirPath, actualSourcesDir);
  expect(actualValue.toString()).toEqual(expected);
});
