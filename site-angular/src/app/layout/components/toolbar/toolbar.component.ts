import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';

import { PangoConfigService } from '@pango/services/config.service';

@Component({
    selector: 'pango-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class PangoToolbarComponent {
    userStatusOptions: any[];
    languages: any;
    selectedLanguage: any;
    showLoadingBar: boolean;
    horizontalNav: boolean;
    noNav: boolean;
    navigation: any;


    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private pangoConfig: PangoConfigService,
    ) {
        this.languages = [{
            'id': 'en',
            'title': 'English',
            'flag': 'us'
        }, {
            'id': 'tr',
            'title': 'Turkish',
            'flag': 'tr'
        }];

        this.selectedLanguage = this.languages[0];

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

    search(value): void {
        console.log(value);
    }

}
