import { Injectable } from '@angular/core';
import { MatDrawer, MatSidenav } from '@angular/material/sidenav';
import { LeftPanel, MiddlePanel, RightPanel } from '@pango.common/models/menu-panels';


@Injectable({
  providedIn: 'root'
})
export class PangoMenuService {

  selectedLeftPanel: LeftPanel = LeftPanel.annotationSearch;
  selectedMiddlePanel: MiddlePanel;
  selectedRightPanel: RightPanel

  private _leftDrawer: MatDrawer;
  private _rightDrawer: MatDrawer;

  constructor() {

  }


  selectLeftPanel(panel: LeftPanel) {
    this.selectedLeftPanel = panel;
  }

  selectMiddlePanel(panel: MiddlePanel) {
    this.selectedMiddlePanel = panel;
  }

  selectRightPanel(panel: RightPanel) {
    this.selectedRightPanel = panel;
  }

  public setLeftDrawer(leftDrawer: MatDrawer) {
    this._leftDrawer = leftDrawer;
  }

  public closeLeftDrawer() {
    return this._leftDrawer.close();
  }

  public setRightDrawer(rightDrawer: MatDrawer) {
    this._rightDrawer = rightDrawer;
  }

  public openLeftDrawer() {
    return this._leftDrawer.open();
  }

  public openRightDrawer() {
    return this._rightDrawer.open();
  }

  public closeRightDrawer() {
    return this._rightDrawer.close();
  }

  public toggleLeftDrawer(panel: LeftPanel) {
    if (this.selectedLeftPanel === panel) {
      this._leftDrawer.toggle();
    } else {
      this.selectLeftPanel(panel);
      return this.openLeftDrawer();
    }
  }

}
