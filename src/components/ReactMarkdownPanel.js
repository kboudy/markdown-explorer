import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import SplitPane from 'react-split-pane';
import path from 'path';
import electron from 'electron';
import './styles/reactSplitPane.css';
import fs from 'fs';
import { read as configRead, write as configWrite } from '../config';

const child = require('child_process').execFile;

const remote = require('electron').remote;
let args;
const remoteObj = remote.getGlobal('sharedObject');
if (remoteObj) {
  args = remoteObj.args;
}

let mdPath;
if (args && args.length > 1 && fs.existsSync(args[args.length - 1])) {
  mdPath = args[args.length - 1];
  configWrite({ mdPath });
} else {
  mdPath = configRead().mdPath;
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
    fs.watch(mdPath, (event, filename) => {
      if (filename && event === 'change') {
        // file changed - reload
        setMarkdown(readFileSync(mdPath, 'utf8'));
      }
    });
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
          fs.watch(fp, (event, filename) => {
            if (filename && event === 'change') {
              // file changed - reload
              setSubMarkdown(readFileSync(fp, 'utf8'));
            }
          });
        } else {
          setSubMarkdownPath(null);
          setSubMarkdown(null);
        }
      }
    }
  }, [rowIndex]);

  const handleMDClick = (props, e, markdownFilePath) => {
    if (window.event.ctrlKey) {
      const innerHTML = e.currentTarget.innerHTML;
      if (innerHTML.includes('data-sourcepos')) {
        let dataSourcepos = innerHTML.substring(
          innerHTML.indexOf('data-sourcepos') + 16
        );
        dataSourcepos = dataSourcepos.substring(0, dataSourcepos.indexOf('"'));
        const firstDP = dataSourcepos.split('-')[0];
        const lineNumber = parseInt(firstDP.split(':')[0]);

        if (window.event.shiftKey) {
          child(
            'gnome-terminal',
            ['--execute', 'vim', `+${lineNumber}`, markdownFilePath],
            function(err, data) {
              console.log(err);
              console.log(data.toString());
            }
          );
        } else {
          child(
            'code',
            ['--new-window', '--goto', markdownFilePath + `:${lineNumber}`],
            function(err, data) {
              console.log(err);
              console.log(data.toString());
            }
          );
        }
      }
    } else {
      setRowIndex(props.index);
    }
  };

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
          sourcePos={true} // adds an attribute to all elements data-sourcepos="4:1-4:30"
          includeNodeIndex={true}
          renderers={{
            table: props => (
              <table className={classes.table}>{props.children}</table>
            ),
            tableRow: props => (
              <tr
                onClick={e => handleMDClick(props, e, mdPath)}
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
              height: '100%',
              textAlign: 'left'
            }}
            onClick={e => {
              if (subMarkdownPath && window.event.ctrlKey) {
                handleMDClick(props, e, subMarkdownPath);
              }
            }}
          >
            <ReactMarkdown source={subMarkdown} sourcePos={true} />
          </div>
        ) : (
          <></>
        )}
      </div>
    </SplitPane>
  );
};

export default ReactMarkdownPanel;
