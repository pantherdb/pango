import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { MatPaginator } from '@angular/material/paginator';
import { ColumnValueType } from '@panther.common/models/annotation';
import { RightPanel } from '@panther.common/models/menu-panels';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { aspectMap } from '../models/annotation';
@Component({
  selector: 'panther-annotation-table',
  templateUrl: './annotation-table.component.html',
  styleUrls: ['./annotation-table.component.scss']
})
export class AnnotationTableComponent implements OnInit, OnDestroy {
  ColumnValueType = ColumnValueType;
  RightPanel = RightPanel;
  aspectMap = aspectMap;
  annotationPage: AnnotationPage;
  annotations: any[] = [];
  columns: any[] = [];
  count = 0

  loadingIndicator: boolean;
  reorderable: boolean;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>();

  displayedColumns = [
    'gene',
    'qualifier',
    'term',
    'slimTerms',
    'evidence',
    'group'
  ];

  @Input('maxReferences') maxReferences = 4
  @Input('maxEvidences') maxEvidences = 2
  @Input('options') options;

  private _unsubscribeAll: Subject<any>;

  constructor(
    public pantherMenuService: PantherMenuService,
    public annotationService: AnnotationService
  ) {
    this.loadingIndicator = false;
    this.reorderable = true;

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {

    if (this.options?.displayedColumns) {
      this.displayedColumns = this.options.displayedColumns
    }

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

  setAnnotationPage(annotationPage: AnnotationPage) {
    this.annotationPage = annotationPage;
    this.dataSource = new MatTableDataSource<any>(this.annotationPage.annotations);
  }

  setPage($event) {
    if (this.annotationPage) {
      this.annotationService.getAnnotationsPage(this.annotationPage.query, $event.pageIndex + 1);
    }
  }

  selectAnnotation(row) {
    this.pantherMenuService.selectRightPanel(RightPanel.annotationDetail);
    this.pantherMenuService.openRightDrawer();
    this.annotationService.onAnnotationChanged.next(row);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  openAnnotationSearch() {
    this.pantherMenuService.selectRightPanel(RightPanel.annotationSearch);
    this.pantherMenuService.openRightDrawer()
  }

  openAnnotationTable() {
    this.pantherMenuService.selectRightPanel(RightPanel.annotationTable);
    this.pantherMenuService.closeRightDrawer()
  }

  openAnnotationSummary() {
    this.pantherMenuService.selectRightPanel(RightPanel.annotationSummary);
    this.pantherMenuService.openRightDrawer()
  }

  openAnnotationStats() {
    this.pantherMenuService.selectRightPanel(RightPanel.annotationStats);
    this.pantherMenuService.openRightDrawer();
  }
}

