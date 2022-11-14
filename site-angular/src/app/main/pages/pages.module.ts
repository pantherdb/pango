import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PantherSharedModule } from '@panther/shared.module';
import { AppsModule } from './../apps/apps.module';
import { AboutComponent } from './about/about.component';
import { PantherFooterModule } from 'app/layout/components/footer/footer.module';
import { ContactComponent } from './contact/contact.component';
import { PantherConfirmDialogModule } from '@panther/components/confirm-dialog/confirm-dialog.module';
import { GeneComponent } from './gene/gene.component';
import { HomeComponent } from './home/home.component';

const routes = [{
  path: '',
  title: 'Home: Annotations',
  component: HomeComponent
}, {
  path: 'gene/:gene',
  title: 'Gene Page',
  component: GeneComponent
}, {
  path: 'contact', component: ContactComponent
}, {
  path: 'about', component: AboutComponent
}];

@NgModule({
  declarations: [
    HomeComponent,
    AboutComponent,
    ContactComponent,
    GeneComponent,
  ],
  imports: [
    RouterModule.forChild(routes),
    PantherSharedModule,
    PantherFooterModule,
    PantherConfirmDialogModule,
    AppsModule
  ],
  providers: [
  ]
})

export class PagesModule {
}
