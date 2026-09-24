import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryLabel',
  standalone: true,
  pure: true,
})
export class CategoryLabelPipe implements PipeTransform {
  transform(category: string): string {
    const labels: Record<string, string> = {
      poesia: 'Poesía',
      novela: 'Novela',
      relato: 'Relato',
      ensayo: 'Ensayo',
      teatro: 'Teatro',
      infantil: 'Infantil/Juvenil',
      otro: 'Otro',
    };
    return labels[category] || category;
  }
}