import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent } from '@angular/material/legacy-autocomplete';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { Subject, Observable } from 'rxjs';
import { startWith, map, takeUntil } from 'rxjs/operators';
import { AnnotationPage } from '../models/page';
import { AnnotationService } from '../services/annotation.service';
import { AnnotationStats, Bucket } from '../models/annotation';

@Component({
  selector: 'pango-annotation-filters',
  templateUrl: './annotation-filters.component.html',
  styleUrls: ['./annotation-filters.component.scss']
})

export class AnnotationFiltersComponent implements OnInit, OnDestroy {
  filteredFields: Observable<any[]>;
  filteredFieldValues: Observable<any[]>;
  annotationPage: AnnotationPage
  columns: any[] = []
  annotations: []

  weeks = [];
  connectedTo = [];

  fieldsFilterForm: UntypedFormGroup;
  annotationStats: AnnotationStats;
  fieldValues: any[] = [];

  private _unsubscribeAll: Subject<any>;

  indata = {
    fieldsFormArray: [
      {
        fieldFiltersArray: [
          {
            fieldName: "WB:145787",
          }
        ]
      }
    ]
  }


  filteredAnnotations: Observable<string[]>;

  constructor(
    private fb: UntypedFormBuilder,
    public pangoMenuService: PangoMenuService,
    public annotationService: AnnotationService
  ) {
    this._unsubscribeAll = new Subject();
  }


  ngOnInit(): void {

    this.fieldsFilterForm = this.fb.group({
      fieldsFormArray: this.fb.array([])
    });

    this.annotationService.onAnnotationsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationPage: AnnotationPage) => {
        if (annotationPage) {
          this.setAnnotationPage(annotationPage);

        } else {
          this.annotationPage = null
        }
      });

    this.annotationService.onDistinctAggsChanged
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((annotationStats: AnnotationStats) => {
        if (annotationStats && annotationStats.termFrequency) {
          this.annotationStats = annotationStats;
          const agg = annotationStats.termFrequency;

          if (agg) {
            this.fieldValues = agg.buckets.map((bucket) => {
              return <Bucket>{
                key: bucket.key,
                docCount: bucket.docCount
              }
            });
          }
        } else {
          this.annotationStats = null
          this.fieldValues = []
        }
      });

    this.fieldsFilterForm.valueChanges.subscribe(value => {
      if (this.fieldsFilterForm.valid) {
        this.addFieldValuesCriteria(value)
      }
    });
  }

  setAnnotationPage(annotationPage: AnnotationPage) {
    this.annotationPage = annotationPage;
    //this.annotations = this.columns;
  }

  addFieldValuesCriteria(value) {
    if (value.fieldsFormArray.length > 0 && value.fieldsFormArray[0].fieldFiltersArray.length > 0) {
      let isReady = true;
      const query = value.fieldsFormArray.map((fieldFilters) => {
        return fieldFilters.fieldFiltersArray.map((fieldValues) => {
          return {
            name: fieldValues.fieldName.name,
            value: fieldValues.fieldValue.key
          };
        });
      });

      this.annotationService.searchCriteria.fieldValues = query;

      this.annotationService.updateSearch();
    }
  }

  clearValues() {

  }

  fieldDisplayFn(field: any): string | undefined {
    return field ? field.name : undefined;
  }

  fieldValueDisplayFn(field: any): string | undefined {
    return field ? field.key : undefined;
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    //this.annotationService.getDistinctValues(event.option.value.name);
    //  this.searchInput.forEach((item) => {
    //    item.nativeElement.value = null;
    //  });

    //  this.filterForm.controls[filterType].setValue('');
  }

  selectedValue(event: MatAutocompleteSelectedEvent): void {

    //this.annotationService.getDistinctValues(event.option.value.name);
    //  this.searchInput.forEach((item) => {
    //    item.nativeElement.value = null;
    //  });

    //  this.filterForm.controls[filterType].setValue('');
  }

  addNewFieldFilterGroup() {
    let control = <UntypedFormArray>this.fieldsFilterForm.controls.fieldsFormArray;
    control.push(
      this.fb.group({
        fieldFilterGroup: [''],
        fieldFiltersArray: this.fb.array([])
      })
    )
  }

  deleteFieldFilterGroup(index) {
    let control = <UntypedFormArray>this.fieldsFilterForm.controls.fieldsFormArray;
    control.removeAt(index)
  }

  addField(control, value?) {
    const fieldName = new UntypedFormControl(null, [
      Validators.required,
      Validators.minLength(1)
    ],
    );
    const fieldValue = new UntypedFormControl(null, [
      Validators.required,
      Validators.minLength(1)
    ]);
    control.push(this.fb.group({
      fieldName: fieldName,
      fieldValue: fieldValue
    }));

    this._onValueChanges(fieldName, fieldValue);
  }

  deleteProject(control, index) {
    control.removeAt(index)
  }

  setfieldsFormArray() {
    let control = <UntypedFormArray>this.fieldsFilterForm.controls.fieldsFormArray;
    this.indata.fieldsFormArray.forEach(x => {
      control.push(this.fb.group({
        fieldFiltersArray: this.setFieldFiltersArray(x)
      }));
    })
  }

  setFieldFiltersArray(x) {
    let arr = new UntypedFormArray([]);
    x.fieldFiltersArray.forEach(y => {
      this.addField(arr, y.fieldName);
    });
    return arr;
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }

  save() {
    const self = this;
    const errors = [];
    let canSave = true;

    const withs = this.fieldsFilterForm.value.fieldsFormArray.map((project) => {
      return project.fieldFiltersArray.map((item) => {
        if (!item.fieldName.includes(':')) {
        }
        return item.fieldName;
      }).join('|');
    }).join(',');

    if (canSave) {
    } else {
      // self.pangoFormDialogService.openActivityErrorsDialog(errors);
    }
  }

  filterFieldValues(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.fieldValues.filter((field: Bucket) => field.key.toLowerCase().includes(filterValue)).slice(0, 50);
  }


  filterFields(value: string): any[] {
    const filterValue = value.toLowerCase();

    return this.annotations.filter((field: any) => field.name.toLowerCase().includes(filterValue)).slice(0, 20);;
  }

  private _onValueChanges(fieldNameControl: UntypedFormControl, fieldValueControl: UntypedFormControl) {
    const self = this;

    this.filteredFields = fieldNameControl.valueChanges
      .pipe(
        startWith(''),
        map(
          value => typeof value === 'string' ? value : value['name']),
        map(field => field ? this.filterFields(field) : this.annotations.slice(0, 25))
      );

    this.filteredFieldValues = fieldValueControl.valueChanges
      .pipe(
        startWith(''),
        map(
          value => typeof value === 'string' ? value : value['key']),
        map(field => field ? this.filterFieldValues(field) : this.fieldValues.slice(0, 25))
      );

  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
