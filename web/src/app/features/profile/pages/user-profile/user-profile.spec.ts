import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserProfile } from '../../../../core/models/user';
import { ApiService } from '../../../../core/services/api.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserProfileComponent } from './user-profile';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let api: jasmine.SpyObj<ApiService>;
  let auth: jasmine.SpyObj<AuthService>;

  const profile: UserProfile = {
    id: 2,
    email: 'anna@example.com',
    first_name: 'Anna',
    last_name: 'Czytelnik',
    full_name: 'Anna Czytelnik',
    birthdate: '1998-03-12',
    role: 'reader',
    is_staff: false,
    created_at: '2026-05-04T10:15:00Z',
    loan_count: 1,
    reservation_count: 2,
    fine_total: '12.50',
    summary: {
      loan_count: 1,
      reservation_count: 2,
      notification_count: 3,
      fine_total: '12.50',
    },
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['getProfile', 'updateProfile']);
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['updateCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('loads profile data into the edit form', () => {
    api.getProfile.and.returnValue(of(profile));

    createComponent();

    expect(component.form).toEqual({
      first_name: 'Anna',
      last_name: 'Czytelnik',
      email: 'anna@example.com',
      birthdate: '1998-03-12',
    });
    expect(auth.updateCurrentUser).toHaveBeenCalledWith(profile);
  });

  it('validates required profile fields before saving', () => {
    api.getProfile.and.returnValue(of(profile));
    createComponent();
    component.form = {
      first_name: '   ',
      last_name: 'Czytelnik',
      email: 'anna@example.com',
      birthdate: '1998-03-12',
    };

    component.saveProfile();
    fixture.detectChanges();

    expect(api.updateProfile).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Wszystkie pola profilu są wymagane.');
  });

  it('sanitizes profile payload and displays success after saving', () => {
    api.getProfile.and.returnValue(of(profile));
    api.updateProfile.and.returnValue(of(profile));
    createComponent();
    component.form = {
      first_name: '  Anna   Maria ',
      last_name: '  Czytelnik ',
      email: '  ANNA@EXAMPLE.COM ',
      birthdate: ' 1998-03-12 ',
    };

    component.saveProfile();
    fixture.detectChanges();

    expect(api.updateProfile).toHaveBeenCalledWith({
      first_name: 'Anna Maria',
      last_name: 'Czytelnik',
      email: 'anna@example.com',
      birthdate: '1998-03-12',
    });
    expect(auth.updateCurrentUser).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Profil został zapisany.');
  });

  it('shows an error message when the profile cannot be loaded', () => {
    api.getProfile.and.returnValue(throwError(() => new Error('load failed')));

    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Nie udało się pobrać profilu użytkownika.',
    );
  });
});
