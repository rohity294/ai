import { Injectable } from '@angular/core';
import { AiApp } from '../models/AiApp';

@Injectable({
  providedIn: 'root'
})
export class InitializeService {
  aiAppArray: AiApp[] = [];
  myImagePath: string = 'assets/images/';

  initialize() {
    this.aiAppArray = [
      { id: 1, name: 'Finwise', title: 'Finwise | Financial Bot', brief: 'Save on staffing costs', body: 'body for Finbot', myImagePath: `${this.myImagePath}Finwise.jpg` },
      { id: 2, name: 'IPrep', title: 'IPrep | Interview Guide', brief: 'Ace your next interview', body: 'body for IPrep', myImagePath: `${this.myImagePath}IPrep.jpg` },
      { id: 3, name: 'Intellisense', title: 'Intellisense | Code Assistant', brief: 'Write code better', body: 'body for Intellisense', myImagePath: `${this.myImagePath}Intellisense.jpg` },
      { id: 4, name: 'SpeechToText', title: 'SpeechToText', brief: 'Speak to do', body: 'body for SpeechToText', myImagePath: `${this.myImagePath}SpeechToText.jpg` },
    ];
  }

  constructor() { }


}
