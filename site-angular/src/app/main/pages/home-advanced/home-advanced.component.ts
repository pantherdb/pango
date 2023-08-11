import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { LeftPanel, RightPanel } from '@pango.common/models/menu-panels';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';
import { pangoData } from '@pango.common/data/config';
import { AnnotationPage } from 'app/main/apps/annotation/models/page';
import { Subject, takeUntil } from 'rxjs';
import { SearchType } from '@pango.search/models/search-criteria';
import { Annotation, AnnotationGroup } from 'app/main/apps/annotation/models/annotation';
import { environment } from 'environments/environment';
import { PangoUtils } from '@pango/utils/pango-utils';

@Component({
  selector: 'app-home-advanced',
  templateUrl: './home-advanced.component.html',
  styleUrls: ['./home-advanced.component.scss']
})
export class HomeAdvancedComponent implements OnInit {
  RightPanel = RightPanel;
  LeftPanel = LeftPanel

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  selectedAnnotationGroup: AnnotationGroup;
  searchCriteria: any = {};
  searchForm: UntypedFormGroup;
  leftPanelMenu;

  annotationPage: AnnotationPage;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  tableOptions = {
    displayedColumns: [
      'term',
      'slimTerms',
      'evidence',
      'contributors'
    ]
  }

  scrollbarConfig = {
    suppressScrollX: true
  }

  private _unsubscribeAll: Subject<any>;


  constructor(public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService) {

    this._unsubscribeAll = new Subject();
  }

  ngOnInit() {
    this.annotationService.searchType = SearchType.ANNOTATION_GROUP;
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.searchCriteria.termTypes = [pangoData.termTypeMap.known.id]
    this.annotationService.updateSearch();

    this.pangoMenuService.setLeftDrawer(this.leftDrawer);
    this.pangoMenuService.setRightDrawer(this.rightDrawer);

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (annotationPage) {
          this.setAnnotationPage(annotationPage);
        } else {
          this.annotationPage = null
        }
      });

    this.annotationService.onSelectedAnnotationGroupChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationGroup: AnnotationGroup) => {
        if (annotationGroup) {
          this.selectedAnnotationGroup = annotationGroup
        } else {
          this.annotationPage = null
        }
      });
  }

  closeLeftDrawer() {
    this.leftDrawer.close()
  }

  clearAllFIlters() {
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.updateSearch();
  }

  setAnnotationPage(annotationPage: AnnotationPage) {
    this.annotationPage = annotationPage;
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }



  getAGRLink(hgncId) {

    if (hgncId) {
      return environment.agrPrefixUrl + hgncId;
    }

    return environment.agrPrefixUrl;

  }

  getHGNCLink(hgncId) {

    if (hgncId) {
      return environment.hgncPrefixUrl + hgncId;
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
