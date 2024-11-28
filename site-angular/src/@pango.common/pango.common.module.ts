import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Version0bannerComponent } from './version0banner/version0banner.component';
import { PangoVersionBannerComponent } from './pango-version-banner/pango-version-banner.component';

@NgModule({
  imports: [
    BrowserModule,
  ],
  declarations: [
    Version0bannerComponent,
    PangoVersionBannerComponent
  ],
})
export class PangoCommonModule { }
