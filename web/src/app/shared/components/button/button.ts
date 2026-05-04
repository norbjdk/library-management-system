import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ButtonTone = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonType = 'button' | 'submit' | 'reset';

@Component({
  selector: 'app-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  label = input('Akcja');
  type = input<ButtonType>('button');
  tone = input<ButtonTone>('primary');
  icon = input<string | null>(null);
  disabled = input(false);
  busy = input(false);
  fullWidth = input(false);
  pressed = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (this.disabled() || this.busy()) {
      event.preventDefault();
      return;
    }

    this.pressed.emit(event);
  }
}
