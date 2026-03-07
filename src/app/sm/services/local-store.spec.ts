import { TestBed } from '@angular/core/testing';

import { LocalStore } from './local-store';

describe('LocalStore', () => {
    let service: LocalStore;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LocalStore);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
