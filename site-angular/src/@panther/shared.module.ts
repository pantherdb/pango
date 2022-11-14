import { NgModule } from '@angular/core';
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { FlexLayoutModule } from '@angular/flex-layout';

import { PantherDirectivesModule } from './directives/directives';
import { PantherPipesModule } from './pipes/pipes.module';
import { DragDropModule } from '@angular/cdk/drag-drop'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        MaterialModule,
        ReactiveFormsModule,
        FlexLayoutModule,
        PantherDirectivesModule,
        PantherPipesModule,
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
        PantherDirectivesModule,
        PantherPipesModule,
        DragDropModule,
        FontAwesomeModule,
        PerfectScrollbarModule,
    ]
})

export class PantherSharedModule { }
