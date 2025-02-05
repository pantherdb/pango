import type { Theme } from '@mui/material/styles'

export const ButtonTheme = (theme: Theme) => ({
  styleOverrides: {
    root: {
      textTransform: 'none',
      borderRadius: theme.spacing(2),
    },
  },
})
