/* linebreak-style: ["error", "windows"] */
import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import { beforeAll } from '@jest/globals';
import pageLoader from '../src/index.js';

let data = '';
let dirPath = '';
// const mainFolder = './page_loader';
// const actualHtml = 'ru-hexlet-io-courses.html';
const actualFiles = 'ru-hexlet-io-courses_files';
// const expectFile = 'courses.html';
const fakeFile = 'fake_file.html';

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);
const getFixtureContent = (name) => fs.readFile(getFixturePath(name), 'utf-8');
const readCurrentFile = async (pathName, name) => {
  const file = fs.readFile(path.join(pathName, name), 'utf-8');
  return file;
};

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
  console.log(dirPath);
});

beforeEach(async () => {
  data = {
    baseUrl: 'https://ru.hexlet.io',
    uri: '/courses',
  };
});

// test('page loader', async () => {
//   const resHtml = await getFixtureContent(fakeFile);
//   nock(data.baseUrl).persist().get(data.uri).reply(200, resHtml);
//   await pageLoader(`${data.baseUrl}${data.uri}`, dirPath);
//   const loaderPath = path.join(dirPath, actualFiles);
//   const expected = await getFixtureContent(expectFile);
//   const actual = await readCurrentFile(loaderPath, actualHtml);
//   expect(actual).toEqual(expected);
// });

test.each(responseData)('img test', async ({ nameFile, expectedFileName }) => {
  const index = responseData.findIndex((item) => item.nameFile === nameFile);
  const resHtml = await getFixtureContent(fakeFile);
  const expected = await getFixtureContent(nameFile);
  const tmpFolder = dirPath;
  console.log(tmpFolder);
  nock(data.baseUrl).persist()
    .get(data.uri).reply(200, resHtml) // https://ru.hexlet.io
    .get(responseData[index].pathFile) // "/assets/professions/nodejs.png"
    .reply(200, expected);
  await pageLoader(`${data.baseUrl}${data.uri}`, tmpFolder); // ru-hexlet-io-assets-professions-nodejs.png
  const file = path.join(tmpFolder, actualFiles);
  await fs.readdir(path.join(tmpFolder, actualFiles));
  console.log(file);
  // const actualSourcesDir = loaderPath.find((file) => file.match(/$png$/));
  const actualValue = await readCurrentFile(file, expectedFileName);
  expect(actualValue.toString()).toEqual(expected);
});
