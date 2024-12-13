import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AnnotationTableComponent } from './annotation/annotation-table/annotation-table.component';
import { AnnotationDetailComponent } from './annotation/annotation-detail/annotation-detail.component';
import { AnnotationStatsComponent } from './annotation/annotation-stats/annotation-stats.component';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoConfirmDialogModule } from '@pango/components/confirm-dialog/confirm-dialog.module';
import { AnnotationFiltersComponent } from './annotation/annotation-filters/annotation-filters.component';
import { SummaryStatsComponent } from './annotation/annotation-stats/summary-stats/summary-stats.component';
import { CategoryStatsComponent } from './annotation/annotation-stats/category-stats/category-stats.component';
import { SearchAspectFormComponent } from './annotation/forms/search-aspect-form/search-aspect-form.component';
import { AnnotationGroupComponent } from './annotation/annotation-group/annotation-group.component';
import { NgxPieChartRemoveMarginsDirective } from '@pango.common/directives/piechart-remove-margins.directive';
import { TermFormComponent } from './annotation/forms/term-form/term-form.component';
import { GeneFormComponent } from './annotation/forms/gene-form/gene-form.component';
import { OverrepFormComponent } from './gene/overrep-form/overrep-form.component';

const routes = [];

@NgModule({
    declarations: [
        NgxPieChartRemoveMarginsDirective,
        AnnotationGroupComponent,
        AnnotationTableComponent,
        AnnotationDetailComponent,
        SummaryStatsComponent,
        CategoryStatsComponent,
        AnnotationStatsComponent,
        GeneFormComponent,
        TermFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent,
        AnnotationGroupComponent,
        OverrepFormComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        NgxChartsModule,
        PangoSharedModule,
        PangoConfirmDialogModule,
    ],
    schemas: [
        CUSTOM_ELEMENTS_SCHEMA
    ],
    exports: [
        NgxPieChartRemoveMarginsDirective,
        AnnotationGroupComponent,
        AnnotationTableComponent,
        AnnotationDetailComponent,
        AnnotationStatsComponent,
        SummaryStatsComponent,
        CategoryStatsComponent,
        GeneFormComponent,
        TermFormComponent,
        SearchAspectFormComponent,
        AnnotationFiltersComponent,
        OverrepFormComponent
    ],
    providers: []
})

export class AppsModule {
}
