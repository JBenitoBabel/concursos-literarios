import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoryClass',
  standalone: true,
  pure: true,
})
export class CategoryClassPipe implements PipeTransform {
  transform(category: string): string {
    const classes: Record<string, string> = {
      poesia: 'cat-poesia',
      novela: 'cat-novela',
      relato: 'cat-relato',
      ensayo: 'cat-ensayo',
      teatro: 'cat-teatro',
      infantil: 'cat-infantil',
      otro: 'cat-otro',
    };
    return classes[category] || 'cat-otro';
  }
}