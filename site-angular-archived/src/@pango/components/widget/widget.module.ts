import { NgModule } from '@angular/core';

import { PangoWidgetComponent } from './widget.component';
import { PangoWidgetToggleDirective } from './widget-toggle.directive';

@NgModule({
    declarations: [
        PangoWidgetComponent,
        PangoWidgetToggleDirective
    ],
    exports: [
        PangoWidgetComponent,
        PangoWidgetToggleDirective
    ],
})
export class PangoWidgetModule {
}
