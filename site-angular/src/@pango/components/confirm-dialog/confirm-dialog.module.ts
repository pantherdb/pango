import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PangoConfirmDialogComponent } from './confirm-dialog.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
    declarations: [
        PangoConfirmDialogComponent
    ],
    imports: [
        CommonModule,
        BrowserModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        FlexLayoutModule
    ]
})

export class PangoConfirmDialogModule {
}
