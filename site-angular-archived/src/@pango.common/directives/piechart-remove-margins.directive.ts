import { Directive, Self } from '@angular/core';
import { PieChartComponent } from '@swimlane/ngx-charts';

@Directive({
    selector: 'ngx-charts-pie-chart[piechart-remove-margins]'
})
export class NgxPieChartRemoveMarginsDirective {
    constructor(@Self() pieChart: PieChartComponent) {
        pieChart.margins = [0, 0, 0, 0];
    }
}