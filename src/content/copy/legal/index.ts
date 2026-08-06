import { privacyCopy } from './privacy';
import { termsOfUseCopy } from './termsOfUse';
import { termsOfSaleCopy } from './termsOfSale';
import { accessibilityCopy } from './accessibility';
import type { RouteKey } from '../routes';

export const legalPages: { route: RouteKey; copy: typeof privacyCopy }[] = [
  { route: 'privacy', copy: privacyCopy },
  { route: 'termsOfUse', copy: termsOfUseCopy },
  { route: 'termsOfSale', copy: termsOfSaleCopy },
  { route: 'accessibility', copy: accessibilityCopy },
];
