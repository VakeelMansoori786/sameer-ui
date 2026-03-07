import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveryNote } from './delivery-note';

describe('DeliveryNote', () => {
    let component: DeliveryNote;
    let fixture: ComponentFixture<DeliveryNote>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeliveryNote]
        }).compileComponents();

        fixture = TestBed.createComponent(DeliveryNote);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
