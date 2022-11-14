import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { LeftPanel, RightPanel } from '@panther.common/models/menu-panels';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';
import { SearchCriteria } from '@panther.search/models/search-criteria';
import { filter, map } from 'rxjs';

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
  searchForm: FormGroup;
  leftPanelMenu;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  scrollbarConfig = {
    suppressScrollX: true
  }

  constructor(public pantherMenuService: PantherMenuService,
    public annotationService: AnnotationService,
    private route: ActivatedRoute,
    private router: Router) {

  }

  ngOnInit() {
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.updateSearch();
    this.pantherMenuService.setLeftDrawer(this.leftDrawer);
    this.pantherMenuService.setRightDrawer(this.rightDrawer);
  }
}
