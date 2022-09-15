/* linebreak-style: ["error", "windows"] */
import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'fs/promises';
import pageLoader from '../src/index.js';

let data = '';
let tmpFolder = '';
let expectedData = '';
let htmlFile = '';

const actualHtml = 'ru-hexlet-io-courses.html';
const actualFiles = 'ru-hexlet-io-courses_files';
const expectFile = 'after.html';
const fakeFile = 'before.html';
const scope = nock('https://ru.hexlet.io').persist();

const getFixturePath = (name) => path.join(__dirname, '..', '__fixtures__', name);
const getFixtureContent = (name) => fs.readFile(getFixturePath(name), 'utf-8');
const readCurrentFile = (pathName, name) => fs.readFile(path.join(pathName, name), 'utf-8');

const responseData = [
  {
    nameFile: 'nodejs.png',
    pathFile: '/assets/professions/nodejs.png',
    expectedFileName: 'ru-hexlet-io-assets-professions-nodejs.png',
  },
  {
    nameFile: 'style.css',
    pathFile: '/assets/application.css',
    expectedFileName: 'ru-hexlet-io-assets-application.css',
  },
  {
    nameFile: 'main.js',
    pathFile: '/packs/js/runtime.js',
    expectedFileName: 'ru-hexlet-io-packs-js-runtime.js',
  },
  {
    nameFile: 'before.html',
    pathFile: '/courses',
    expectedFileName: 'ru-hexlet-io-courses.html',
  },
];

beforeAll(async () => {
  nock.disableNetConnect();
  htmlFile = await getFixtureContent(fakeFile);
  expectedData = await getFixtureContent(expectFile);
});

afterAll(() => {
  nock.enableNetConnect();
});

beforeEach(async () => {
  tmpFolder = await fs.mkdtemp(os.tmpdir());
  console.log(tmpFolder);
  data = {
    baseUrl: 'https://ru.hexlet.io',
    uri: '/courses',
  };
  responseData.forEach(async (items) => scope
    .get(items.pathFile)
    .reply(200, await getFixtureContent(items.nameFile)));
});

afterEach(() => {
  nock.cleanAll();
});

describe('positive tests for pageloader —', () => {
  test('html replacement', async () => {
    scope
      .get(data.uri)
      .reply(200, htmlFile);
    await pageLoader(`${data.baseUrl}${data.uri}`, tmpFolder);
    const filesFolder = await fs.access(path.join(tmpFolder, actualFiles));
    const actual = await readCurrentFile(tmpFolder, actualHtml);
    expect(filesFolder).toBeUndefined();
    expect(actual).toEqual(expectedData);
  });

  test.each(responseData)('check dependences files %s', async (item) => {
    scope
      .get(data.uri)
      .reply(200, htmlFile);
    const { filepath } = await pageLoader(`${data.baseUrl}${data.uri}`, tmpFolder);
    const expected = await getFixtureContent(item.nameFile);
    const actualValue = await readCurrentFile(filepath, item.expectedFileName);
    expect(actualValue).toEqual(expected);
  });
});
