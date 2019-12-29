import path from 'path';
import electron from 'electron';
import fs from 'fs';

const userDataPath = (electron.app || electron.remote.app).getPath('userData');

export const read = () => {
  return JSON.parse(
    fs.readFileSync(path.join(userDataPath, 'config.json'), 'utf8')
  );
};

export const write = config => {
  fs.writeFileSync(
    path.join(userDataPath, 'config.json'),
    JSON.stringify(config)
  );
};
