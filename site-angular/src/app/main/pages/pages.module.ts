import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PantherSharedModule } from '@panther/shared.module';
import { AppsModule } from './../apps/apps.module';
import { AboutComponent } from './about/about.component';
import { SearchComponent } from './search/search.component';
import { PantherFooterModule } from 'app/layout/components/footer/footer.module';
import { ContactComponent } from './contact/contact.component';
import { PantherConfirmDialogModule } from '@panther/components/confirm-dialog/confirm-dialog.module';

const routes = [{
  path: '', component: SearchComponent
}, {
  path: 'contact', component: ContactComponent
}, {
  path: 'about', component: AboutComponent
}];

@NgModule({
  declarations: [
    SearchComponent,
    AboutComponent,
    ContactComponent,
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
