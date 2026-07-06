import { render } from 'preact';
import { App } from './app';
import { reflectTheme } from './hooks/use/theme';
import './styles/index.css';

reflectTheme();

const root = document.getElementById('app');
if (root) render(<App />, root);
