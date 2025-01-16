import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { pangoData } from '@pango.common/data/config';

@Component({
  selector: 'pango-gene-summary-table',
  templateUrl: './gene-summary-table.component.html',
  styleUrls: ['./gene-summary-table.component.scss']
})
export class GeneSummaryTableComponent implements OnInit {

  aspectMap = pangoData.aspectMap

  summaryKeys = {
    mfs: 'molecular function',
    bps: 'biological process',
    ccs: 'cellular component'
  };

  private _summary: any = {};

  @Input()
  set summary(value: any) {
    this._summary = value || {};
    this._summary.mfs = this._summary.mfs || [];
    this._summary.ccs = this._summary.ccs || [];
    this._summary.bps = this._summary.bps || [];
  }

  get summary(): any {
    return this._summary;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
