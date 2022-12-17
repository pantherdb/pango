import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PangoSharedModule } from '@pango/shared.module';

import { PangoFooterComponent } from 'app/layout/components/footer/footer.component';

@NgModule({
    declarations: [
        PangoFooterComponent
    ],
    imports: [
        RouterModule,
        PangoSharedModule
    ],
    exports: [
        PangoFooterComponent
    ]
})
export class PangoFooterModule {
}
