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
import { AnnotationFiltersComponent } from './annotation/annotation-filters/annotation-filters.component';
import { SummaryStatsComponent } from './annotation/annotation-stats/summary-stats/summary-stats.component';
import { AnnotationTableLongComponent } from './annotation/annotation-table-long/annotation-table-long.component';
import { CategoryStatsComponent } from './annotation/annotation-stats/category-stats/category-stats.component';
import { SearchAspectFormComponent } from './annotation/forms/search-aspect-form/search-aspect-form.component';
import { AnnotationGroupComponent } from './annotation/annotation-group/annotation-group.component';
import { SummaryStatsVerticalComponent } from './annotation/annotation-stats/summary-stats-vertical/summary-stats-vertical.component';
import { NgxPieChartRemoveMarginsDirective } from '@pango.common/directives/piechart-remove-margins.directive';
import { TermFormComponent } from './annotation/forms/term-form/term-form.component';
import { GeneFormComponent } from './annotation/forms/gene-form/gene-form.component';

const routes = [];

@NgModule({
    declarations: [
        NgxPieChartRemoveMarginsDirective,
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
        GeneFormComponent,
        TermFormComponent,
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
        GeneFormComponent,
        TermFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent
    ],
    providers: []
})

export class AppsModule {
}
