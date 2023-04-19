import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


import { PangoProgressBarComponent } from './progress-bar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@NgModule({
    declarations: [
        PangoProgressBarComponent
    ],
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatProgressBarModule
    ],
    exports: [
        PangoProgressBarComponent
    ]
})
export class PangoProgressBarModule {
}
