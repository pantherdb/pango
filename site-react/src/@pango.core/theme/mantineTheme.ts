import {
  ActionIcon,
  Button,
  Modal,
  Pill,
  Tooltip,
  createTheme,
} from '@mantine/core'
import { pangoColors } from './theme'

const mantineTheme = createTheme({
  primaryColor: 'primary',
  primaryShade: 5,
  defaultRadius: 'md',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  colors: {
    primary: [
      pangoColors.pangodark[50],
      pangoColors.pangodark[100],
      pangoColors.pangodark[200],
      pangoColors.pangodark[300],
      pangoColors.pangodark[400],
      pangoColors.pangodark[500],
      pangoColors.pangodark[600],
      pangoColors.pangodark[700],
      pangoColors.pangodark[800],
      pangoColors.pangodark[900],
    ],
    accent: [
      pangoColors.pangoAccent[50],
      pangoColors.pangoAccent[100],
      pangoColors.pangoAccent[200],
      pangoColors.pangoAccent[300],
      pangoColors.pangoAccent[400],
      pangoColors.pangoAccent[500],
      pangoColors.pangoAccent[600],
      pangoColors.pangoAccent[700],
      pangoColors.pangoAccent[800],
      pangoColors.pangoAccent[900],
    ],
  },
  components: {
    Button: Button.extend({
      defaultProps: { radius: 'xl' },
      styles: { root: { textTransform: 'none', fontWeight: 500 } },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { variant: 'subtle', radius: 'xl' },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        color: 'dark',
        radius: 'sm',
      },
      styles: {
        tooltip: {
          fontSize: '11px',
          padding: '4px 8px',
          fontWeight: 500,
        },
      },
    }),
    Pill: Pill.extend({
      defaultProps: { size: 'md', radius: 'xl' },
      styles: {
        root: {
          backgroundColor: '#e0e0e0',
          color: '#333',
          height: '24px',
          fontSize: '12px',
          paddingLeft: '8px',
          paddingRight: '4px',
        },
        remove: {
          color: '#666',
          marginLeft: '2px',
        },
      },
    }),
    Modal: Modal.extend({
      styles: {
        header: {
          padding: '12px 16px',
          backgroundColor: pangoColors.pangodark[100],
          color: pangoColors.pangodark[900],
          fontWeight: 600,
          minHeight: 'auto',
        },
        title: { fontWeight: 600 },
        body: { padding: '16px' },
        content: { backgroundColor: '#f3f4f6' },
      },
    }),
  },
})

export default mantineTheme
