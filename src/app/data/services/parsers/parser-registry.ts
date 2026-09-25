import { ContestSource } from '../../../models/contest.model';
import { SourceParser } from './source-parser.interface';
import { EscritoresParser } from './escritores.parser';
import { LetraliaParser } from './letralia.parser';
import { GuiadeconcursosParser } from './guiadeconcursos.parser';
import { LetrasEspanolasParser } from './letrasespanolas.parser';

export const PARSERS: Record<ContestSource, SourceParser> = {
  escritores: new EscritoresParser(),
  letralia: new LetraliaParser(),
  guiadeconcursos: new GuiadeconcursosParser(),
  letrasespanolas: new LetrasEspanolasParser(),
};
