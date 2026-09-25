import { Contest } from '../../../models/contest.model';

export interface SourceParser {
  parse(content: string): Contest[];
}
