import { Component } from '@angular/core';
import { NavigationEnd, NavigationStart, Router, ActivatedRoute } from '@angular/router';
import { PangoMenuService } from '@pango.common/services/pango-menu.service';

@Component({
    selector: 'pango-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})

export class PangoToolbarComponent {
    showLoadingBar: boolean;

    constructor(
        public pangoMenuService: PangoMenuService,
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

    search(value): void {
        console.log(value);
    }

    openLeftDrawer() {
        this.pangoMenuService.openLeftDrawer();
    }

}
