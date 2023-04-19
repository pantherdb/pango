import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoToolbarComponent } from './toolbar.component';

@NgModule({
    declarations: [
        PangoToolbarComponent
    ],
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatToolbarModule,
        PangoSharedModule,
    ],
    exports: [
        PangoToolbarComponent
    ]
})

export class PangoToolbarModule {
}
