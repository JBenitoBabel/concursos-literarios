import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prizeLabel',
  standalone: true,
  pure: true,
})
export class PrizeLabelPipe implements PipeTransform {
  transform(type: string): string {
    const labels: Record<string, string> = {
      dinero: 'Dinero',
      publicacion: 'Publicación',
      becas: 'Becas',
      reconocimiento: 'Reconocimiento',
      otro: 'Otro',
    };
    return labels[type] || type;
  }
}