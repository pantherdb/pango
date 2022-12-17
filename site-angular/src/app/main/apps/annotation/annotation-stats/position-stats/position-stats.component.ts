import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { getColor } from '@pango.common/data/pango-colors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats } from '../../models/annotation';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-position-stats',
  templateUrl: './position-stats.component.html',
  styleUrls: ['./position-stats.component.scss']
})
export class PositionStatsComponent implements OnInit, OnDestroy {

  annotationStats: AnnotationStats;

  posHistogramLineOptions = {
    view: [500, 400],
    legend: false,
    legendPosition: 'below',
    showLabels: true,
    animations: true,
    xAxis: true,
    yAxis: true,
    showYAxisLabel: true,
    showXAxisLabel: true,
    xAxisLabel: 'Position',
    yAxisLabel: 'Annotations',
    timeline: true,
  }


  stats = {
    posHistogramLine: [],
  }

  private _unsubscribeAll: Subject<any>;

  constructor(private annotationService: AnnotationService,) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {

    this.annotationService.onAnnotationsAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationStats: AnnotationStats) => {
        if (annotationStats) {
          this.annotationStats = annotationStats;
          this.drawStats()
        }
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  drawStats() {
    /*    const agg = this.annotationStats?.aggs[`${this.annotationStats.field}_frequency`];
       const posHistogramAgg = this.annotationStats?.aggs[`pos_histogram`];
   
       if (posHistogramAgg?.buckets) {
         this.stats.posHistogramLine = this.annotationService.buildAnnotationLine(posHistogramAgg.buckets, 'pos')
       } */
  }

}
