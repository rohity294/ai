import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { InitializeService } from './services/initialize.service';
import { AiApp } from './models/AiApp';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  @ViewChild('appBeginnerButton') appBeginnerButtonRef: ElementRef | undefined;
  aiAppArray: AiApp[] = [];

  constructor(private router: Router, private initializeService: InitializeService) {
    this.initializeService.initialize();
    this.aiAppArray = this.initializeService.aiAppArray;
  }

  title: string = 'AI POD Demo';
  logoPath: string = 'https://www.fdmgroup.com/wp-content/themes/fdm/images/fdm-logo-2018.png';
  selectedAIApplication: string = 'none';
  showAIApplicationsListing: boolean = true;


  receiveDataFromChild(data: string): void {
    this.selectedAIApplication = data;
    console.log(this.selectedAIApplication);
    this.showAIApplicationsListing = false;
  }

  reload() {
    this.selectedAIApplication = 'none';
    this.router.navigate([]);
    window.location.reload()
  }


}
