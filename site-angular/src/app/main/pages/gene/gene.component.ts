import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { pangoData } from '@pango.common/data/config';
import { RightPanel, LeftPanel } from '@pango.common/models/menu-panels';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { SearchType } from '@pango.search/models/search-criteria';
import { PangoUtils } from '@pango/utils/pango-utils';
import { Annotation } from 'app/main/apps/annotation/models/annotation';
import { AnnotationPage } from 'app/main/apps/annotation/models/page';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';
import { Gene } from 'app/main/apps/gene/models/gene.model';
import { environment } from 'environments/environment';
import { orderBy } from 'lodash';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gene',
  templateUrl: './gene.component.html',
  styleUrls: ['./gene.component.scss']
})
export class GeneComponent implements OnInit, OnDestroy {

  taxonApiUrl = environment.taxonApiUrl;
  RightPanel = RightPanel;
  LeftPanel = LeftPanel
  aspectOrder = pangoData.aspectOrder;

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  leftPanelMenu;

  annotations: Annotation[];

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  scrollbarConfig = {
    suppressScrollX: true
  }

  annotation: Annotation;
  geneId: string;
  hgncId;

  searchFormOptions: {
    hideGeneSearch: true
  }

  maxReferences = 5
  maxEvidences = 2

  tableOptions = {
    displayedColumns: [
      'term',
      'slimTerms',
      'evidence',
      'contributors'
    ]
  }



  private _unsubscribeAll: Subject<any>;


  constructor(private route: ActivatedRoute,
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
    this.route
      .params
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        this.geneId = params['gene'] || null;

        const annotation = new Annotation()
        annotation.gene = this.geneId
        this.annotationService.searchType = SearchType.ANNOTATIONS;
        this.annotationService.searchCriteria.clearSearch()
        this.annotationService.searchCriteria.genes = [annotation]
        this.annotationService.updateSearch();
      });
  }

  ngOnInit(): void {
    this.pangoMenuService.setLeftDrawer(this.leftDrawer);
    this.pangoMenuService.setRightDrawer(this.rightDrawer);

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (annotationPage && annotationPage.annotations.length > 0) {
          this.annotation = annotationPage.annotations[0];

          const sortedAnnotations = orderBy(annotationPage.annotations, item => this.aspectOrder[item.term.aspect])
          this.annotations = sortedAnnotations;
          this.hgncId = PangoUtils.getHGNC(this.annotation.longId);
        } else {
          this.annotation = null
        }
      });

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  getAGRLink() {

    if (this.hgncId) {
      return environment.agrPrefixUrl + this.hgncId;
    }

    return environment.agrPrefixUrl;

  }

  getHGNCLink() {

    if (this.hgncId) {
      return environment.hgncPrefixUrl + this.hgncId;
    }

    return environment.hgncPrefixUrl;

  }

  getUcscLink(element: Annotation) {
    const chr = `${element.coordinatesChrNum}:${element.coordinatesStart}-${element.coordinatesEnd}`
    return environment.ucscUrl + chr
  }

  getUniprotLink(gene: string) {
    const geneId = gene.split(':')

    if (geneId.length > 1) {
      return environment.uniprotUrl + geneId[1];
    }

    return gene;
  }

  getFamilyLink(element: Annotation) {

    return `${environment.pantherFamilyUrl}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`
  }

}
