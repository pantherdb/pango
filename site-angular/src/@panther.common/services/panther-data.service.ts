import { Injectable } from '@angular/core';
import { pangoData } from '@panther.common/data/config';

@Injectable({
  providedIn: 'root'
})
export class PantherDataService {
  aspectMap = pangoData.aspectMap;
  evidenceTypeMap = pangoData.evidenceTypeMap

  constructor() {

  }

  get aspectOption() {
    const options = [
      {
        id: 'all',
        label: 'All',
      },
      this.aspectMap['molecular function'],
      this.aspectMap['biological process'],
      this.aspectMap['cellular component']
    ];

    return {
      options: options,
      selected: options[0]
    };
  }

  get evidenceTypeOption() {
    const options = [
      this.evidenceTypeMap.direct,
      this.evidenceTypeMap.homology
    ];

    return {
      options: options,
      selected: options[0]
    };
  }


}
