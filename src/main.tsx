import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import './styles/tokens.css';
import './styles/engine.css';
import './styles/app.css';
import './content';
import { App } from './app/App';
import { applyStoredTheme } from './lib/theme';
import { startAuthAndSync } from './features/auth/auth';

applyStoredTheme();
startAuthAndSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
