import { Component, OnDestroy, OnInit } from '@angular/core';
import { pangoData } from '@pango.common/data/config';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats, GeneStats } from '../../models/annotation';
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
  geneStats: GeneStats;
  geneCount;
  knowledgeCount = {
    'known': 0,
    'unknown': 0,
  };

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
}
