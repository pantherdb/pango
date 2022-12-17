import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { EntityType } from '@pango.common/models/entity-type';
import { MatDrawer } from '@angular/material/sidenav';
import { RightPanel } from '@pango.common/models/menu-panels';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';

@Component({
  selector: 'pango-annotation-summary',
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
    public pangoMenuService: PangoMenuService,
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
    this.pangoMenuService.selectRightPanel(RightPanel.annotationStats);
    this.pangoMenuService.openRightDrawer();
  }

  close() {
    this.panelDrawer.close();
  }

}
