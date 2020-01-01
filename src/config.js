import path from 'path';
import electron from 'electron';
import fs from 'fs';

const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const fullConfigPath = path.join(userDataPath, 'config.json');

export const read = () => {
  if (!fs.existsSync(fullConfigPath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(fullConfigPath, 'utf8'));
};

export const write = config => {
  fs.writeFileSync(fullConfigPath, JSON.stringify(config));
};
