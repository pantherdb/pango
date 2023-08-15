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
import { Annotation, AnnotationGroup } from '../models/annotation';
import { Gene } from '../../gene/models/gene.model';
@Component({
  selector: 'pango-gene-list',
  templateUrl: './gene-list.component.html',
  styleUrls: ['./gene-list.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneListComponent implements OnInit, OnDestroy, OnChanges {
  RightPanel = RightPanel;
  aspectMap = pangoData.aspectMap;

  uniprotUrl = environment.uniprotUrl;
  columns: any[] = [];
  count = 0

  amigoTermUrl = environment.amigoTermUrl
  pubmedUrl = environment.pubmedUrl

  loadingIndicator: boolean;



  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  taxonApiUrl = environment.taxonApiUrl

  @Input() annotationPage: AnnotationPage;

  @ViewChild(MatTable) table: MatTable<any>

  @ViewChild(MatPaginator, { static: true })
  paginator: MatPaginator;

  annotationGroups: AnnotationGroup[];

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

    this._unsubscribeAll = new Subject();

  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.annotationPage.currentValue) {
      console.log('changed ann group');
      this.annotationGroups = this.annotationPage.annotations

      console.log(this.annotationGroups)
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
      this.annotationService.getAnnotationsPage(this.annotationPage.query, $event.pageIndex + 1);
    }
  }

  selectAnnotationGroup(annotationGroup: AnnotationGroup) {

    this.annotationService.onSelectedAnnotationGroupChanged.next(annotationGroup);
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

