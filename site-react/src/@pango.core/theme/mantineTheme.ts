import type { MantineColorsTuple } from '@mantine/core'
import { ActionIcon, Button, Pill, Select, Tooltip, createTheme } from '@mantine/core'
import { pangoColors } from './palette'

type ColorScale = (typeof pangoColors)[keyof typeof pangoColors]

// Mantine indexes shades 0–9; the palette (like Tailwind) names them 50–900.
const toColorsTuple = (scale: ColorScale): MantineColorsTuple => [
  scale[50],
  scale[100],
  scale[200],
  scale[300],
  scale[400],
  scale[500],
  scale[600],
  scale[700],
  scale[800],
  scale[900],
]

export const mantineTheme = createTheme({
  primaryColor: 'primary',
  primaryShade: 5,
  colors: {
    primary: toColorsTuple(pangoColors.pangodark),
    accent: toColorsTuple(pangoColors.pangoAccent),
  },
  defaultRadius: 'md',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  components: {
    Button: Button.extend({
      defaultProps: { radius: 'xl', fw: 500 },
    }),
    ActionIcon: ActionIcon.extend({
      defaultProps: { variant: 'subtle', color: 'gray', radius: 'xl' },
    }),
    // Compact dark tooltips that wrap long help text instead of running off-screen on one line.
    Tooltip: Tooltip.extend({
      defaultProps: {
        withArrow: true,
        multiline: true,
        maw: 320,
        color: 'dark',
        radius: 'sm',
        fz: 'xs',
        fw: 500,
      },
    }),
    Pill: Pill.extend({
      styles: { root: { backgroundColor: 'var(--mantine-color-gray-2)' } },
    }),
    Select: Select.extend({
      defaultProps: { allowDeselect: false },
    }),
  },
})
