import { Component, ElementRef, ViewChild } from '@angular/core';
import { SpeechService } from 'src/app/services/speech.service';

@Component({
  selector: 'app-speech-to-text-capturer',
  templateUrl: './speech-to-text-capturer.component.html',
  styleUrls: ['./speech-to-text-capturer.component.css']
})
export class SpeechToTextCapturerComponent {
  @ViewChild('audioPlayer') audioPlayerRef: ElementRef | undefined;
  listening: boolean = false;
  sentences: string[] = [];

  constructor(private speechService: SpeechService) { }

  startListening() {
    //console.log("mic clicked!!");
    if (this.audioPlayerRef) {
      const audioPlayer: HTMLAudioElement = this.audioPlayerRef.nativeElement;
      audioPlayer.play();
      this.listening = true;
      this.speechService.startRecognition();
    }
  }

  stopListening() {
    this.listening = false;
    let recognized = this.speechService.stopRecognition();
    //console.log(recognized);
    this.sentences = recognized.split(".");
  }
}
