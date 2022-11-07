import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { GeneTableComponent } from './gene/gene-table/gene-table.component';
import { GeneDetailComponent } from './gene/gene-detail/gene-detail.component';
import { GeneSummaryComponent } from './gene/gene-summary/gene-summary.component';
import { GeneralStatsComponent } from './gene/gene-stats/general-stats/general-stats.component';
import { GeneStatsComponent } from './gene/gene-stats/gene-stats.component';
import { PantherSharedModule } from '@panther/shared.module';
import { PantherConfirmDialogModule } from '@panther/components/confirm-dialog/confirm-dialog.module';
import { PositionStatsComponent } from './gene/gene-stats/position-stats/position-stats.component';
import { SearchFormComponent } from './gene/search-form/search-form.component';
import { AnnotationFiltersComponent } from './gene/annotation-filters/annotation-filters.component';

const routes = [];

@NgModule({
    declarations: [
        GeneTableComponent,
        GeneDetailComponent,
        GeneSummaryComponent,
        GeneStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        AnnotationFiltersComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        NgxChartsModule,
        PantherSharedModule,
        PantherConfirmDialogModule,
    ],
    exports: [
        GeneTableComponent,
        GeneDetailComponent,
        GeneSummaryComponent,
        GeneStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        AnnotationFiltersComponent
    ],
    providers: []
})

export class AppsModule {
}
