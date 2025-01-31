import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PangoConfigService } from '@pango/services/config.service';

@Component({
    selector: 'layout-pango',
    templateUrl: './layout-pango.component.html',
    styleUrls: ['./layout-pango.component.scss'],
    encapsulation: ViewEncapsulation.None
}

) export class LayoutPangoComponent implements OnInit, OnDestroy {
    pangoConfig: any;
    navigation: any;
    private _unsubscribeAll: Subject<any>;

    constructor(private _pangoConfigService: PangoConfigService) {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        this._pangoConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.pangoConfig = config;
            });
    }
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}