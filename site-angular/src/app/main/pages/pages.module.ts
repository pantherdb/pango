import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PangoSharedModule } from '@pango/shared.module';
import { AppsModule } from './../apps/apps.module';
import { AboutComponent } from './about/about.component';
import { PangoFooterModule } from 'app/layout/components/footer/footer.module';
import { ContactComponent } from './contact/contact.component';
import { PangoConfirmDialogModule } from '@pango/components/confirm-dialog/confirm-dialog.module';
import { GeneComponent } from './gene/gene.component';
import { HomeComponent } from './home/home.component';
import { DownloadComponent } from './download/download.component';
import { HomeLabComponent } from './home-lab/home-lab.component';

const routes = [{
  path: '',
  title: 'Home: Annotations',
  component: HomeComponent
}, {
  path: 'lab',
  title: 'Lab: Layout',
  component: HomeLabComponent
}, {
  path: 'gene/:gene',
  title: 'Gene Page',
  component: GeneComponent
}, {
  path: 'contact', component: ContactComponent
}, {
  path: 'about', component: AboutComponent
}, {
  path: 'download', component: DownloadComponent
}];

@NgModule({
  declarations: [
    HomeComponent,
    HomeLabComponent,
    AboutComponent,
    DownloadComponent,
    ContactComponent,
    GeneComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    PangoSharedModule,
    PangoFooterModule,
    PangoConfirmDialogModule,
    AppsModule
  ],
  providers: [
  ]
})

export class PagesModule {
}
