
import { MaterialModule } from './material.module';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PangoDirectivesModule } from './directives/directives';
import { PangoPipesModule } from './pipes/pipes.module';
import { DragDropModule } from '@angular/cdk/drag-drop'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        MaterialModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        PangoDirectivesModule,
        PangoPipesModule,
        DragDropModule,
        FontAwesomeModule,
        PerfectScrollbarModule,
    ],
    exports: [
        CommonModule,
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        PangoDirectivesModule,
        PangoPipesModule,
        DragDropModule,
        FontAwesomeModule,
        PerfectScrollbarModule,
    ]
})

export class PangoSharedModule { }
