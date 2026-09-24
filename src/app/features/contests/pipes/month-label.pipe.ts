import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'monthLabel',
  standalone: true,
  pure: true,
})
export class MonthLabelPipe implements PipeTransform {
  private readonly monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  transform(ym: string): string {
    const [year, month] = ym.split('-');
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${this.monthNames[monthIndex]} ${year}`;
    }
    return ym;
  }
}