import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-alert',
  imports: [],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Alert {
  title = input('');
  message = input('');
  tone = input<AlertTone>('info');
  dismissible = input(false);
  closed = output<void>();

  icon = computed(() => {
    const icons: Record<AlertTone, string> = {
      info: 'i',
      success: 'OK',
      warning: '!',
      danger: '!',
    };
    return icons[this.tone()];
  });

  dismiss(): void {
    this.closed.emit();
  }
}
