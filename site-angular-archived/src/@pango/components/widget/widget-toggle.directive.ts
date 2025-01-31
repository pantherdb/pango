import { Directive, ElementRef } from '@angular/core';

@Directive({
    selector: '[pangoWidgetToggle]'
})
export class PangoWidgetToggleDirective {
    constructor(public el: ElementRef) {
    }
}
