import { Component, OnInit, OnDestroy, NgZone, Input } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { AnnotationStats } from '../models/annotation';

enum StatsType {
  GENERAL = 'general',
  POSITION = 'position'
}

@Component({
  selector: 'pango-annotation-stats',
  templateUrl: './annotation-stats.component.html',
  styleUrls: ['./annotation-stats.component.scss']
})
export class AnnotationStatsComponent implements OnInit, OnDestroy {
  StatsType = StatsType;
  annotationPage: AnnotationPage;
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
    private annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {
    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (annotationPage) {
        }
      });

    this.annotationService.onAnnotationsAggsChanged
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
    // this.annotationService.getStats(field.value)
  }

  close() {
    this.panelDrawer.close();
  }

}
