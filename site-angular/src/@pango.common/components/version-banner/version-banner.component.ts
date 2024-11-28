import { Component, ViewEncapsulation } from '@angular/core';
import { ApiVersion, PangoGraphQLService } from '@pango.search/services/graphql.service';

@Component({
  selector: 'pango-version-banner',
  templateUrl: './version-banner.component.html',
  styleUrls: ['./version-banner.component.scss'],
  //encapsulation: ViewEncapsulation.None
})
export class PangoVersionBannerComponent {

  ApiVersion = ApiVersion;
  currentVersion: ApiVersion = ApiVersion.V2024;

  protected readonly version2024Link = window.location.origin;
  protected readonly version2023Link = window.location.origin + '?apiVersion=pango-2023';

  constructor(private _pangoGraphQLService: PangoGraphQLService) {

  }

  ngOnInit() {
    this._pangoGraphQLService.route.queryParams.subscribe(() => {
      this.currentVersion = this._pangoGraphQLService.getCurrentVersion();
    });

  }

  onVersionChange(version: ApiVersion) {
    this._pangoGraphQLService.setVersion(version);
  }

}
