import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { Annotation } from '../models/annotation';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { RightPanel } from '@pango.common/models/menu-panels';
import { MatLegacyTable as MatTable, MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
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
    'gene',
    'geneSymbol',
    'termId',
    'termLabel'
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

    this.annotationService.getAnnotationsExport(1);
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

  downloadAll() {
    this.annotationService.getAnnotationsExportAll().subscribe((annotationPage: AnnotationPage) => {
      if (annotationPage) {

      } else {

      }
    });
  }

  downloadFile() {
    const replacer = (key, value) => (value === null ? '' : value);
    const csv = this.annotationPage.annotations.map((annotation) =>
      `"${annotation.gene}","${annotation.geneSymbol}","${annotation.term.id}","${annotation.term.label}"`
    );
    csv.unshift('Gene,Gene Symbol, Term Id, Term Label');
    const csvArray = csv.join('\r\n');

    const a = document.createElement('a');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = 'human_functionome_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
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

