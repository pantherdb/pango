import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ColumnValueType } from '@panther.common/models/annotation';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Annotation, aspectMap } from '../models/annotation';


import { AnnotationService } from '../services/annotation.service';

@Component({
  selector: 'panther-annotation-detail',
  templateUrl: './annotation-detail.component.html',
  styleUrls: ['./annotation-detail.component.scss']
})
export class AnnotationDetailComponent implements OnInit, OnDestroy {
  ColumnValueType = ColumnValueType
  aspectMap = aspectMap;

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  annotation: Annotation;
  private _unsubscribeAll: Subject<any>;
  constructor(
    private annotationService: AnnotationService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.annotationService.onAnnotationChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotation: Annotation) => {
        if (!annotation) {
          return
        }
        this.annotation = annotation;
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  close() {
    this.panelDrawer.close()
  }
}

