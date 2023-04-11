import { Injectable } from '@angular/core';
import { pangoData } from '@pango.common/data/config';

@Injectable({
  providedIn: 'root'
})
export class PangoDataService {
  aspectMap = pangoData.aspectMap;
  isUnknownTermMap = pangoData.isUnknownTermMap
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

  get isUnknownTermOption() {
    const options = [
      this.isUnknownTermMap['0'],
      this.isUnknownTermMap['1'],
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
      this.evidenceTypeMap.na
    ];

    return {
      options: options,
      selected: options[0]
    };
  }


}
