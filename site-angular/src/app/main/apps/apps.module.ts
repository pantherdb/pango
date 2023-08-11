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
import { CategoryStatsComponent } from './annotation/annotation-stats/category-stats/category-stats.component';
import { SearchAspectFormComponent } from './annotation/search-form/search-aspect-form/search-aspect-form.component';
import { AnnotationGroupComponent } from './annotation/annotation-group/annotation-group.component';
import { GeneListComponent } from './annotation/gene-list/gene-list.component';
import { SummaryStatsVerticalComponent } from './annotation/annotation-stats/summary-stats-vertical/summary-stats-vertical.component';
import { NgxPieChartRemoveMarginsDirective } from '@pango.common/directives/piechart-remove-margins.directive';

const routes = [];

@NgModule({
    declarations: [
        NgxPieChartRemoveMarginsDirective,
        GeneListComponent,
        AnnotationGroupComponent,
        AnnotationTableComponent,
        AnnotationTableLongComponent,
        AnnotationDetailComponent,
        AnnotationSummaryComponent,
        SummaryStatsComponent,
        SummaryStatsVerticalComponent,
        CategoryStatsComponent,
        AnnotationStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent,
        AnnotationGroupComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        NgxChartsModule,
        PangoSharedModule,
        PangoConfirmDialogModule,
    ],
    exports: [
        NgxPieChartRemoveMarginsDirective,
        GeneListComponent,
        AnnotationGroupComponent,
        AnnotationTableComponent,
        AnnotationTableLongComponent,
        AnnotationDetailComponent,
        AnnotationSummaryComponent,
        AnnotationStatsComponent,
        SummaryStatsComponent,
        SummaryStatsVerticalComponent,
        CategoryStatsComponent,
        GeneralStatsComponent,
        PositionStatsComponent,
        SearchFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent
    ],
    providers: []
})

export class AppsModule {
}
