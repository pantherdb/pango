import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { getColor } from '@panther.common/data/panther-colors';
import { SearchFilterType } from '@panther.search/models/search-criteria';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats, aspectMap, Bucket, evidenceTypeMap } from '../../models/annotation';
import { AnnotationPage } from '../../models/page';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'panther-summary-stats',
  templateUrl: './summary-stats.component.html',
  styleUrls: ['./summary-stats.component.scss']
})
export class SummaryStatsComponent implements OnInit, OnDestroy {

  aspectMap = aspectMap
  annotationPage: AnnotationPage;
  annotationStats: AnnotationStats;

  /*   termFrequencyBarOptions = {
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

  aspectPieOptions = {
    view: [100, 100],
    gradient: true,
    legend: false,
    showLabels: false,
    isDoughnut: true,
    maxLabelLength: 20,
    colorScheme: {
      domain: [
        getColor('green', 500),
        getColor('brown', 500),
        getColor('purple', 500)
      ]

    },
    onSelect: this.onSelectAspect

  }




  customColors = Object.keys(aspectMap).map((aspect) => {
    return {
      name: aspectMap[aspect].label,
      value: aspectMap[aspect].color,
    }
  });

  customEvidenceColors = Object.keys(evidenceTypeMap).map((evidenceType) => {
    return {
      name: evidenceTypeMap[evidenceType].id,
      value: evidenceTypeMap[evidenceType].color,
    }
  });


  evidenceTypePieOptions = {
    view: [100, 100],
    gradient: true,
    legend: false,
    showLabels: false,
    isDoughnut: true,
    maxLabelLength: 20,
    colorScheme: {
      domain: [
        getColor('blue', 500),
        getColor('green', 500),
        getColor('brown', 500),
        getColor('purple', 500),
        getColor('teal', 500),
        getColor('orange', 500),
      ]
    },
  }

  termFrequencyBarOptions = {
    view: [350, 350],
    showXAxis: true,
    showYAxis: true,
    gradient: true,
    legend: false,
    showXAxisLabel: false,
    maxYAxisTickLength: 30,
    yAxisLabel: 'Terms',
    showYAxisLabel: true,
    xAxisLabel: 'Count',
    colorScheme: {
      domain: [
        getColor('blue-grey', 500),
      ]

    },
  }

  slimTermFrequencyBarOptions = {
    view: [350, 350],
    showXAxis: true,
    showYAxis: true,
    gradient: true,
    legend: false,
    showXAxisLabel: false,
    maxYAxisTickLength: 30,
    yAxisLabel: 'Slim Terms',
    showYAxisLabel: true,
    xAxisLabel: 'Count',
    colorScheme: {
      domain: [
        getColor('orange', 800),
      ]

    },
  }

  stats = {
    termFrequencyBar: [],
    aspectPie: [],
    evidenceTypePie: [],
    termsBar: [],
    slimTermFrequencyBar: []
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

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (!annotationPage) {
          this.annotationPage = null;
          return
        }

        this.annotationPage = annotationPage;
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  onSelectAspect(event) {
    //this.annotationService.searchCriteria[SearchFilterType.ASPECTS].push(event.name);
    //this.annotationService.updateSearch();

  }

  generateStats() {

    if (this.annotationStats.termFrequency?.buckets) {
      this.stats.termFrequencyBar = this.annotationService.buildAnnotationBar(this.annotationStats.termFrequency.buckets)
    }

    if (this.annotationStats.aspectFrequency?.buckets) {
      this.stats.aspectPie = this.annotationService.buildAspectChart(this.annotationStats.aspectFrequency.buckets)
    }

    if (this.annotationStats.evidenceTypeFrequency?.buckets) {
      this.stats.evidenceTypePie = this.annotationService.buildAnnotationBar(this.annotationStats.evidenceTypeFrequency.buckets)
    }

    if (this.annotationStats.slimTermFrequency?.buckets) {
      this.stats.slimTermFrequencyBar = this.annotationService.buildAnnotationBar(this.annotationStats.slimTermFrequency.buckets)
    }

  }

}
