import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { getColor } from '@pango.common/data/pango-colors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats, Bucket } from '../../models/annotation';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-general-stats',
  templateUrl: './general-stats.component.html',
  styleUrls: ['./general-stats.component.scss']
})
export class GeneralStatsComponent implements OnInit, OnDestroy {

  annotationStats: AnnotationStats;

  /*   annotationFrequencyBarOptions = {
      view: [500, 500],
      showXAxis: true,
      showYAxis: true,
      gradient: false,
      legend: false,
      showXAxisLabel: true,
      xAxisLabel: 'Aspect',
      showYAxisLabel: true,
      yAxisLabel: 'Annotations',
      animations: true,
      legendPosition: 'below',
      colorScheme: {
        domain: ['#AAAAAA']
      },
      customColors: []
    } */

  existsPieOptions = {
    view: [500, 200],
    gradient: true,
    legend: false,
    showLabels: true,
    isDoughnut: false,
    maxLabelLength: 20,
    colorScheme: {
      domain: [getColor('green', 500), getColor('red', 500)]
    },

  }

  annotationFrequencyBarOptions = {
    view: [500, 400],
    showXAxis: true,
    showYAxis: true,
    gradient: false,
    legend: false,
    showXAxisLabel: true,
    maxYAxisTickLength: 30,
    yAxisLabel: 'Terms',
    showYAxisLabel: true,
    xAxisLabel: 'Count',
  }

  stats = {
    annotationFrequencyBar: [],
    existsPie: [],
    termsBar: [],
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
          this.generateStats()
        }
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  generateStats() {
    const agg = this.annotationStats.termFrequency;

    if (agg?.buckets) {
      this.stats.annotationFrequencyBar = this.annotationService.buildAnnotationBar(agg.buckets)
    }

    this.stats.existsPie = this.annotationService.buildAnnotationBar(agg.buckets)
  }

}
