import { NgModule } from '@angular/core';

import { PangoPerfectScrollbarDirective } from './pango-perfect-scrollbar/pango-perfect-scrollbar.directive';

@NgModule({
    declarations: [
        PangoPerfectScrollbarDirective
    ],
    imports: [],
    exports: [
        PangoPerfectScrollbarDirective
    ]
})
export class PangoDirectivesModule {
}
