import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthResponse } from '../../../../core/models/user';
import { AuthService } from '../../../../core/services/auth.service';
import { Login } from './login';
import { commonTestProviders } from '../../../../testing/test-providers';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const authResponse: AuthResponse = {
    user: {
      id: 2,
      email: 'anna@example.com',
      first_name: 'Anna',
      last_name: 'Czytelnik',
      role: 'reader',
      is_staff: false,
    },
    access_token: 'access-token',
    refresh_token: 'refresh-token',
  };

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register']);
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        ...commonTestProviders,
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ redirectTo: '/catalog' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates required login fields', () => {
    component.email = '   ';
    component.password = '   ';

    component.onSubmit();
    fixture.detectChanges();

    expect(auth.login).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Podaj email i hasło.');
  });

  it('sanitizes login email before sending credentials', () => {
    auth.login.and.returnValue(of(authResponse));
    component.email = '  Anna@Example.COM ';
    component.password = 'secret123';

    component.onSubmit();

    expect(auth.login).toHaveBeenCalledWith('anna@example.com', 'secret123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/catalog', { replaceUrl: true });
  });

  it('validates registration password confirmation before sending', () => {
    component.setMode('register');
    component.registration = {
      first_name: 'Anna',
      last_name: 'Czytelnik',
      email: 'anna@example.com',
      birthdate: '1998-03-12',
      password: 'secret123',
      confirmPassword: 'different',
    };

    component.onRegister();
    fixture.detectChanges();

    expect(auth.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Hasła muszą być identyczne.');
  });

  it('sanitizes registration payload and displays backend validation errors', () => {
    auth.register.and.returnValue(
      throwError(() => ({ error: { email: ['Adres email jest już zajęty.'] } })),
    );
    component.setMode('register');
    component.registration = {
      first_name: '  Anna   Maria ',
      last_name: '  Czytelnik ',
      email: '  ANNA@EXAMPLE.COM ',
      birthdate: ' 1998-03-12 ',
      password: 'secret123',
      confirmPassword: 'secret123',
    };

    component.onRegister();
    fixture.detectChanges();

    expect(auth.register).toHaveBeenCalledWith({
      first_name: 'Anna Maria',
      last_name: 'Czytelnik',
      email: 'anna@example.com',
      birthdate: '1998-03-12',
      password: 'secret123',
    });
    expect(fixture.nativeElement.textContent).toContain('Adres email jest już zajęty.');
  });
});
