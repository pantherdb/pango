import { NgModule } from '@angular/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoToolbarComponent } from './toolbar.component';
import { PangoVersionBannerModule } from '@pango.common/components/version-banner/version-banner.module';

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
        PangoVersionBannerModule
    ],
    exports: [
        PangoToolbarComponent
    ]
})

export class PangoToolbarModule {
}
