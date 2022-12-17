import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { Annotation } from '../models/annotation';
import { MatPaginator } from '@angular/material/paginator';
import { RightPanel } from '@pango.common/models/menu-panels';
import { MatTable, MatTableDataSource } from '@angular/material/table';
@Component({
  selector: 'pango-annotation-table-long',
  templateUrl: './annotation-table-long.component.html',
  styleUrls: ['./annotation-table-long.component.scss']
})
export class AnnotationTableLongComponent implements OnInit, OnDestroy {
  RightPanel = RightPanel;
  annotationPage: AnnotationPage;
  annotation;
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
    'annotation',
    'geneSymbol',
    'geneName',
    'aspect',
    'qualifier',
    'term',
    'slimTerms',
    'evidence',
    'group'
  ];

  private _unsubscribeAll: Subject<any>;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService
  ) {
    this.loadingIndicator = false;
    this.reorderable = true;

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {



    this.annotationService.getAnnotations(1);
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

  selectAnnotation() {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationDetail);
    this.pangoMenuService.openRightDrawer();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  openAnnotationSearch() {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationSearch);
    this.pangoMenuService.openRightDrawer()
  }

  openAnnotationTable() {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationTable);
    this.pangoMenuService.closeRightDrawer()
  }

  openAnnotationSummary() {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationSummary);
    this.pangoMenuService.openRightDrawer()
  }

  openAnnotationStats() {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationStats);
    this.pangoMenuService.openRightDrawer();
  }
}

