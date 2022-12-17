import { Pipe, PipeTransform } from '@angular/core';
import { PangoUtils } from '../utils/pango-utils';

@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
    transform(mainArr: any[], searchText: string, property: string): any {
        return PangoUtils.filterArrayByString(mainArr, searchText);
    }
}
