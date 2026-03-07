import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Proforma } from './proforma';

describe('Proforma', () => {
    let component: Proforma;
    let fixture: ComponentFixture<Proforma>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Proforma]
        }).compileComponents();

        fixture = TestBed.createComponent(Proforma);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
