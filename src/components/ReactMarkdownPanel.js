import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import SplitPane from 'react-split-pane';
import path from 'path';
import chokidar from 'chokidar';
import _ from 'lodash';
import electron, { shell } from 'electron';
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

const config = configRead();

if (args && args.length > 1 && fs.existsSync(args[args.length - 1])) {
  if (!config.recentFiles) {
    config.recentFiles = [];
  }
  let newMdPath = args[args.length - 1];
  if (fs.existsSync(path.join(process.cwd(), newMdPath))) {
    newMdPath = path.join(process.cwd(), newMdPath);
  }
  // before we overwrite mdPath, push the old value to recents
  if (newMdPath && config.mdPath !== newMdPath) {
    if (config.recentFiles.includes(config.mdPath)) {
      config.recentFiles = config.recentFiles.filter(f => f !== config.mdPath);
    }
    config.recentFiles.unshift(config.mdPath);
    config.recentFiles = _.take(config.recentFiles, 10);
  }

  config.mdPath = newMdPath;
  configWrite(config);
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
    setMarkdown(readFileSync(config.mdPath, 'utf8'));

    const watcher = chokidar.watch(config.mdPath, {
      persistent: true
    });

    watcher.on('change', path =>
      setMarkdown(readFileSync(config.mdPath, 'utf8'))
    );

    setSubDirs(getDirectories(path.dirname(config.mdPath)));

    return async () => {
      await watcher.close();
    };
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

          const watcher = chokidar.watch(fp, {
            persistent: true
          });

          watcher.on('change', path =>
            setSubMarkdown(readFileSync(path, 'utf8'))
          );

          return async () => {
            await watcher.close();
          };
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
          const dir = path.dirname(markdownFilePath);
          const files = fs
            .readdirSync(dir)
            .filter(f => /^\d{2,3}/.exec(path.basename(f)));

          const idx = lineNumber - 3; // removes the 2 md table header rows
          if (idx < files.length) {
            child('vlc', [path.join(dir, files[idx])], (err, data) => {});

            setTimeout(() => {
              child(
                'i3-msg',
                ['[class="vlc"] move to workspace 2:2'],
                (err, data) => {}
              );
            }, 500);
          }
          /*           
          // vim 
          child(
            'gnome-terminal',
            ['--execute', 'vim', `+${lineNumber}`, markdownFilePath],
            function(err, data) {
              console.log(err);
              console.log(data.toString());
            }
          );
          */
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
              <table
                style={{ userSelect: 'none' }}
                // style={{
                //   border: '1px solid black',
                //   borderCollapse: 'collapse'
                // }}
                className={classes.table}
              >
                {props.children}
              </table>
            ),
            // tableCell: props =>
            //   props.isHeader ? (
            //     <th style={{ border: '1px solid black' }} align="left">
            //       <b>{props.children}</b>
            //     </th>
            //   ) : (
            //     <td
            //       style={{ border: '1px solid black', padding: '5px' }}
            //       align="left"
            //       onClick={e => {
            //         handleMDClick(props, e, config.mdPath);
            //       }}
            //     >
            //       {props.children}
            //     </td>
            //   ),
            inlineCode: props => (
              <span style={{ backgroundColor: '#F1F3F5', color: '#093466' }}>
                {props.value}
              </span>
            ),
            tableRow: props => (
              <tr
                onClick={e => {
                  handleMDClick(props, e, config.mdPath);
                }}
                className={classes.tableRow}
              >
                {props.children}
              </tr>
            ),
            link: props => {
              return (
                <a href={'#'} onClick={() => shell.openExternal(props.href)}>
                  {props.children}
                </a>
              );
            }
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
            <ReactMarkdown
              source={subMarkdown}
              sourcePos={true}
              renderers={{
                link: props => {
                  return (
                    <a
                      href={'#'}
                      onClick={() => shell.openExternal(props.href)}
                    >
                      {props.children}
                    </a>
                  );
                }
              }}
            />
          </div>
        ) : (
          <></>
        )}
      </div>
    </SplitPane>
  );
};

export default ReactMarkdownPanel;
