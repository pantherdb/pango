import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PantherConfigService } from '@panther/services/config.service';

@Component({
    selector: 'layout-panther',
    templateUrl: './layout-panther.component.html',
    styleUrls: ['./layout-panther.component.scss'],
    encapsulation: ViewEncapsulation.None
}

) export class LayoutPantherComponent implements OnInit, OnDestroy {
    pantherConfig: any;
    navigation: any;
    private _unsubscribeAll: Subject<any>;

    constructor(private _pantherConfigService: PantherConfigService) {
        this._unsubscribeAll = new Subject();
    }

    ngOnInit(): void {
        this._pantherConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.pantherConfig = config;
            });
    }
    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}