import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { EntityType } from '@panther.common/models/entity-type';
import { MatDrawer } from '@angular/material/sidenav';
import { RightPanel } from '@panther.common/models/menu-panels';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';

@Component({
  selector: 'panther-annotation-summary',
  templateUrl: './annotation-summary.component.html',
  styleUrls: ['./annotation-summary.component.scss']
})
export class AnnotationSummaryComponent implements OnInit, OnDestroy {
  EntityType = EntityType;
  private _unsubscribeAll: Subject<any>;
  annotationPage: AnnotationPage
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
    private annotationService: AnnotationService) {

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
    this.pantherMenuService.selectRightPanel(RightPanel.annotationStats);
    this.pantherMenuService.openRightDrawer();
  }

  close() {
    this.panelDrawer.close();
  }

}
