import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FinwiseComponent } from './components/ai-components/finwise/finwise.component';
import { AppComponent } from './app.component';

const routes: Routes = [
  //{ path: '', component: AppComponent },
  { path: 'finwise', component: FinwiseComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
