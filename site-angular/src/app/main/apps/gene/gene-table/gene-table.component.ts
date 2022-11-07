import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { GeneService } from './../services/gene.service'
import { GenePage } from '../models/page';
import { Gene } from '../models/gene';
import { MatPaginator } from '@angular/material/paginator';
import { ColumnValueType } from '@panther.common/models/annotation';
import { RightPanel } from '@panther.common/models/menu-panels';
import { MatTable, MatTableDataSource } from '@angular/material/table';
@Component({
  selector: 'panther-gene-table',
  templateUrl: './gene-table.component.html',
  styleUrls: ['./gene-table.component.scss']
})
export class GeneTableComponent implements OnInit, OnDestroy {
  ColumnValueType = ColumnValueType;
  RightPanel = RightPanel;
  genePage: GenePage;
  gene;
  genes: any[] = [];
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
    'term',
    'reference'
  ];

  private _unsubscribeAll: Subject<any>;

  constructor(
    public pantherMenuService: PantherMenuService,
    public geneService: GeneService
  ) {
    this.loadingIndicator = false;
    this.reorderable = true;

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {



    this.geneService.getGenes(1);
    this.geneService.onGenesChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((genePage: GenePage) => {
        if (genePage) {
          this.setGenePage(genePage);
        } else {
          this.genePage = null
        }
      });

  }

  setGenePage(genePage: GenePage) {
    if (genePage.source) {

      if (genePage.gene) {
        this.gene = new Gene()
        this.gene.gene_id = genePage.gene.gene_id;
        this.gene.start = genePage.gene.start;
        this.gene.end = genePage.gene.end;
      } else {
        this.gene = null
      }

      this.genePage = genePage;
      this.dataSource = new MatTableDataSource<any>(this.genePage.genes);
    }
  }

  setPage($event) {
    if (this.genePage) {
      this.geneService.getGenesPage(this.genePage.query, $event.pageIndex + 1);
    }
  }

  selectGene() {
    this.pantherMenuService.selectRightPanel(RightPanel.geneDetail);
    this.pantherMenuService.openRightDrawer();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  openGeneSearch() {
    this.pantherMenuService.selectRightPanel(RightPanel.geneSearch);
    this.pantherMenuService.openRightDrawer()
  }

  openGeneTable() {
    this.pantherMenuService.selectRightPanel(RightPanel.geneTable);
    this.pantherMenuService.closeRightDrawer()
  }

  openGeneSummary() {
    this.pantherMenuService.selectRightPanel(RightPanel.geneSummary);
    this.pantherMenuService.openRightDrawer()
  }

  openGeneStats() {
    this.pantherMenuService.selectRightPanel(RightPanel.geneStats);
    this.pantherMenuService.openRightDrawer();
  }
}

