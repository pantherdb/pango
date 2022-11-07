import { Component, OnInit, OnDestroy, Input, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDrawer } from '@angular/material/sidenav';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { SearchFilterType } from '@panther.search/models/search-criteria';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { GenePage } from '../models/page';
import { GeneService } from '../services/gene.service';

@Component({
  selector: 'panther-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss'],
})

export class SearchFormComponent implements OnInit, OnDestroy {
  SearchFilterType = SearchFilterType;
  genePage: GenePage
  @Input('panelDrawer') panelDrawer: MatDrawer;

  @ViewChildren('searchInput') searchInput: QueryList<ElementRef>;
  filterForm: FormGroup;
  selectedOrganism = {};
  searchFormData: any = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filteredFields: Observable<any[]>;
  annotations: any[] = []
  columns: any[] = []

  private _unsubscribeAll: Subject<any>;

  constructor(
    private fb: FormBuilder,
    public pantherMenuService: PantherMenuService,
    public geneService: GeneService) {
    this.filterForm = this.createFilterForm();
    this._onValueChanges();

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {


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

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  setGenePage(genePage: GenePage) {
    if (genePage.source) {
      this.genePage = genePage;
      this.annotations = genePage.source.map((header) => {
        let count = ''
        if (genePage.aggs) {
          const agg = genePage.aggs[header]
          count = agg ? agg['docCount'] : '';
        }

        const label = 'detail.label ? detail.label : header';
        return {
          name: header,
          count: count,
          label: label.replace(/_/g, ' '),
        }
      });

    }
  }

  createFilterForm() {
    return new FormGroup({
      fields: new FormControl(),

    });
  }
  clear() {
    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });
  }

  fieldDisplayFn(field: any): string | undefined {
    return field ? field.name : undefined;
  }


  /* add(event: MatChipInputEvent, filterType, limit = 15): void {
    const input = event.input;
    const value = event.value;

    if (this.geneService.searchCriteria[filterType].length >= limit) {
      //  this.confirmDialogService.openInfoToast(`Reached maximum number of ${filterType} filters allowed`, 'OK');
    } else if ((value || '').trim()) {

      this.geneService.searchCriteria[filterType].push(value.trim());

      this.geneService.updateSearch();
      this.searchInput.forEach((item) => {
        item.nativeElement.value = null;
      });
      this.filterForm.controls[filterType].setValue('');
    }

    if (input) {
      input.value = '';
    }
  } */

  remove(item: string, filterType): void {
    const index = this.geneService.searchCriteria[filterType].indexOf(item);

    if (index >= 0) {
      this.geneService.searchCriteria[filterType].splice(index, 1);
      this.geneService.updateSearch();
    }
  }

  selected(event: MatAutocompleteSelectedEvent, filterType): void {
    this.geneService.searchCriteria[filterType].push(event.option.value);
    this.geneService.updateSearch();

    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });

    this.filterForm.controls[filterType].setValue('');
  }

  filterFields(value: string): any[] {
    const filterValue = value.toLowerCase();

    const annotations = this.annotations.filter((field: any) => field.name.toLowerCase().includes(filterValue)).slice(0, 20);
    return annotations;
  }


  private _onValueChanges() {
    this.filteredFields = this.filterForm.controls.fields.valueChanges
      .pipe(
        startWith(''),
        map(
          value => typeof value === 'string' ? value : value['name']),
        map(field => field ? this.filterFields(field) : this.annotations.slice(0, 20))
      );

  }

  close() {
    this.panelDrawer.close();
  }

}
