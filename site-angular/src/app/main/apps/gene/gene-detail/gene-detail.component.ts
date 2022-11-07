import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ColumnValueType } from '@panther.common/models/annotation';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


import { GeneService } from '../services/gene.service';

@Component({
  selector: 'panther-gene-detail',
  templateUrl: './gene-detail.component.html',
  styleUrls: ['./gene-detail.component.scss']
})
export class GeneDetailComponent implements OnInit, OnDestroy {
  ColumnValueType = ColumnValueType

  @Input('panelDrawer')
  panelDrawer: MatDrawer;

  rows: any;
  private _unsubscribeAll: Subject<any>;
  constructor(
    private geneService: GeneService) {
    this._unsubscribeAll = new Subject();
  }

  ngOnInit(): void {
    this.geneService.onGeneChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(geneRow => {
        if (!geneRow) {
          return
        }

        this.rows = geneRow.map(row => {
          return {
            name: row.name,
            values: this.mapFieldValues(row.value, row.rootUrl)
          }
        })

      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  mapFieldValues(value, rootUrl) {

    let list = []
    if (!value) {
      return list;
    }

    if (typeof value === 'string' || value instanceof String) {
      list = value.split('|')
    } else {
      list = [value.toString()]
    }


    const result = list.map(item => {
      if (rootUrl) {
        return {
          url: rootUrl + item,
          label: item
        }
      } else {
        return {
          label: item
        }
      }
    })

    return result;
  }

  close() {
    this.panelDrawer.close()
  }
}

