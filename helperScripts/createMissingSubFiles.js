#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const parentPath =
  '/mnt/local_WD_4TB/tutorials/AWS_Certification/LinuxAcademy/AWS Certified Solutions Architect - Associate';

const subPath =
  '/mnt/local_WD_4TB/tutorials/AWS_Certification/LinuxAcademy/AWS Certified Solutions Architect - Associate/D1 Video Documentation';

const parentFiles = _.orderBy(
  fs
    .readdirSync(parentPath)
    .filter(f => f[3] === '-' && (f.endsWith('.mkv') || f.endsWith('.mp4'))),
  f => f
);
const subFiles = _.orderBy(
  fs.readdirSync(subPath).filter(f => f[3] === '-' && f.endsWith('.md')),
  f => f
);

const pad = (num, size) => {
  var s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
};

const getBaseFileName = filepath => {
  let baseFileName = filepath.substring(filepath.indexOf('-') + 1);
  baseFileName = baseFileName.substring(
    0,
    baseFileName.length - path.extname(baseFileName).length
  );
  return baseFileName;
};

let parentFilesIndex = 0;
let subIndex = 0;

while (parentFilesIndex < parentFiles.length) {
  let pf = parentFiles[parentFilesIndex];
  let num = pf.split('-')[0];
  let primaryFileBaseName = getBaseFileName(pf);
  let subFile = subFiles[subIndex];
  while (!subFile || primaryFileBaseName !== getBaseFileName(subFile)) {
    console.log(
      'writing: ' +
        path.join(subPath, `${pad(num, 3)}-${primaryFileBaseName}.md`)
    );
    fs.writeFileSync(
      path.join(subPath, `${pad(num, 3)}-${primaryFileBaseName}.md`),
      ''
    );
    parentFilesIndex++;
    if (parentFilesIndex >= parentFiles.length) {
      break;
    }
    pf = parentFiles[parentFilesIndex];
    num = pf.split('-')[0];
    primaryFileBaseName = getBaseFileName(pf);
  }
  if (parentFilesIndex >= parentFiles.length) {
    break;
  }
  if (subFile.split('-')[0] !== num) {
    const source = path.join(subPath, subFile);
    const dest = path.join(subPath, `${num}-${getBaseFileName(subFile)}.md`);
    console.log(`renaming ${source} to ${dest}`);
    fs.renameSync(source, dest);
  }
  parentFilesIndex++;
  subIndex++;
}
