import styled from "@emotion/styled";
import { Dialog } from "@mui/material";

export const PangoDialog = styled(Dialog)(() => ({
  '& .MuiDialogTitle-root': {
    padding: '12px',
  },
  '& .MuiDialogContent-root': {
    padding: '12px',
  },
  '& .MuiDialogActions-root': {
    padding: '12px',
  },
}));