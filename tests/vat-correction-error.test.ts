/**
 * VatCorrectionRequiredError parsing (v2.33.0)
 *
 * The backend returns `409` with the code in the `error` field (not `code`):
 *   { error: 'VAT_CORRECTION_REQUIRED', message, corrections[], hint }
 * parseApiError must map it to VatCorrectionRequiredError and expose the
 * structured corrections + hint.
 */

import { describe, it, expect } from 'vitest';
import { parseApiError, VatCorrectionRequiredError } from '../src/errors.js';

describe('VatCorrectionRequiredError (409)', () => {
  const body = {
    error: 'VAT_CORRECTION_REQUIRED',
    message: 'Taux de TVA incohérent.',
    corrections: [
      {
        line_index: 0,
        description: 'Logiciel SaaS',
        provided_rate: 20,
        suggested_rate: 0,
        suggested_category: 'REVERSE_CHARGE',
        en16931_code: 'AE',
        mention: 'Autoliquidation - Article 283-2 du CGI',
        rule: 'R2_eu_b2b_vat_valid',
        warning: null,
      },
    ],
    hint: 'Acceptez les taux suggérés ou renseignez vat_override_reason.',
  };

  it('maps a 409 with `error` field to VatCorrectionRequiredError', () => {
    try {
      parseApiError(409, body);
      throw new Error('parseApiError should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(VatCorrectionRequiredError);
      const err = e as VatCorrectionRequiredError;
      expect(err.status).toBe(409);
      expect(err.code).toBe('VAT_CORRECTION_REQUIRED');
      expect(err.corrections).toHaveLength(1);
      expect(err.corrections[0]?.suggested_category).toBe('REVERSE_CHARGE');
      expect(err.corrections[0]?.en16931_code).toBe('AE');
      expect(err.hint).toContain('vat_override_reason');
    }
  });

  it('still maps QUOTE_NOT_EDITABLE on 409 (regression)', () => {
    try {
      parseApiError(409, { code: 'QUOTE_NOT_EDITABLE', message: 'locked' });
      throw new Error('parseApiError should have thrown');
    } catch (e) {
      expect((e as Error).name).toBe('QuoteNotEditableError');
    }
  });
});
