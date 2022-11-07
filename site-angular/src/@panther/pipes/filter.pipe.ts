import { Pipe, PipeTransform } from '@angular/core';
import { PantherUtils } from '../utils/panther-utils';

@Pipe({ name: 'filter' })
export class FilterPipe implements PipeTransform {
    transform(mainArr: any[], searchText: string, property: string): any {
        return PantherUtils.filterArrayByString(mainArr, searchText);
    }
}
