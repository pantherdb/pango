import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PantherSharedModule } from '@panther/shared.module';

import { ContentModule } from 'app/layout/components/content/content.module';
import { PantherFooterModule } from 'app/layout/components/footer/footer.module';
import { QuickPanelModule } from 'app/layout/components/quick-panel/quick-panel.module';
import { PantherToolbarModule } from 'app/layout/components/toolbar/toolbar.module';

import { LayoutPantherComponent } from 'app/layout/layout-panther/layout-panther.component';

@NgModule({
    declarations: [
        LayoutPantherComponent
    ],
    imports: [
        RouterModule,
        PantherSharedModule,
        ContentModule,
        PantherFooterModule,
        QuickPanelModule,
        PantherToolbarModule
    ],
    exports: [
        LayoutPantherComponent
    ]
})
export class LayoutPantherModule {
}




