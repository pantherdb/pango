import { AfterViewInit, Directive, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Platform } from '@angular/cdk/platform';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import PerfectScrollbar from 'perfect-scrollbar';
import * as _ from 'lodash';

import { PangoConfigService } from '@pango/services/config.service';

@Directive({
    selector: '[pangoPerfectScrollbar]'
})
export class PangoPerfectScrollbarDirective implements AfterViewInit, OnDestroy {
    isInitialized: boolean;
    isMobile: boolean;
    ps: PerfectScrollbar;

    private _enabled: boolean | '';
    private _debouncedUpdate: any;
    private _options: any;
    private _unsubscribeAll: Subject<any>;

    constructor(
        public elementRef: ElementRef,
        private _pangoConfigService: PangoConfigService,
        private _platform: Platform,
        private _router: Router
    ) {
        this.isInitialized = false;
        this.isMobile = false;

        this._enabled = false;
        this._debouncedUpdate = _.debounce(this.update, 150);
        this._options = {
            updateOnRouteChange: false
        };
        this._unsubscribeAll = new Subject();
    }

    @Input()
    set pangoPerfectScrollbarOptions(value) {
        this._options = _.merge({}, this._options, value);
    }

    get pangoPerfectScrollbarOptions(): any {
        return this._options;
    }

    @Input('pangoPerfectScrollbar')
    set enabled(value: boolean | '') {
        if (value === '') {
            value = true;
        }

        if (this.enabled === value) {
            return;
        }

        this._enabled = value;

        if (this.enabled) {
            this._init();
        } else {
            this._destroy();
        }
    }

    get enabled(): boolean | '' {
        return this._enabled;
    }

    ngAfterViewInit(): void {
        this._pangoConfigService.config
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(
                (settings) => {
                    this.enabled = settings.customScrollbars;
                }
            );

        if (this.pangoPerfectScrollbarOptions.updateOnRouteChange) {
            this._router.events
                .pipe(
                    takeUntil(this._unsubscribeAll),
                    filter(event => event instanceof NavigationEnd)
                )
                .subscribe(() => {
                    setTimeout(() => {
                        this.scrollToTop();
                        this.update();
                    }, 0);
                });
        }
    }

    ngOnDestroy(): void {
        this._destroy();
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    _init(): void {
        if (this.isInitialized) {
            return;
        }

        if (this._platform.ANDROID || this._platform.IOS) {
            this.isMobile = true;
        }

        if (this.isMobile) {
            return;
        }

        this.isInitialized = true;

        this.ps = new PerfectScrollbar(this.elementRef.nativeElement, {
            ...this.pangoPerfectScrollbarOptions
        });
    }

    _destroy(): void {
        if (!this.isInitialized || !this.ps) {
            return;
        }

        this.ps.destroy();

        this.ps = null;
        this.isInitialized = false;
    }

    /**
     * Update scrollbars on window resize
     *
     * @private
     */
    @HostListener('window:resize')
    _updateOnResize(): void {
        this._debouncedUpdate();
    }

    @HostListener('document:click', ['$event'])
    documentClick(event: Event): void {
        if (!this.isInitialized || !this.ps) {
            return;
        }

        this.ps.update();
    }

    update(): void {
        if (!this.isInitialized) {
            return;
        }

        this.ps.update();
    }

    destroy(): void {
        this.ngOnDestroy();
    }

    scrollToX(x: number, speed?: number): void {
        this.animateScrolling('scrollLeft', x, speed);
    }

    scrollToY(y: number, speed?: number): void {
        this.animateScrolling('scrollTop', y, speed);
    }

    scrollToTop(offset?: number, speed?: number): void {
        this.animateScrolling('scrollTop', (offset || 0), speed);
    }

    scrollToLeft(offset?: number, speed?: number): void {
        this.animateScrolling('scrollLeft', (offset || 0), speed);
    }

    scrollToRight(offset?: number, speed?: number): void {
        const width = this.elementRef.nativeElement.scrollWidth;

        this.animateScrolling('scrollLeft', width - (offset || 0), speed);
    }

    scrollToBottom(offset?: number, speed?: number): void {
        const height = this.elementRef.nativeElement.scrollHeight;

        this.animateScrolling('scrollTop', height - (offset || 0), speed);
    }

    animateScrolling(target: string, value: number, speed?: number): void {
        if (!speed) {
            this.elementRef.nativeElement[target] = value;

            // PS has weird event sending order, this is a workaround for that
            this.update();
            this.update();
        } else if (value !== this.elementRef.nativeElement[target]) {
            let newValue = 0;
            let scrollCount = 0;

            let oldTimestamp = performance.now();
            let oldValue = this.elementRef.nativeElement[target];

            const cosParameter = (oldValue - value) / 2;

            const step = (newTimestamp) => {
                scrollCount += Math.PI / (speed / (newTimestamp - oldTimestamp));

                newValue = Math.round(value + cosParameter + cosParameter * Math.cos(scrollCount));

                if (this.elementRef.nativeElement[target] === oldValue) {
                    if (scrollCount >= Math.PI) {
                        this.elementRef.nativeElement[target] = value;

                        this.update();
                        this.update();
                    } else {
                        this.elementRef.nativeElement[target] = oldValue = newValue;
                        oldTimestamp = newTimestamp;
                        window.requestAnimationFrame(step);
                    }
                }
            };

            window.requestAnimationFrame(step);
        }
    }
}
