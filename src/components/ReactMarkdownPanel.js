import React, { useEffect, useState } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import ReactMarkdown from 'react-markdown';
import SplitPane from 'react-split-pane';
import path from 'path';
import './styles/reactSplitPane.css';

const remote = require('electron').remote;
const args = remote.getGlobal('sharedObject').args;
const mdPath = args[args.length - 1];

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
      const fp = path.join(subDirs[0], subFiles[rowIndex]);
      if (existsSync(fp)) {
        setSubMarkdown(readFileSync(fp, 'utf8'));
      } else {
        setSubMarkdown(null);
      }
    }
  }, [rowIndex]);

  return (
    <SplitPane split="horizontal" minSize={300}>
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
          display: 'flex',
          height: '100%',
          paddingLeft: '50px',
          paddingRight: '50px',
          backgroundColor: '#FDF7E3',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        {subMarkdown ? (
          <ReactMarkdown source={subMarkdown}></ReactMarkdown>
        ) : (
          <></>
        )}
      </div>
    </SplitPane>
  );
};

export default ReactMarkdownPanel;
