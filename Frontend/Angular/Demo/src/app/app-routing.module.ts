import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { FinwiseComponent } from './components/ai-components/finwise/finwise.component';
import { IPrepComponent } from './components/ai-components/iprep/iprep.component';

const routes: Routes = [
  //{ path: '', component: AppComponent },
  { path: 'finwise', component: FinwiseComponent },
  { path: 'iprep', component: IPrepComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
