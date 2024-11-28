import { Injectable } from '@angular/core';
import { pangoData } from '@pango.common/data/config';

@Injectable({
  providedIn: 'root'
})
export class PangoUtilService {

  constructor() {

  }

  getVersionedLink(path: string) {
    const versionParam = new URLSearchParams(window.location.search).get('apiVersion');
    return path + (versionParam ? '?apiVersion=' + versionParam : '');
  }

}
