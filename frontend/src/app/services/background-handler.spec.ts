import { TestBed } from '@angular/core/testing';

import { BackgroundHandler } from './background-handler';

describe('BackgroundHandler', () => {
  let service: BackgroundHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
