import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

@Component({
    selector: 'pango-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss']
})
export class PangoConfirmDialogComponent {
    public title: string;
    public message: string;
    public readonlyDialog = false;
    public cancelLabel = 'Cancel'
    public confirmLabel = 'Confirm'

    constructor(public dialogRef: MatDialogRef<PangoConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) private _data: any) {
        if (_data) {
            this.cancelLabel = _data.cancelLabel ? _data.cancelLabel : 'Cancel';
            this.confirmLabel = _data.confirmLabel ? _data.confirmLabel : 'Confirm';
        }
    }

    confirm() {
        this.dialogRef.close(true);
    }

    cancel() {
        this.dialogRef.close(false);
    }
}
