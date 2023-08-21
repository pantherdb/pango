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
  geneCount;
  knowledgeCount = {
    'known': 0,
    'unknown': 0,
  };

  aspectPieOptions = {
    view: [100, 100],
    gradient: true,
    legend: false,
    showLabels: false,
    isDoughnut: true,
    maxLabelLength: 20,
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
    onSelect: this.onSelectEvidenceType.bind(this)
  }


  stats = {
    aspectPie: [],
    evidenceTypePie: [],
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
          this.knowledgeCount = {
            'known': 0,
            'unknown': 0,
          };
          this.annotationStats.termTypeFrequency.buckets.forEach(bucket => {
            this.knowledgeCount[bucket.key] = bucket.docCount;
          });
          this.generateStats()
        }
      });

    this.annotationService.onGeneCountChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((geneCount: number) => {
        this.geneCount = geneCount;

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

    if (this.annotationStats.aspectFrequency?.buckets) {
      this.stats.aspectPie = this.annotationService.buildAspectChart(this.annotationStats.aspectFrequency.buckets)
    }

    if (this.annotationStats.evidenceTypeFrequency?.buckets) {
      this.stats.evidenceTypePie = this.annotationService.buildAnnotationBar(this.annotationStats.evidenceTypeFrequency.buckets)
    }



  }

}
