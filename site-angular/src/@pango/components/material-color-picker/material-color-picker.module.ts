import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PangoPipesModule } from '../../pipes/pipes.module';
import { PangoMaterialColorPickerComponent } from './material-color-picker.component';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
    declarations: [
        PangoMaterialColorPickerComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatRippleModule,
        PangoPipesModule
    ],
    exports: [
        PangoMaterialColorPickerComponent
    ],
})
export class PangoMaterialColorPickerModule {
}
