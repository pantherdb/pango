import { Component, OnInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PangoDataService } from '@pango.common/services/pango-data.service';
import { AnnotationService } from '../../services/annotation.service';

@Component({
  selector: 'pango-search-aspect-form',
  templateUrl: './search-aspect-form.component.html',
  styleUrls: ['./search-aspect-form.component.scss'],
})

export class SearchAspectFormComponent implements OnInit, OnDestroy {
  SearchFilterType = SearchFilterType;

  @ViewChildren('searchInput') searchInput: QueryList<ElementRef>;
  filterForm: UntypedFormGroup;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private fb: UntypedFormBuilder,
    public pangoMenuService: PangoMenuService,
    public pangoDataService: PangoDataService,
    public annotationService: AnnotationService) {
    this.filterForm = this.createFilterForm();
    this._onValueChanges();

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {


    this.filterForm.get('aspects')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
    ).subscribe((aspect) => {
      this.annotationService.searchCriteria[SearchFilterType.ASPECTS] = aspect
        ? [aspect]
        : [];
      this.annotationService.updateSearch();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }


  createFilterForm() {
    return new UntypedFormGroup({
      aspects: new UntypedFormControl(),
    });
  }

  toggleSelection(filterType: string, value) {

    switch (filterType) {

      case SearchFilterType.TERM_TYPES:
        this.annotationService.searchCriteria[SearchFilterType.EVIDENCE_TYPES] = [];
        break;
      case SearchFilterType.EVIDENCE_TYPES:
        this.annotationService.searchCriteria[SearchFilterType.TERM_TYPES] = [];
        break;
    }

    this.annotationService.searchCriteria[filterType] = this.annotationService.searchCriteria[filterType]?.[0] === value ?
      [] : [value];
    this.annotationService.updateSearch();
  }

  clear() {
    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });
  }

  clearByType(filterType: string) {
    this.annotationService.searchCriteria[filterType] = []
    this.annotationService.updateSearch();
  }

  clearAllFilters() {
    this.annotationService.searchCriteria.clearSearch()
    this.annotationService.updateSearch();
  }


  private _onValueChanges() {
    const self = this;

  }
}
