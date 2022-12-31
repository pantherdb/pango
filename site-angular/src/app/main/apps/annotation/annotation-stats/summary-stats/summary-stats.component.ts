import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { pangoData } from '@pango.common/data/config';
import { getColor } from '@pango.common/data/pango-colors';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats } from '../../models/annotation';
import { AnnotationPage } from '../../models/page';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-summary-stats',
  templateUrl: './summary-stats.component.html',
  styleUrls: ['./summary-stats.component.scss']
})
export class SummaryStatsComponent implements OnInit, OnDestroy {

  aspectMap = pangoData.aspectMap;
  evidenceTypeMap = pangoData.evidenceTypeMap
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
    onSelect: this.onSelectAspect.bind(this)

  }




  customColors = Object.keys(this.aspectMap).map((aspect) => {
    return {
      name: this.aspectMap[aspect].label,
      value: this.aspectMap[aspect].color,
    }
  });

  customEvidenceColors = Object.keys(this.evidenceTypeMap).map((evidenceType) => {
    return {
      name: this.evidenceTypeMap[evidenceType].id,
      value: this.evidenceTypeMap[evidenceType].color,
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
    onSelect: this.onSelectEvidenceType.bind(this)
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
    onSelect: this.onSelectTerm.bind(this)
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

    onSelect: this.onSelectSlimTerm.bind(this)
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
    console.log(event)
    this.annotationService.searchCriteria[SearchFilterType.ASPECTS] = [event.name];
    this.annotationService.updateSearch();
  }

  onSelectEvidenceType(event) {
    this.annotationService.searchCriteria[SearchFilterType.EVIDENCE_TYPES] = [event.name];
    this.annotationService.updateSearch();
  }

  onSelectSlimTerm(event) {
    if (event.extra?.id) {
      this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS] = [event.extra];
      this.annotationService.updateSearch();
    }
  }

  onSelectTerm(event) {
    if (event.extra?.id) {
      this.annotationService.searchCriteria[SearchFilterType.TERMS] = [event.extra];
      this.annotationService.updateSearch();
    }
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
