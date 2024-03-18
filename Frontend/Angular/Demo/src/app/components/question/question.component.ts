import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { GoogleDataService } from 'src/app/services/api/google-data.service';
import { QuestionHandlingService } from 'src/app/services/question-handling.service';

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.css']
})

export class QuestionComponent {
  
  constructor(
    private questionHandlingService: QuestionHandlingService,
    private googleDataService: GoogleDataService
  ) {
  }

  inputQuestion: string = '';
  isQuestionSubmitted: boolean = false;
  isQuestionScreeningPassed: boolean = false;
  googleDataResponse: any;
  parsedGoogleDataResponse: any;

  async submitForm() {
    this.isQuestionSubmitted = true;
    if (this.questionHandlingService.screenQuestion(this.inputQuestion)) {
      this.isQuestionScreeningPassed = true;
      //invoke api
      await this.googleDataService.postData(this.inputQuestion).then(response => {
        //console.log(response);//gives value
        this.googleDataResponse = response;
      });
      //console.log(this.googleDataResponse);//gives value due to await on line above
    }
    //console.log(this.googleDataResponse);
    //console.log("*****");
    //console.log(this.googleDataResponse.predictions[0].content);
    this.parsedGoogleDataResponse = this.googleDataResponse.predictions[0].content;
  }




}
