import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { LeftPanel, RightPanel } from '@pango.common/models/menu-panels';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
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

  closeLeftDrawer() {
    this.leftDrawer.close()
  }
}
