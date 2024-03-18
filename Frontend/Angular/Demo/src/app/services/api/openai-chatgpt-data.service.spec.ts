import { TestBed } from '@angular/core/testing';

import { OpenaiChatgptDataService } from './openai-chatgpt-data.service';

describe('OpenaiChatgptDataService', () => {
  let service: OpenaiChatgptDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenaiChatgptDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
