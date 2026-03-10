import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentReceived } from './payment-received';

describe('PaymentReceived', () => {
    let component: PaymentReceived;
    let fixture: ComponentFixture<PaymentReceived>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PaymentReceived]
        }).compileComponents();

        fixture = TestBed.createComponent(PaymentReceived);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
