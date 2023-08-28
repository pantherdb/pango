import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { AnnotationService } from './../services/annotation.service'
import { AnnotationPage } from '../models/page';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { RightPanel } from '@pango.common/models/menu-panels';
import { MatLegacyTable as MatTable, MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { environment } from 'environments/environment';
import { pangoData } from '@pango.common/data/config';
import { Annotation } from '../models/annotation';
import { Gene } from '../../gene/models/gene.model';
@Component({
  selector: 'pango-annotation-table',
  templateUrl: './annotation-table.component.html',
  styleUrls: ['./annotation-table.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnnotationTableComponent implements OnInit, OnDestroy, OnChanges {
  RightPanel = RightPanel;
  aspectMap = pangoData.aspectMap;

  uniprotUrl = environment.uniprotUrl;
  columns: any[] = [];
  count = 0

  amigoTermUrl = environment.amigoTermUrl
  pubmedUrl = environment.pubmedUrl

  loadingIndicator: boolean;
  reorderable: boolean;



  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  taxonApiUrl = environment.taxonApiUrl

  annotationPage: AnnotationPage;
  @Input() annotations: Annotation[] = [];
  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  dataSource = new MatTableDataSource<any>();

  displayedColumns = [
    'gene',
    'term',
    'slimTerms',
    'evidence',
    'contributors'
  ];

  @Input('maxReferences') maxReferences = 2
  @Input('maxEvidences') maxEvidences = 2
  @Input('options') options;

  selectedGP: Gene

  private _unsubscribeAll: Subject<any>;

  constructor(
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService
  ) {
    this.loadingIndicator = false;
    this.reorderable = true;

    this._unsubscribeAll = new Subject();

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.annotations.currentValue) {
      this.dataSource = new MatTableDataSource<any>(this.annotations);
      this.annotationPage = this.annotationService.annotationPage
    }
  }

  ngOnInit(): void {

    if (this.options?.displayedColumns) {
      this.displayedColumns = this.options.displayedColumns
    }
  }

  getPubmedArticleUrl(pmid: string): string {
    if (!pmid) return ''

    const id = pmid?.split(':')
    if (id.length > 0) {
      return this.pubmedUrl + id[1];
    }
  }

  getUcscLink(element: Annotation) {
    const chr = `${element.coordinatesChrNum}:${element.coordinatesStart}-${element.coordinatesEnd}`
    return environment.ucscUrl + chr
  }

  getUniprotLink(gene: string) {
    const geneId = gene?.split(':')

    if (geneId.length > 1) {
      return this.uniprotUrl + geneId[1];
    }

    return gene;
  }

  getFamilyLink(element: Annotation) {

    return `${environment.pantherFamilyUrl}book=${encodeURIComponent(element.pantherFamily)}&seq=${encodeURIComponent(element.longId)}`
  }

  setPage($event) {
    if (this.annotationPage) {
      this.annotationService.getAnnotationsPage(this.annotationService.annotationPage.query, $event.pageIndex + 1);
    }
  }

  selectAnnotation(row) {
    this.pangoMenuService.selectRightPanel(RightPanel.annotationDetail);
    this.pangoMenuService.openRightDrawer();
    this.annotationService.onAnnotationChanged.next(row);
  }

  selectGene(gene: string) {

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

