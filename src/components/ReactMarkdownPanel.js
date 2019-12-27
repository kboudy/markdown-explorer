import React, { useEffect, useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import SplitPane from 'react-split-pane';
import path from 'path';
import electron from 'electron';
import './styles/reactSplitPane.css';
import settings from 'electron-settings';
import fs from 'fs';

const child = require('child_process').execFile;

const remote = require('electron').remote;
let args;
const remoteObj = remote.getGlobal('sharedObject');
if (remoteObj) {
  args = remoteObj.args;
}

const userDataPath = (electron.app || electron.remote.app).getPath('userData');

let mdPath;
if (args && args.length > 1 && fs.existsSync(args[args.length - 1])) {
  mdPath = args[args.length - 1];
  fs.writeFileSync(
    path.join(userDataPath, 'config.json'),
    JSON.stringify({ mdPath })
  );
} else {
  mdPath = JSON.parse(
    fs.readFileSync(path.join(userDataPath, 'config.json'), 'utf8')
  ).mdPath;
}

const { existsSync, lstatSync, readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const isDirectory = source => lstatSync(source).isDirectory();
const getDirectories = source =>
  readdirSync(source)
    .map(name => join(source, name))
    .filter(isDirectory);

const useStyles = makeStyles(theme => ({
  table: {},
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      background: '#eee'
    }
  }
}));

const ReactMarkdownPanel = props => {
  const classes = useStyles();
  const [markdown, setMarkdown] = useState('');
  const [subMarkdown, setSubMarkdown] = useState(null);
  const [subMarkdownPath, setSubMarkdownPath] = useState(null);
  const [rowIndex, setRowIndex] = useState(0);
  const [subDirs, setSubDirs] = useState([]);
  const [subFiles, setSubFiles] = useState([]);
  useEffect(() => {
    setMarkdown(readFileSync(mdPath, 'utf8'));
    setSubDirs(getDirectories(path.dirname(mdPath)));
  }, []);

  useEffect(() => {
    if (subDirs && subDirs.length > 0) {
      const allFiles = readdirSync(subDirs[0]);
      setSubFiles(allFiles.filter(f => path.extname(f) === '.md'));
    }
  }, [subDirs]);

  useEffect(() => {
    if (subFiles.length > rowIndex) {
      const matchingSubFile = subFiles.filter(sf => {
        if (!sf.includes('-')) {
          return false;
        }
        return parseInt(sf.split('-')[0]) === rowIndex + 1;
      });
      if (matchingSubFile.length > 0) {
        const fp = path.join(subDirs[0], matchingSubFile[0]);
        if (existsSync(fp)) {
          setSubMarkdownPath(fp);
          setSubMarkdown(readFileSync(fp, 'utf8'));
        } else {
          setSubMarkdownPath(null);
          setSubMarkdown(null);
        }
      }
    }
  }, [rowIndex]);

  return (
    <SplitPane split="horizontal" size={'80%'}>
      <div
        style={{
          overflowY: 'auto',
          paddingLeft: '50px',
          paddingRight: '50px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <ReactMarkdown
          source={markdown}
          includeNodeIndex={true}
          renderers={{
            table: props => (
              <table className={classes.table}>{props.children}</table>
            ),
            tableRow: props => (
              <tr
                onMouseEnter={() => setRowIndex(props.index)}
                onClick={() => {
                  if (window.event.ctrlKey) {
                    child('code', [mdPath], function(err, data) {
                      console.log(err);
                      console.log(data.toString());
                    });
                  }
                }}
                className={classes.tableRow}
              >
                {props.children}
              </tr>
            )
          }}
        />
      </div>
      <div
        style={{
          overflowY: 'auto',
          height: '100%',
          paddingLeft: '50px',
          paddingRight: '50px',
          backgroundColor: '#FDF7E3'
        }}
      >
        {subMarkdown ? (
          <div
            style={{
              textAlign: 'left'
            }}
            onClick={() => {
              if (subMarkdownPath && window.event.ctrlKey) {
                child('code', [subMarkdownPath], function(err, data) {
                  console.log(err);
                  console.log(data.toString());
                });
              }
            }}
          >
            <ReactMarkdown source={subMarkdown} />
          </div>
        ) : (
          <></>
        )}
      </div>
    </SplitPane>
  );
};

export default ReactMarkdownPanel;
