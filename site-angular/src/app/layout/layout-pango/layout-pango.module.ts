import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PangoSharedModule } from '@pango/shared.module';

import { ContentModule } from 'app/layout/components/content/content.module';
import { PangoFooterModule } from 'app/layout/components/footer/footer.module';
import { QuickPanelModule } from 'app/layout/components/quick-panel/quick-panel.module';
import { PangoToolbarModule } from 'app/layout/components/toolbar/toolbar.module';

import { LayoutPangoComponent } from 'app/layout/layout-pango/layout-pango.component';

@NgModule({
    declarations: [
        LayoutPangoComponent
    ],
    imports: [
        RouterModule,
        PangoSharedModule,
        ContentModule,
        PangoFooterModule,
        QuickPanelModule,
        PangoToolbarModule
    ],
    exports: [
        LayoutPangoComponent
    ]
})
export class LayoutPangoModule {
}




