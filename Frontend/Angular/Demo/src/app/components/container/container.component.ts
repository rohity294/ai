import { InitializeService } from 'src/app/services/initialize.service';
import { Component, EventEmitter, Output } from '@angular/core';
import { Card } from "../../models/Card";

@Component({
  selector: 'app-container',
  templateUrl: './container.component.html',
  styleUrls: ['./container.component.css']
})

export class ContainerComponent {
  public cards: Card[] = [];
  selectedAIApplication: string = 'none';
  @Output() dataToParent: EventEmitter<string> = new EventEmitter<string>();

  constructor(private initializeService: InitializeService) {
    let aiApps = this.initializeService.aiAppArray;

    const cardArray: Card[] = [];
    aiApps.forEach(aiApp => {
      let card = {
        title: aiApp.title,
        brief: aiApp.brief,
        myImagePath: aiApp.myImagePath
      };
      cardArray.push(card);
    })

    this.cards = cardArray;
  }

  receiveDataFromChild(data: string): void {
    this.selectedAIApplication = data;
    //console.log(this.selectedAIApplication);
    this.dataToParent.emit(this.selectedAIApplication);
  }



}

