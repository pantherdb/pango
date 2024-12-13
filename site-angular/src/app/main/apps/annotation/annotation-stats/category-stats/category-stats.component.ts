import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { pangoData } from '@pango.common/data/config';
import { getColor } from '@pango.common/data/pango-colors';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationStats, GeneStats, Term } from '../../models/annotation';
import { AnnotationPage } from '../../models/page';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-category-stats',
  templateUrl: './category-stats.component.html',
  styleUrls: ['./category-stats.component.scss']
})
export class CategoryStatsComponent implements OnInit, OnDestroy {

  SearchFilterType = SearchFilterType;
  aspectMap = pangoData.aspectMap;
  annotationPage: AnnotationPage;
  geneStats: GeneStats;
  showCategories;

  private _unsubscribeAll: Subject<any>;
  slimTermFrequency = [];

  constructor(private annotationService: AnnotationService,) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.annotationService.onGenesAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((geneStats: GeneStats) => {
        if (geneStats) {
          this.geneStats = geneStats;
          this.generateStats()

          //show if none is selected
          this.showCategories = this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS]?.length === 0;
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

  clearByType(filterType: string) {
    this.annotationService.searchCriteria[filterType] = []
    this.annotationService.updateSearch();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  selectSlimTerm(term: Term) {
    const slimTerms = this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS];
    if (!slimTerms.some(t => t.id === term.id)) {
      slimTerms.push(term);
      this.annotationService.updateSearch();
    }
  }

  generateStats() {
    if (this.geneStats.slimTermFrequency?.buckets) {
      this.slimTermFrequency = this.annotationService.buildCategoryBar(this.geneStats.slimTermFrequency.buckets)
    }
  }
}
