import { Component, OnDestroy, OnInit } from '@angular/core';
import { pangoData } from '@pango.common/data/config';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GeneStats, Term } from '../../models/annotation';
import { AnnotationPage } from '../../models/page';
import { AnnotationService } from '../../services/annotation.service';
import { PangoDataService } from '@pango.common/services/pango-data.service';

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
  showCategories: boolean = true;
  selectedAspects: string[] = [];
  slimTermFrequency = [];
  private _unsubscribeAll: Subject<any>;

  constructor(
    private annotationService: AnnotationService,
    public pangoDataService: PangoDataService
  ) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    // Initialize all aspects as selected
    this.selectedAspects = this.pangoDataService.aspectOption.options.map(aspect => aspect.id);

    this.annotationService.onGenesAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((geneStats: GeneStats) => {
        if (geneStats) {
          this.geneStats = geneStats;
          this.generateStats();
          this.showCategories = true;
        }
      });

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (!annotationPage) {
          this.annotationPage = null;
          return;
        }
        this.annotationPage = annotationPage;
      });
  }

  toggleAspect(aspectId: string): void {
    const index = this.selectedAspects.indexOf(aspectId);
    if (index === -1) {
      this.selectedAspects.push(aspectId);
    } else {
      this.selectedAspects.splice(index, 1);
    }
    this.generateStats();
  }

  selectSlimTerm(term: Term): void {
    const slimTerms = this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS] || [];
    if (!slimTerms.some(t => t.id === term.id)) {
      slimTerms.push(term);
      this.annotationService.updateSearch();
    }
  }

  generateStats(): void {
    if (this.geneStats?.slimTermFrequency?.buckets) {
      const filteredBuckets = this.geneStats.slimTermFrequency.buckets
        .filter(bucket => this.selectedAspects.includes(bucket.meta.aspect));
      this.slimTermFrequency = this.annotationService.buildCategoryBar(filteredBuckets);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}