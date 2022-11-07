import { NgModule } from '@angular/core';

import { LayoutPantherModule } from 'app/layout/layout-panther/layout-panther.module';


@NgModule({
    imports: [
        LayoutPantherModule
    ],
    exports: [
        LayoutPantherModule
    ]
})
export class LayoutModule {
}
