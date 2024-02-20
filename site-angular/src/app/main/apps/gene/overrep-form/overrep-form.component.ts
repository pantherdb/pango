import { Component, OnInit } from '@angular/core';
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
  ontologyOptions = ontologyOptions.ontology;
  genes = ontologyOptions.genes;
  overrepForm: FormGroup;

  constructor() { }

  ngOnInit(): void {
    this.createForm();
  }

  createForm() {
    this.overrepForm = new FormGroup({
      geneIds: new FormControl(''),
      ontology: new FormControl('')
    });

    if (this.ontologyOptions.length > 0) {
      this.overrepForm.get('ontology').setValue(this.ontologyOptions[0].id);
    }
  }

  setExample() {
    this.overrepForm.patchValue({
      geneIds: this.genes.join('\n')
    });
  }

  save(): void {
    const formData = this.overrepForm.value;
    const overrepUrl = environment.overrepApiUrl;

    const payload = new URLSearchParams({
      input: formData.geneIds,
      ontology: formData.ontology,
      species: 'HUMAN',
      test_type: 'FISHER'
    }).toString();

    const fullUrl = `${overrepUrl}?${payload}`;
    window.open(fullUrl, '_blank');
  }
}
