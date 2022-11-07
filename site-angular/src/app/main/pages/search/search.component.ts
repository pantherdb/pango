import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatDrawer } from '@angular/material/sidenav';

import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { LeftPanel, RightPanel } from '@panther.common/models/menu-panels';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  RightPanel = RightPanel;
  LeftPanel = LeftPanel

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  searchCriteria: any = {};
  searchForm: FormGroup;
  leftPanelMenu;

  constructor(public pantherMenuService: PantherMenuService,
    private route: ActivatedRoute,
    private router: Router) {
  }

  ngOnInit() {
    this.pantherMenuService.setLeftDrawer(this.leftDrawer);
    this.pantherMenuService.setRightDrawer(this.rightDrawer);
  }
}
