import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';
import { PangoUtilService } from '@pango.common/services/pango-util.service';
import { ApiVersion, PangoGraphQLService } from '@pango.search/services/graphql.service';

@Component({
    selector: 'pango-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class PangoToolbarComponent {
    showLoadingBar: boolean;
    ApiVersion = ApiVersion;
    currentVersion: ApiVersion = ApiVersion.V2024;

    protected readonly version2024Link = window.location.pathname;
    protected readonly version2023Link = window.location.pathname + '?apiVersion=pango-2023';

    constructor(
        public pangoUtilService: PangoUtilService,
        public pangoMenuService: PangoMenuService,
        private _pangoGraphQLService: PangoGraphQLService,
        private router: Router,
    ) {

        this.router.events.subscribe(
            (event) => {
                if (event instanceof NavigationStart) {
                    this.showLoadingBar = true;
                }
                if (event instanceof NavigationEnd) {
                    this.showLoadingBar = false;
                }
            });

    }

    ngOnInit() {
        this._pangoGraphQLService.route.queryParams.subscribe(() => {
            this.currentVersion = this._pangoGraphQLService.getCurrentVersion();
        });
    }

    onVersionChange(version: ApiVersion) {
        this._pangoGraphQLService.setVersion(version);
    }

    downloadCSVFile() {
        const userConsent = confirm('Confirm Download?');
        if (userConsent) {
            window.open('http://data.pantherdb.org/ftp/downloads/pango/export_annotations.zip', '_blank');
        }
    }

    downloadJSONFile() {
        const userConsent = confirm('Confirm Download?');
        if (userConsent) {
            window.open('http://data.pantherdb.org/ftp/downloads/pango/export_annotations.json.gz', '_blank');
        }
    }

    search(value): void {
        console.log(value);
    }

    openLeftDrawer() {
        this.pangoMenuService.openLeftDrawer();
    }

}
