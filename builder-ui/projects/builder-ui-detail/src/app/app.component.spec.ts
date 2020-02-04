import { TestBed, async } from '@angular/core/testing';
import { DetailComponent } from './app.component';

describe('DetailComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        DetailComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(DetailComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'builder-ui-detail'`, () => {
    const fixture = TestBed.createComponent(DetailComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('builder-ui-detail');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(DetailComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('.content span').textContent).toContain('builder-ui-detail app is running!');
  });
});
