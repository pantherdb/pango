import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute } from '@angular/router';
import { RightPanel, LeftPanel } from '@pango.common/models/menu-panels';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { Annotation } from 'app/main/apps/annotation/models/annotation';
import { AnnotationPage } from 'app/main/apps/annotation/models/page';
import { AnnotationService } from 'app/main/apps/annotation/services/annotation.service';
import { Gene } from 'app/main/apps/gene/models/gene.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-gene',
  templateUrl: './gene.component.html',
  styleUrls: ['./gene.component.scss']
})
export class GeneComponent implements OnInit, OnDestroy {

  RightPanel = RightPanel;
  LeftPanel = LeftPanel

  @ViewChild('leftDrawer', { static: true })
  leftDrawer: MatDrawer;

  @ViewChild('rightDrawer', { static: true })
  rightDrawer: MatDrawer;

  searchForm: FormGroup;
  leftPanelMenu;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  scrollbarConfig = {
    suppressScrollX: true
  }

  gene: Gene;
  geneId: string;

  searchFormOptions: {
    hideGeneSearch: true
  }

  maxReferences = 150
  maxEvidences = 200

  tableOptions = {
    displayedColumns: [
      'term',
      'slimTerms',
      'evidence',
      'contributors'
    ]
  }

  private _unsubscribeAll: Subject<any>;


  constructor(private route: ActivatedRoute,
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
    this.route
      .params
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(params => {
        this.geneId = params['gene'] || null;

        const annotation = new Annotation()
        annotation.gene = this.geneId
        this.annotationService.searchCriteria.genes = [annotation]
        this.annotationService.updateSearch();
      });
  }

  ngOnInit(): void {
    this.pangoMenuService.setLeftDrawer(this.leftDrawer);
    this.pangoMenuService.setRightDrawer(this.rightDrawer);

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (annotationPage) {
          this.gene = new Gene();
          this.gene.gene = annotationPage.annotations[0].gene;
          this.gene.geneName = annotationPage.annotations[0]?.geneName;
          this.gene.geneSymbol = annotationPage.annotations[0]?.geneSymbol;
        } else {
          this.gene = null
        }
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

}
