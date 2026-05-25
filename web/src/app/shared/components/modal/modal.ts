import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal {
  open = input(false);
  title = input('');
  description = input('');
  dismissible = input(true);
  showCloseButton = input(false);
  closeLabel = input('Zamknij');
  closed = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (!this.dismissible()) {
      return;
    }

    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }

  close(): void {
    this.closed.emit();
  }
}
