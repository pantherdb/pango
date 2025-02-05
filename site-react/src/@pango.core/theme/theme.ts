import { createTheme } from '@mui/material/styles'
import { componentThemes } from '.'

export const pangoColors = {
  pangodark: {
    50: '#e4e7ec',
    100: '#bbc3d0',
    200: '#8e9bb0',
    300: '#627491',
    400: '#3f567b',
    500: '#173672',
    600: '#132f64',
    700: '#102653',
    800: '#0c1d42',
    900: '#08142f',
  },
  pangoAccent: {
    50: '#fdf8e7',
    100: '#f9edc3',
    200: '#f5e19b',
    300: '#f1d572',
    400: '#eecc54',
    500: '#ebc336',
    600: '#e9bd30',
    700: '#e5b529',
    800: '#e2ae22',
    900: '#dda116',
  },
}

const baseTheme = createTheme({
  palette: {
    primary: {
      main: pangoColors.pangodark[500],
      light: pangoColors.pangodark[300],
      dark: pangoColors.pangodark[700],
    },
    secondary: {
      main: pangoColors.pangoAccent[600],
      light: pangoColors.pangoAccent[400],
      dark: pangoColors.pangoAccent[800],
    },
  },
  typography: {
    fontSize: 14,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
  },
})

const theme = createTheme(baseTheme, {
  components: componentThemes(baseTheme),
})

export default theme
