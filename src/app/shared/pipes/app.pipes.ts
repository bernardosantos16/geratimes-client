import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'matchDate', standalone: true })
export class MatchDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '—';

    const locale = 'pt-BR';

    switch (format) {
      case 'long':
        return date.toLocaleDateString(locale, {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      case 'time':
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
      default:
        return date.toLocaleDateString(locale, {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
    }
  }
}

@Pipe({ name: 'clubRole', standalone: true })
export class ClubRolePipe implements PipeTransform {
  transform(value: 'DIRECTOR' | 'MEMBER' | null | undefined): string {
    switch (value) {
      case 'DIRECTOR': return 'Diretor';
      case 'MEMBER':   return 'Membro';
      default:         return '—';
    }
  }
}

@Pipe({ name: 'matchPosition', standalone: true })
export class MatchPositionPipe implements PipeTransform {
  transform(value: 'LINE' | 'GOAL' | null | undefined): string {
    switch (value) {
      case 'LINE': return 'Linha';
      case 'GOAL': return 'Goleiro';
      default:     return '—';
    }
  }
}

@Pipe({
  name: 'contrast',
  pure: true // Pipe puro para melhor performance
})
export class ContrastPipe implements PipeTransform {
  private cache = new Map<string, string>();

  transform(hexColor?: string): string {
    if (!hexColor) {
      return '#000000';
    }

    // Cache hit - evita recálculo
    if (this.cache.has(hexColor)) {
      return this.cache.get(hexColor)!;
    }

    // Cálculo apenas uma vez por cor
    const result = this.calculateContrast(hexColor);
    this.cache.set(hexColor, result);
    return result;
  }

  private calculateContrast(hexColor: string): string {
    const normalizedHex = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;

    if (normalizedHex.length !== 6) {
      console.error('Invalid hex color format');
      return '#000000';
    }

    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);

    // Calcula a luminância percebida
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retorna branco para cores escuras e preto para cores claras
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}

