import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PantherSharedModule } from '@panther/shared.module';

import { PantherFooterComponent } from 'app/layout/components/footer/footer.component';

@NgModule({
    declarations: [
        PantherFooterComponent
    ],
    imports: [
        RouterModule,
        PantherSharedModule
    ],
    exports: [
        PantherFooterComponent
    ]
})
export class PantherFooterModule {
}
