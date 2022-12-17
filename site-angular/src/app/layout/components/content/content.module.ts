import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PangoSharedModule } from '@pango/shared.module';

import { ContentComponent } from 'app/layout/components/content/content.component';

@NgModule({
    declarations: [
        ContentComponent
    ],
    imports: [
        RouterModule,
        PangoSharedModule,
    ],
    exports: [
        ContentComponent
    ]
})
export class ContentModule {
}
