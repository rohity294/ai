import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Card } from 'src/app/models/Card';
import { SplitFirstPartPipe } from '../../utilities/split-first-part.pipe';


@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.css']
})



// sendDataToParent(): void {
//   const data: string = 'Data from Child';
//   this.dataToParent.emit(data);
// }


export class CardComponent {
  constructor(private splitFirstPipe: SplitFirstPartPipe) {
  }

  selectedAIApplication: string = 'none';
  @Output() dataToParent: EventEmitter<string> = new EventEmitter<string>();

  @Input() title = '';
  @Input() brief = '';
  @Input() myImagePath = '';

  onCardChosenButton(title: string): void {
    let selectedChoice = this.splitFirstPipe.transform(title, '|');
    if (selectedChoice) {
      this.selectedAIApplication = selectedChoice;
      this.dataToParent.emit(this.selectedAIApplication);
    }

    /*if (selectedOption) {
      switch (selectedOption) {
        case 'Finwise':
          //console.log('Finwise is selected.');
          break;

        case 'IntelliSense':
          //console.log('Intellisense is selected.');
          break;

        case 'IPrep':
          //console.log('IPrep is selected.');
          break;

        default:
          //console.log('Default case when none of the options is selected.');
          console.log(selectedOption);
          break;
      }*/
  }
}



