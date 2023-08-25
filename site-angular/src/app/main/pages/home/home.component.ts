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
import { SearchFilterType, SearchType } from '@pango.search/models/search-criteria';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  SearchFilterType = SearchFilterType;
  RightPanel = RightPanel;
  LeftPanel = LeftPanel

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  searchCriteria: any = {};
  searchForm: UntypedFormGroup;
  leftPanelMenu;

  annotationPage: AnnotationPage;


  geneFormOptions = {
    hideGeneSearch: false,
    hideTermSearch: true
  }

  termFormOptions = {
    hideGeneSearch: true,
    hideTermSearch: false
  }

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

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
    // this.annotationService.searchCriteria.termTypes = [pangoData.termTypeMap.known.id]
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
  }

  closeLeftDrawer() {
    this.leftDrawer.close()
  }

  clearAllFilters() {
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.updateSearch();
  }


  removeFilter(filterType: string) {
    this.annotationService.searchCriteria[filterType] = [];
    this.annotationService.updateSearch();
  }

  setAnnotationPage(annotationPage: AnnotationPage) {
    this.annotationPage = annotationPage;
  }


  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
