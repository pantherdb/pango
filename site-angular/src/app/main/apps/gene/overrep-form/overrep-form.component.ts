import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import ontologyOptions from '@pango.common/data/ontology-options.json';
import { environment } from 'environments/environment';

@Component({
  selector: 'pango-overrep-form',
  templateUrl: './overrep-form.component.html',
  styleUrls: ['./overrep-form.component.scss'],
  //encapsulation: ViewEncapsulation.None
})
export class OverrepFormComponent implements OnInit {
  ontologyOptions = ontologyOptions; // Loaded from a JSON file or directly imported
  overrepForm: FormGroup;

  constructor() {
  }

  ngOnInit(): void {
  }

  createForm() {
    this.overrepForm = new FormGroup({
      inputData: new FormControl(''),
      selectedOntology: new FormControl('')
    });
  }

  save(): void {
    const formData = this.overrepForm.value;
    const queryParams = new URLSearchParams({
      input: formData.inputData,
      ontology: formData.selectedOntology,
      species: 'HUMAN',
      test_type: 'FISHER'
    }).toString();
    const submitUrl = `${environment.overrepApiUrl}?${queryParams}`;
    console.log(submitUrl);
  }
}
