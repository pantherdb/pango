import { NgModule } from '@angular/core';
import { LayoutPangoModule } from 'app/layout/layout-pango/layout-pango.module';


@NgModule({
    imports: [
        LayoutPangoModule
    ],
    exports: [
        LayoutPangoModule
    ]
})
export class LayoutModule {
}
