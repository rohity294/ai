import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleDataService {

  private googleApiUrl = 'http://localhost:8080/api/v1/google-data'; // Replace with your API endpoint

  // Define your request headers
  private requestHeaders = new HttpHeaders({
    //'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) { }

  async getData() {
    return await this.http.get<any>(this.googleApiUrl, {
      headers: this.requestHeaders
    }).toPromise();
  }

  postData(prompt: String) {
    return this.http.post<any>(this.googleApiUrl, prompt).toPromise();
  }
}


