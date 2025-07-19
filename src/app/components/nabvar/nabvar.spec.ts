import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nabvar } from './nabvar';

describe('Nabvar', () => {
  let component: Nabvar;
  let fixture: ComponentFixture<Nabvar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nabvar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nabvar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
