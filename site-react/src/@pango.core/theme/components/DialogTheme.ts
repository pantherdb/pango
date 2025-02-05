import { lighten, type Theme } from '@mui/material/styles'

export const DialogTheme = (theme: Theme) => ({
  styleOverrides: {
    root: {
      '& .MuiPaper-root': {
        '@apply bg-gray-100 text-gray-800': {},
      },
      '& .MuiDialogTitle-root': {
        padding: '12px',
        backgroundColor: lighten(theme.palette.primary.main, 0.6),
      },
      '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
        '@apply red-100 text-gray-800': {},
        // backgroundColor: 'red',
      },
      '& .MuiDialogActions-root': {
        padding: '12px',
      },
    },
  },
})
