/**
 * Verifies that `parseSireneLookup` correctly normalizes the REAL JSON shape
 * returned by `POST /widget/onboarding/sirene/lookup` (regression 2026-05-10).
 *
 * Pre-v2.3.0 the SDK assumed `data.address.line1` (nested) and a top-level
 * `sirene_lookup_succeeded` flag — neither matched the API, so all address
 * fields arrived empty and the success/failure discriminant was always
 * `false`.
 */
import { describe, expect, it } from 'vitest';
import {
  parseSireneLookup,
  type CompanyData,
} from '../src/resources/onboarding.js';
import type {
  SireneLookupRawResponse,
} from '../src/types/onboarding.js';

describe('parseSireneLookup', () => {
  it('parses a full Etalab response (RL CONSEIL prod capture)', () => {
    const raw: SireneLookupRawResponse = {
      data: {
        name: 'RL CONSEIL',
        legal_name: 'RL CONSEIL',
        siret: '10178342100015',
        siren: '101783421',
        vat_number: 'FR95101783421',
        legal_form: '5710',
        naf_code: '62.02A',
        address_line1: '200 RUE DE LA CROIX NIVERT',
        address_line2: null,
        postal_code: '75015',
        city: 'PARIS',
        country: 'FR',
        is_active: true,
        creation_date: '2026-01-19',
        employee_range: 'NN',
      } as CompanyData,
    };

    const result = parseSireneLookup(raw);

    expect(result.sirene_lookup_succeeded).toBe(true);
    expect(result.manual_entry_required).toBe(false);
    expect(result.code).toBeNull();
    expect(result.data).not.toBeNull();
    // PIEGE HISTORIQUE : ces champs etaient vides avant le fix v2.3.0
    expect(result.data!.address_line1).toBe('200 RUE DE LA CROIX NIVERT');
    expect(result.data!.postal_code).toBe('75015');
    expect(result.data!.city).toBe('PARIS');
    expect(result.data!.country).toBe('FR');
    expect(result.data!.legal_name).toBe('RL CONSEIL');
    expect(result.data!.creation_date).toBe('2026-01-19');
    expect(result.data!.employee_range).toBe('NN');
  });

  it('parses the manual_entry fallback (Microsoft prod capture)', () => {
    const raw: SireneLookupRawResponse = {
      data: {
        sirene_lookup_failed: true,
        siret: '73282932000074',
        siren: '732829320',
        vat_number: 'FR44732829320',
        country: 'FR',
      },
      code: 'SIRENE_MANUAL_ENTRY_REQUIRED',
    };

    const result = parseSireneLookup(raw);

    expect(result.sirene_lookup_succeeded).toBe(false);
    expect(result.manual_entry_required).toBe(true);
    expect(result.code).toBe('SIRENE_MANUAL_ENTRY_REQUIRED');
    expect(result.data).toBeNull();
  });

  it('parses a SIRET_NOT_FOUND response (404)', () => {
    const raw: SireneLookupRawResponse = {
      data: null,
      code: 'SIRENE_NOT_FOUND',
      error: 'SIRET 99999999999999 introuvable dans la base Sirene.',
    };

    const result = parseSireneLookup(raw);

    expect(result.data).toBeNull();
    expect(result.code).toBe('SIRENE_NOT_FOUND');
    expect(result.manual_entry_required).toBe(false);
    expect(result.sirene_lookup_succeeded).toBe(false);
  });

  it('handles an empty response defensively', () => {
    const result = parseSireneLookup({ data: null });

    expect(result.data).toBeNull();
    expect(result.manual_entry_required).toBe(false);
    expect(result.code).toBeNull();
  });
});
