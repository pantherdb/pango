import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GenePage } from '../models/page';
import { GeneService } from '../services/gene.service';
import { EntityType } from '@panther.common/models/entity-type';
import { MatDrawer } from '@angular/material/sidenav';
import { RightPanel } from '@panther.common/models/menu-panels';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';

@Component({
  selector: 'panther-gene-summary',
  templateUrl: './gene-summary.component.html',
  styleUrls: ['./gene-summary.component.scss']
})
export class GeneSummaryComponent implements OnInit, OnDestroy {
  EntityType = EntityType;
  private _unsubscribeAll: Subject<any>;
  genePage: GenePage
  columns: any[] = [];

  @ViewChild('tree') tree;
  @Input('panelDrawer') panelDrawer: MatDrawer;
  treeNodes
  treeOptions = {
    allowDrag: false,
    allowDrop: false,
    // levelPadding: 15,
  };


  constructor(
    public pantherMenuService: PantherMenuService,
    private geneService: GeneService) {

    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  onTreeLoad() {
    // this.tree.treeModel.expandAll();
  }

  getStats(field) {
    this.geneService.queryAnnotationStats(field);
    this.pantherMenuService.selectRightPanel(RightPanel.geneStats);
    this.pantherMenuService.openRightDrawer();
  }

  close() {
    this.panelDrawer.close();
  }

}
