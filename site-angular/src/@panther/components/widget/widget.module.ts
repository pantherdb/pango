import { NgModule } from '@angular/core';

import { PantherWidgetComponent } from './widget.component';
import { PantherWidgetToggleDirective } from './widget-toggle.directive';

@NgModule({
    declarations: [
        PantherWidgetComponent,
        PantherWidgetToggleDirective
    ],
    exports: [
        PantherWidgetComponent,
        PantherWidgetToggleDirective
    ],
})
export class PantherWidgetModule {
}
