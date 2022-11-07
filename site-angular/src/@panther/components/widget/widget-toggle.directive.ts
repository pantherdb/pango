import { Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[pantherWidgetToggle]'
})
export class PantherWidgetToggleDirective {
    constructor(public el: ElementRef) {
    }
}
