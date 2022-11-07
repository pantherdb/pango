import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { takeUntil } from 'rxjs/operators';
import { GenePage } from '../models/page';
import { GeneService } from '../services/gene.service';
import { AnnotationStats } from '../models/gene';

enum StatsType {
  GENERAL = 'general',
  POSITION = 'position'
}

@Component({
  selector: 'panther-gene-stats',
  templateUrl: './gene-stats.component.html',
  styleUrls: ['./gene-stats.component.scss']
})
export class GeneStatsComponent implements OnInit, OnDestroy {
  StatsType = StatsType;
  genePage: GenePage;
  annotationStats: AnnotationStats;
  columns: any[] = [];

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  loadingSpinner: any = {
    color: 'primary',
    mode: 'indeterminate'
  };

  selectedStatsType = StatsType.GENERAL;
  selectedField = 'default';

  statsTypes = [
    {
      name: StatsType.GENERAL,
      label: 'General'
    },
    {
      name: StatsType.POSITION,
      label: 'Other'
    }
  ]

  private _unsubscribeAll: Subject<any>;

  pies = []

  constructor(
    private geneService: GeneService) {
    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {
    this.geneService.queryAnnotationStats(null);
    this.geneService.onGenesChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((genePage: GenePage) => {
        if (genePage) {
        }
      });

    this.geneService.onGenesAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationStats: AnnotationStats) => {
        if (annotationStats) {
          this.annotationStats = annotationStats;
          //this.selectedField = this.annotationStats.field;
        }
      });
  }


  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  selectStatsType(name: StatsType) {
    this.selectedStatsType = name;
  }


  selectField(field) {
    // this.geneService.getStats(field.value)
  }

  close() {
    this.panelDrawer.close();
  }

}
