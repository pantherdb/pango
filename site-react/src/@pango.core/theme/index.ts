// src/themes/index.ts
import type { Theme } from '@mui/material/styles'
import { DialogTheme } from './components/DialogTheme'
import { ButtonTheme } from './components/ButtonTheme'

export const componentThemes = (theme: Theme) => ({
  MuiButton: ButtonTheme(theme),
  MuiDialog: DialogTheme(theme),
  // Add more component themes here
})
