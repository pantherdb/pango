import { Component, OnInit, OnDestroy, Input, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDrawer } from '@angular/material/sidenav';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { SearchFilterType } from '@pango.search/models/search-criteria';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { Annotation, AnnotationStats, AutocompleteFilterArgs, AutocompleteType, Bucket, Term } from '../models/annotation';
import { SelectionModel } from '@angular/cdk/collections';
import { PangoDataService } from '@pango.common/services/pango-data.service';
import { pangoData } from '@pango.common/data/config';

@Component({
  selector: 'pango-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss'],
})

export class SearchFormComponent implements OnInit, OnDestroy {
  SearchFilterType = SearchFilterType;
  annotationPage: AnnotationPage
  annotationStats: AnnotationStats
  @Input('panelDrawer') panelDrawer: MatDrawer;
  @Input('options') options = {
    hideGeneSearch: false
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

  selection = new SelectionModel<Bucket>(true, []);

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
    const termsFilter = new AutocompleteFilterArgs(AutocompleteType.TERM)
    const slimTermsFilter = new AutocompleteFilterArgs(AutocompleteType.SLIM_TERM)
    const genesFilter = new AutocompleteFilterArgs(AutocompleteType.GENE)

    this.annotationService.onAnnotationsAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationStats: AnnotationStats) => {
        if (annotationStats) {
          this.annotationStats = annotationStats;
        }
      });

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

    this.terms$ = this.filterForm.get('terms')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(termsFilter, name))
    );

    this.slimTerms$ = this.filterForm.get('slimTerms')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getSlimTermsAutocompleteQuery(name))
    );

    this.genes$ = this.filterForm.get('genes')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(genesFilter, name))
    );

    this.filterForm.get('evidenceTypes')!.valueChanges.pipe(
      takeUntil(this._unsubscribeAll),
      distinctUntilChanged(),
      debounceTime(1000),
    ).subscribe((evidenceType) => {
      this.annotationService.searchCriteria[SearchFilterType.EVIDENCE_TYPES] = evidenceType ?
        [evidenceType] : [];
      this.annotationService.updateSearch();
    });

    // this.annotationStats.slimTermFrequency?.buckets
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  toggleSelection(item: Bucket) {
    this.selection.toggle(item)
    if (this.selection.isSelected) {
      this.selection.selected.forEach(selected => {
        this.annotationService.searchCriteria[SearchFilterType.ASPECTS] = []
        this.annotationService.searchCriteria[SearchFilterType.ASPECTS].push(selected.key);
      });

      this.annotationService.updateSearch();
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.annotationStats.aspectFrequency.buckets.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.annotationStats.aspectFrequency.buckets.forEach(row => this.selection.select(row));
  }

  selectSlimTerm(term: Term) {
    this.annotationService.searchCriteria[SearchFilterType.SLIM_TERMS] = [term];
    this.annotationService.updateSearch();
  }

  createFilterForm() {
    return new UntypedFormGroup({
      terms: new UntypedFormControl(),
      slimTerms: new UntypedFormControl(),
      genes: new UntypedFormControl(),
      evidenceTypes: new UntypedFormControl(),
      aspects: new UntypedFormControl(),
    });
  }
  clear() {
    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });
  }

  clearRelationType(filterType: string) {
    this.filterForm.controls[filterType].setValue(null);
  }

  termDisplayFn(term: Annotation): string | undefined {
    return term ? term.term.label : undefined;
  }

  slimTermDisplayFn(term: Term): string | undefined {
    return term ? term.label : undefined;
  }

  geneDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.gene : undefined;
  }


  /* add(event: MatChipInputEvent, filterType, limit = 15): void {
    const input = event.input;
    const value = event.value;

    if (this.annotationService.searchCriteria[filterType].length >= limit) {
      //  this.confirmDialogService.openInfoToast(`Reached maximum number of ${filterType} filters allowed`, 'OK');
    } else if ((value || '').trim()) {

      this.annotationService.searchCriteria[filterType].push(value.trim());

      this.annotationService.updateSearch();
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
    const index = this.annotationService.searchCriteria[filterType].indexOf(item);

    if (index >= 0) {
      this.annotationService.searchCriteria[filterType].splice(index, 1);
      this.annotationService.updateSearch();
    }
  }

  selected(event: MatAutocompleteSelectedEvent, filterType): void {
    this.annotationService.searchCriteria[filterType].push(event.option.value);
    this.annotationService.updateSearch();

    this.searchInput.forEach((item) => {
      item.nativeElement.value = null;
    });

    this.filterForm.controls[filterType].setValue('');
  }

  private _onValueChanges() {
    const self = this;

  }

  close() {
    this.panelDrawer.close();
  }

}
