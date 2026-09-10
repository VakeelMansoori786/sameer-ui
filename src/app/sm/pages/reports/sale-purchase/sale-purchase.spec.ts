import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalePurchase } from './sale-purchase';

describe('SalePurchase', () => {
    let component: SalePurchase;
    let fixture: ComponentFixture<SalePurchase>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SalePurchase]
        }).compileComponents();

        fixture = TestBed.createComponent(SalePurchase);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
