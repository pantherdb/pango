import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { AnnotationTableComponent } from './annotation/annotation-table/annotation-table.component';
import { AnnotationDetailComponent } from './annotation/annotation-detail/annotation-detail.component';
import { PangoSharedModule } from '@pango/shared.module';
import { PangoConfirmDialogModule } from '@pango/components/confirm-dialog/confirm-dialog.module';
import { AnnotationGroupComponent } from './annotation/annotation-group/annotation-group.component';
import { NgxPieChartRemoveMarginsDirective } from '@pango.common/directives/piechart-remove-margins.directive';
import { TermFormComponent } from './annotation/forms/term-form/term-form.component';
import { GeneFormComponent } from './annotation/forms/gene-form/gene-form.component';
import { OverrepFormComponent } from './gene/overrep-form/overrep-form.component';
import { CategoryStatsComponent } from './annotation/category-stats/category-stats.component';
import { GeneSummaryTableComponent } from './gene/gene-summary-table/gene-summary-table.component';

const routes = [];

@NgModule({
    declarations: [
        NgxPieChartRemoveMarginsDirective,
        AnnotationGroupComponent,
        AnnotationTableComponent,
        AnnotationDetailComponent,
        CategoryStatsComponent,
        GeneFormComponent,
        TermFormComponent,
        AnnotationGroupComponent,
        OverrepFormComponent,
        GeneSummaryTableComponent
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
        CategoryStatsComponent,
        GeneFormComponent,
        TermFormComponent,
        OverrepFormComponent,
        GeneSummaryTableComponent
    ],
    providers: []
})

export class AppsModule {
}
