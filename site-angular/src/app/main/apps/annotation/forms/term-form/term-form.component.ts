import { Component, OnInit, OnDestroy, Input, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent } from '@angular/material/legacy-autocomplete';
import { MatDrawer } from '@angular/material/sidenav';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../../models/page';
import { AnnotationService } from '../../services/annotation.service';
import { Annotation, AnnotationStats, Term } from '../../models/annotation';
import { SelectionModel } from '@angular/cdk/collections';
import { PangoDataService } from '@pango.common/services/pango-data.service';
import { pangoData } from '@pango.common/data/config';

@Component({
  selector: 'pango-term-form',
  templateUrl: './term-form.component.html',
  styleUrls: ['./term-form.component.scss'],
})

export class TermFormComponent implements OnInit, OnDestroy {
  SearchFilterType = SearchFilterType;
  annotationPage: AnnotationPage
  annotationStats: AnnotationStats
  @Input('panelDrawer') panelDrawer: MatDrawer;
  @Input('options') options = {
    hideGeneSearch: false,
    hideTermSearch: false
  };

  @ViewChildren('searchInput') searchInput: QueryList<ElementRef>;
  filterForm: UntypedFormGroup;
  // searchFormData: any = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  annotations: any[] = []
  aspectMap = pangoData.aspectMap;

  terms$: Observable<Annotation[]>;
  slimTerms$: Observable<Term[]>;
  genes$: Observable<Annotation[]>;

  private _unsubscribeAll: Subject<any>;

  constructor(
    public pangoMenuService: PangoMenuService,
    public pangoDataService: PangoDataService,
    public annotationService: AnnotationService) {
    this.filterForm = this.createFilterForm();

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {
    this.slimTerms$ = this.filterForm.get('slimTerms')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getSlimTermsAutocompleteQuery(name))
    );
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  selectSlimTerm(term: Term) {
    this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS] = [term];
    this.annotationService.updateSearch();
  }

  createFilterForm() {
    return new UntypedFormGroup({
      slimTerms: new UntypedFormControl(),
      genes: new UntypedFormControl(),
    });
  }

  clear() {
    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });
  }

  termDisplayFn(term: Annotation): string | undefined {
    return term ? term.term.label : undefined;
  }

  slimTermDisplayFn(term: Term): string | undefined {
    return term ? term.label : undefined;
  }

  remove(item: string, filterType): void {
    const index = this.annotationService.searchCriteria[filterType].indexOf(item);

    if (index >= 0) {
      this.annotationService.searchCriteria[filterType].splice(index, 1);
      this.annotationService.updateSearch();
    }
  }

  selected(event: MatAutocompleteSelectedEvent, filterType): void {
    if (this.annotationService.searchCriteria[filterType].length < 1) {
      this.annotationService.searchCriteria[filterType].push(event.option.value);
      this.annotationService.updateSearch();
    }
    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });

    this.filterForm.controls[filterType].setValue('');
  }

  close() {
    this.panelDrawer.close();
  }

}
