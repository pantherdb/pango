import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { LeftPanel, RightPanel } from '@pango.common/models/menu-panels';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';
import { SearchCriteria } from '@pango.search/models/search-criteria';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-download',
  templateUrl: './download.component.html',
  styleUrls: ['./download.component.scss']
})
export class DownloadComponent implements OnInit {
  RightPanel = RightPanel;
  LeftPanel = LeftPanel

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  searchCriteria: any = {};
  searchForm: UntypedFormGroup;
  leftPanelMenu;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  scrollbarConfig = {
    suppressScrollX: true
  }

  constructor(public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService) {
  }

  ngOnInit() {
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.updateSearch();
    this.pangoMenuService.setLeftDrawer(this.leftDrawer);
    this.pangoMenuService.setRightDrawer(this.rightDrawer);
  }
}
