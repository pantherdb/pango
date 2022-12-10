import { Component, OnInit, OnDestroy, Input, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDrawer } from '@angular/material/sidenav';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { PantherMenuService } from '@panther.common/services/panther-menu.service';
import { SearchFilterType } from '@panther.search/models/search-criteria';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { Annotation, AutocompleteFilterArgs, AutocompleteType } from '../models/annotation';

@Component({
  selector: 'panther-search-form',
  templateUrl: './search-form.component.html',
  styleUrls: ['./search-form.component.scss'],
})

export class SearchFormComponent implements OnInit, OnDestroy {
  SearchFilterType = SearchFilterType;
  annotationPage: AnnotationPage
  @Input('panelDrawer') panelDrawer: MatDrawer;
  @Input('options') options = {
    hideGeneSearch: false
  };

  @ViewChildren('searchInput') searchInput: QueryList<ElementRef>;
  filterForm: FormGroup;
  selectedOrganism = {};
  searchFormData: any = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  annotations: any[] = []
  columns: any[] = []

  terms$: Observable<Annotation[]>;
  slimTerms$: Observable<Annotation[]>;
  evidenceTypes$: Observable<Annotation[]>;
  genes$: Observable<Annotation[]>;
  aspects$: Observable<Annotation[]>;
  qualifiers$: Observable<Annotation[]>;
  withgenes$: Observable<Annotation[]>;
  references$: Observable<Annotation[]>;

  private _unsubscribeAll: Subject<any>;

  constructor(
    private fb: FormBuilder,
    public pantherMenuService: PantherMenuService,
    public annotationService: AnnotationService) {
    this.filterForm = this.createFilterForm();
    this._onValueChanges();

    this._unsubscribeAll = new Subject();

  }

  ngOnInit(): void {
    const termsFilter = new AutocompleteFilterArgs(AutocompleteType.TERM)
    const evidenceTypesFilter = new AutocompleteFilterArgs(AutocompleteType.EVIDENCE_TYPE)
    const slimTermsFilter = new AutocompleteFilterArgs(AutocompleteType.SLIM_TERM)
    const genesFilter = new AutocompleteFilterArgs(AutocompleteType.GENE)
    const aspectsFilter = new AutocompleteFilterArgs(AutocompleteType.ASPECT)
    const qualifiersFilter = new AutocompleteFilterArgs(AutocompleteType.QUALIFIER)
    const withgenesFilter = new AutocompleteFilterArgs(AutocompleteType.WITHGENE)
    const referencesFilter = new AutocompleteFilterArgs(AutocompleteType.REFERENCE)

    this.terms$ = this.filterForm.get('terms')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(termsFilter, name))
    );

    this.slimTerms$ = this.filterForm.get('slimTerms')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(slimTermsFilter, name))
    );

    this.genes$ = this.filterForm.get('genes')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(genesFilter, name))
    );

    this.aspects$ = this.filterForm.get('aspects')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(aspectsFilter, name))
    );

    this.evidenceTypes$ = this.filterForm.get('evidenceTypes')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(evidenceTypesFilter, name))
    );

    this.qualifiers$ = this.filterForm.get('qualifiers')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(qualifiersFilter, name))
    );

    this.references$ = this.filterForm.get('references')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(referencesFilter, name))
    );

    this.withgenes$ = this.filterForm.get('withgenes')!.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(1000),
      filter((name) => !!name),
      switchMap(name => this.annotationService.getAutocompleteQuery(withgenesFilter, name))
    );
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  createFilterForm() {
    return new FormGroup({
      terms: new FormControl(),
      slimTerms: new FormControl(),
      genes: new FormControl(),
      evidenceTypes: new FormControl(),
      aspects: new FormControl(),
      qualifiers: new FormControl(),
      withgenes: new FormControl(),
      references: new FormControl(),
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

  slimTermDisplayFn(term: Annotation): string | undefined {
    return term ? term.slimTerms[0].label : undefined;
  }

  aspectDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.term.aspect : undefined;
  }

  evidenceTypeDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.evidenceType : undefined;
  }

  qualifierDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.gene : undefined;
  }

  geneDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.gene : undefined;
  }

  referenceDisplayFn(gene: Annotation): string | undefined {
    return gene ? gene.gene : undefined;
  }

  withgeneDisplayFn(gene: Annotation): string | undefined {
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
