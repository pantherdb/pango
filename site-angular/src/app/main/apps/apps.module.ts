import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AnnotationTableComponent } from './annotation/annotation-table/annotation-table.component';
import { AnnotationDetailComponent } from './annotation/annotation-detail/annotation-detail.component';
import { AnnotationSummaryComponent } from './annotation/annotation-summary/annotation-summary.component';
import { GeneralStatsComponent } from './annotation/annotation-stats/general-stats/general-stats.component';
import { AnnotationStatsComponent } from './annotation/annotation-stats/annotation-stats.component';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoConfirmDialogModule } from '@pango/components/confirm-dialog/confirm-dialog.module';
import { PositionStatsComponent } from './annotation/annotation-stats/position-stats/position-stats.component';
import { SearchFormComponent } from './annotation/search-form/search-form.component';
import { AnnotationFiltersComponent } from './annotation/annotation-filters/annotation-filters.component';
import { SummaryStatsComponent } from './annotation/annotation-stats/summary-stats/summary-stats.component';
import { AnnotationTableLongComponent } from './annotation/annotation-table-long/annotation-table-long.component';

const routes = [];

@NgModule({
    declarations: [
        AnnotationTableComponent,
        AnnotationTableLongComponent,
        AnnotationDetailComponent,
        AnnotationSummaryComponent,
        SummaryStatsComponent,
        AnnotationStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        AnnotationFiltersComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        NgxChartsModule,
        PangoSharedModule,
        PangoConfirmDialogModule,
    ],
    exports: [
        AnnotationTableComponent,
        AnnotationTableLongComponent,
        AnnotationDetailComponent,
        AnnotationSummaryComponent,
        AnnotationStatsComponent,
        SummaryStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        AnnotationFiltersComponent
    ],
    providers: []
})

export class AppsModule {
}
