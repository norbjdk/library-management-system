import { Component, input } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  emptyValue?: string;
}

export type TableRow = Record<string, string | number | boolean | null | undefined>;

@Component({
  selector: 'app-table',
  imports: [],
  templateUrl: './table.html',
  styleUrl: './table.css',
  })
export class Table {
  columns = input<TableColumn[]>([]);
  rows = input<TableRow[]>([]);
  caption = input('');
  emptyLabel = input('Brak danych do wyświetlenia.');
  rowIdKey = input('id');

  trackRow(index: number, row: TableRow): string | number {
    const value = row[this.rowIdKey()];
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return (value as string | number) ?? index;
  }

  formatValue(value: TableRow[string], emptyValue = '—'): string {
    if (value === null || value === undefined || value === '') {
      return emptyValue;
    }

    if (typeof value === 'boolean') {
      return value ? 'Tak' : 'Nie';
    }

    return String(value);
  }
}
