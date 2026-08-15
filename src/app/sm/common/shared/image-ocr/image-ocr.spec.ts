import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageOcr } from './image-ocr';

describe('ImageOcr', () => {
    let component: ImageOcr;
    let fixture: ComponentFixture<ImageOcr>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ImageOcr]
        }).compileComponents();

        fixture = TestBed.createComponent(ImageOcr);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
