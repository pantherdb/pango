import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PantherSharedModule } from '@panther/shared.module';
import { PantherToolbarComponent } from './toolbar.component';

@NgModule({
    declarations: [
        PantherToolbarComponent
    ],
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatToolbarModule,
        PantherSharedModule,
    ],
    exports: [
        PantherToolbarComponent
    ]
})

export class PantherToolbarModule {
}
