#!/usr/bin/env node
/* linebreak-style: ["error", "windows"] */

import { program } from 'commander';
import process from 'process';
import pageLoader from '../src/index.js';

program
  .command('page-loader')
  .version('1.0.0')
  .description('Page download')
  .arguments('<url>', 'url source')
  .option('-o, --output [dirPath]', 'output directory', process.cwd())
  .action((url, program) => {
    pageLoader(url, program.output);
  });
program.parse(process.argv);
