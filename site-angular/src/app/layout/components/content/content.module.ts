import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PantherSharedModule } from '@panther/shared.module';

import { ContentComponent } from 'app/layout/components/content/content.component';

@NgModule({
    declarations: [
        ContentComponent
    ],
    imports: [
        RouterModule,
        PantherSharedModule,
    ],
    exports: [
        ContentComponent
    ]
})
export class ContentModule {
}
