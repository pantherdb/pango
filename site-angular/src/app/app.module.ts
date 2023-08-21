import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { PangoModule } from '@pango/pango.module';
import { PangoProgressBarModule } from '@pango/components';

import { PangoSharedModule } from '@pango/shared.module';
import { pangoConfig } from './pango-config';
import { AppComponent } from './app.component';
import { LayoutModule } from 'app/layout/layout.module';

import { PagesModule } from './main/pages/pages.module';
import { AppsModule } from './main/apps/apps.module';

import {
    faPaw,
    faPen,
    faSitemap,
    faUser,
    faUsers,
    faCalendarDay,
    faCalendarWeek,
    faSearch,
    faTasks,
    faListAlt,
    faChevronRight,
    faHistory,
    faShoppingBasket,
    faCopy,
    faPlus,
    faLink,
    faChevronDown,
    faLevelDownAlt,
    faLevelUpAlt,
    faArrowUp,
    faArrowDown,
    faCaretDown,
    faCaretRight,
    faAngleDoubleDown,
    faAngleDoubleUp, faUndo, faSave, faExclamationTriangle, faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight, faCode, faFileCode, faSearchPlus, faTable, faChartBar, faList, faBars, faFilter, faMicroscope, faFlask
} from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-regular-svg-icons';
import { faGithub, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { MatSidenavModule } from '@angular/material/sidenav';

const appRoutes: Routes = [
    {
        path: '**',
        redirectTo: ''
    }
];

@NgModule({
    declarations: [
        AppComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        HttpClientModule,
        HttpClientJsonpModule,
        RouterModule.forRoot(appRoutes),

        // Pango Main and Shared modules
        PangoModule.forRoot(pangoConfig),
        PangoSharedModule,
        LayoutModule,
        RouterModule,
        MatSidenavModule,
        PangoProgressBarModule,

        //Pango App
        PagesModule,
        AppsModule
    ],
    bootstrap: [
        AppComponent
    ]
})
export class AppModule {
    constructor(library: FaIconLibrary) {
        library.addIcons(
            faCode,
            faSearchPlus,
            faFileCode,
            faArrowUp,
            faArrowDown,
            faAngleDoubleLeft,
            faAngleDoubleRight,
            faAngleDoubleUp,
            faAngleDoubleDown,
            faAngleLeft,
            faAngleRight,
            faBars,
            faCalendarDay,
            faCalendarWeek,
            faCaretDown,
            faCaretRight,
            faChartBar,
            faChevronDown,
            faChevronRight,
            faCheckCircle,
            faCopy,
            faExclamationTriangle,
            faFilter,
            faFacebook,
            faFlask,
            faGithub,
            faHistory,
            faLevelDownAlt,
            faLevelUpAlt,
            faLink,
            faList,
            faListAlt,
            faPaw,
            faPen,
            faPlus,
            faSave,
            faSearch,
            faShoppingBasket,
            faSitemap,
            faTable,
            faTasks,
            faTimesCircle,
            faTwitter,
            faUndo,
            faUser,
            faUsers,
            faMicroscope
        );
    }
}
