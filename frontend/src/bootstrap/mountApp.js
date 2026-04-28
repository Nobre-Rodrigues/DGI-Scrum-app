import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../App';

const theme = createTheme({
  palette: {
    primary: {
      main: '#034AD8',
      dark: '#022B7F',
      contrastText: '#FFFFFF',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: '#034AD8',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#022B7F',
          },
          '&:active': {
            backgroundColor: '#034AD8',
          },
          '&.Mui-focusVisible': {
            outline: '2px solid #FF00D4',
            outlineOffset: '2px',
          },
          '&.Mui-disabled': {
            backgroundColor: '#E9EEF6',
            color: '#B7C0D0',
          },
        },
      },
    },
  },
});

const mountedRoots = new WeakMap();

export const mountApp = (container) => {
  const root = ReactDOM.createRoot(container);

  root.render(
    <React.StrictMode>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </React.StrictMode>
  );

  mountedRoots.set(container, root);
  return root;
};

export const unmountApp = (container) => {
  const root = mountedRoots.get(container);

  if (!root) {
    return;
  }

  root.unmount();
  mountedRoots.delete(container);
};

