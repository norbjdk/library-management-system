import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { NotificationsList } from './notifications-list';

describe('NotificationsList', () => {
  let component: NotificationsList;
  let fixture: ComponentFixture<NotificationsList>;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<ApiService>('ApiService', [
      'getNotifications',
      'markNotificationRead',
      'markAllNotificationsRead',
      'deleteNotification',
    ]);
    api.getNotifications.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            user: 1,
            user_name: 'Anna Czytelnik',
            title: 'Termin zwrotu',
            message: 'Oddaj książkę jutro.',
            notification_type: 'loan_due',
            related_object_type: 'loan',
            related_object_id: 5,
            is_read: false,
            is_unread: true,
            created_at: '2026-05-25T12:44:53.904098+02:00',
            read_at: null,
          },
        ],
      }),
    );
    api.markNotificationRead.and.returnValue(
      of({
        id: 1,
        user: 1,
        user_name: 'Anna Czytelnik',
        title: 'Termin zwrotu',
        message: 'Oddaj książkę jutro.',
        notification_type: 'loan_due',
        related_object_type: 'loan',
        related_object_id: 5,
        is_read: true,
        is_unread: false,
        created_at: '2026-05-25T12:44:53.904098+02:00',
        read_at: '2026-05-25T12:45:00.000000+02:00',
      }),
    );
    api.markAllNotificationsRead.and.returnValue(of({ updated: 1 }));
    api.deleteNotification.and.returnValue(of(void 0));

    await TestBed.configureTestingModule({
      imports: [NotificationsList],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders notification timestamps as dates only', () => {
    expect(fixture.nativeElement.textContent).toContain('2026-05-25');
    expect(fixture.nativeElement.textContent).not.toContain('T12:44:53.904098+02:00');
  });

  it('deletes a notification after confirmation', () => {
    const notification = component.notifications()[0];

    component.requestDeleteNotification(notification);
    component.confirmDeleteNotification();

    expect(api.deleteNotification).toHaveBeenCalledWith(notification.id);
  });
});
