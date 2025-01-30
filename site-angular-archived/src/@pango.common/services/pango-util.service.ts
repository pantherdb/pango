import { Injectable } from '@angular/core';

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
