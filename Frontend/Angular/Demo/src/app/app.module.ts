import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { CardComponent } from './components/card/card.component';
import { SplitFirstPartPipe } from './utilities/split-first-part.pipe';
import { FinwiseComponent } from './components/ai-components/finwise/finwise.component';
import { FormsModule } from '@angular/forms';
import { QuestionComponent } from './components/question/question.component';
import { AnswerComponent } from './components/answer/answer.component';
import { HttpClientModule } from '@angular/common/http';
import { IPrepComponent } from './components/ai-components/iprep/iprep.component';
import { SpeechToTextCapturerComponent } from './components/ai-components/speech-to-text-capturer/speech-to-text-capturer.component';

@NgModule({
  declarations: [
    AppComponent,
    ContainerComponent,
    CardComponent,
    SplitFirstPartPipe,
    FinwiseComponent,
    QuestionComponent,
    AnswerComponent,
    IPrepComponent,
    SpeechToTextCapturerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [SplitFirstPartPipe],
  bootstrap: [AppComponent]
})
export class AppModule { }
