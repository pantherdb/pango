// src/theme.ts
import { createTheme } from '@mui/material/styles';
import { componentThemes } from '.';

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#878499',
    },
    secondary: {
      main: '#a7a7a0',
    },
    background: {
      default: '#eeeeee',
    },
  },
});

const theme = createTheme(baseTheme, {
  components: componentThemes(baseTheme),
});

export default theme;
