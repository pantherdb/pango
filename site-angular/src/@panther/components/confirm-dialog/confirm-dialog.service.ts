import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PantherConfirmDialogComponent } from '@panther/components/confirm-dialog/confirm-dialog.component';


@Injectable({
    providedIn: 'root'
})
export class PantherConfirmDialogService {

    dialogRef: any;

    constructor(
        private snackBar: MatSnackBar,
        private _matDialog: MatDialog) {
    }

    openSuccessfulSaveToast(message: string, action: string) {
        this.snackBar.open(message, action, {
            duration: 5000,
            verticalPosition: 'top'
        });
    }

    openConfirmDialog(title: string, message: string, success?, options?): void {
        let confirmDialogRef: MatDialogRef<PantherConfirmDialogComponent> = this._matDialog.open(PantherConfirmDialogComponent, {
            panelClass: 'panther-confirm-dialog',
            disableClose: false,
            width: '600px',
            data: options
        });

        confirmDialogRef.componentInstance.title = title;
        confirmDialogRef.componentInstance.message = message;
        if (!success) {
            confirmDialogRef.componentInstance.readonlyDialog = true;
        }

        confirmDialogRef.afterClosed().subscribe(response => {
            if (response && success) {
                success(response);
            }
            confirmDialogRef = null;
        });
    }
}
