import { Injectable } from '@angular/core';
import { pangoData } from '@pango.common/data/config';

@Injectable({
  providedIn: 'root'
})
export class PangoDataService {
  aspectMap = pangoData.aspectMap;
  termTypeMap = pangoData.termTypeMap
  evidenceTypeMap = pangoData.evidenceTypeMap

  constructor() {

  }

  get aspectOption() {
    const options = [
      this.aspectMap['molecular function'],
      this.aspectMap['biological process'],
      this.aspectMap['cellular component']
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get termTypeOption() {
    const options = [
      this.termTypeMap['known'],
      this.termTypeMap['unknown'],
    ];

    return {
      options: options,
      selected: options[0]
    };
  }


  get evidenceTypeOption() {
    const options = [
      this.evidenceTypeMap.direct,
      this.evidenceTypeMap.homology,
    ];

    return {
      options: options,
      selected: options[0]
    };
  }


}
