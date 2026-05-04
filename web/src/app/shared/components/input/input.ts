import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type InputType = 'text' | 'email' | 'password' | 'date' | 'search' | 'number' | 'textarea';

@Component({
  selector: 'app-input',
  imports: [],
  templateUrl: './input.html',
  styleUrl: './input.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {
  id = input('');
  label = input('');
  type = input<InputType>('text');
  placeholder = input('');
  value = input('');
  helpText = input('');
  error = input('');
  autocomplete = input('off');
  required = input(false);
  rows = input(4);
  valueChange = output<string>();
  blurred = output<FocusEvent>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }

  onBlur(event: FocusEvent): void {
    this.blurred.emit(event);
  }
}
