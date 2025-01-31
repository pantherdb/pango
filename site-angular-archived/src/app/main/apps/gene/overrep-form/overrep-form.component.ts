import { Component, OnInit, AfterViewInit } from '@angular/core';
import ontologyOptions from '@pango.common/data/ontology-options.json';
import { environment } from 'environments/environment';

@Component({
  selector: 'pango-overrep-form',
  templateUrl: './overrep-form.component.html',
  styleUrls: ['./overrep-form.component.scss']
})
export class OverrepFormComponent implements OnInit, AfterViewInit {
  ontologyOptions = ontologyOptions.ontology;
  genes = ontologyOptions.genes;
  submitUrl = environment.overrepApiUrl;

  constructor() { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    // Set the properties after view initialization, similar to the HTML example
    const form = document.querySelector('overrep-form');
    if (form) {
      form['ontologyOptions'] = this.ontologyOptions;
      form['exampleGenes'] = this.genes;
    }
  }
}
