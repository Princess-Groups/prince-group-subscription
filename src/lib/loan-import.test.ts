import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { utils } from 'xlsx';
import { phoneKey, reviewLeads, sheetGrid } from './loan-import';

describe('Loan import validation', () => {
  it('deduplicates formatted and country-prefixed phone identities', () => {
    const r = reviewLeads([['+91 98765 43210'], ['09876543210'], ['9876543210']], { phone: 0 }, 1, false);
    assert.equal(r.valid.length, 1); assert.equal(r.duplicates, 2);
    assert.equal(phoneKey('+91 98765 43210'), '9876543210');
  });
  it('imports phone-only sheets without discarding the first record', () => {
    const r = reviewLeads([[9876543210], [9876543211]], { phone: 0 }, 1, false);
    assert.equal(r.valid.length, 2); assert.equal(r.valid[0]?.record, 1);
  });
  it('keeps additional details and amounts by mapped position', () => {
    const r = reviewLeads([['Phone', 'Name', 'Amount', 'Name'], [{ v: 9876543210, w: '9876543210' }, { v: 'Test executive' }, { v: 300000, w: '₹3,00,000' }, { v: 'Extra detail' }]], { phone: 0, name: 1, estimated_amount: 2 }, 1, true);
    assert.equal(r.valid[0]?.lead.estimated_amount, 300000);
    assert.equal(r.valid[0]?.lead.extra_details['4: Name'], 'Extra detail');
  });
  it('rejects invalid records while counting the entire input', () => {
    const r = reviewLeads([['bad', 10], ['9876543210', -1], ['9876543211', 10]], { phone: 0, estimated_amount: 1 }, 1, false);
    assert.equal(r.total, 3); assert.equal(r.errors.length, 2); assert.equal(r.valid.length, 1);
  });
  it('ignores empty formatted rows and supports large sparse sheets', () => {
    const r = sheetGrid({ A1: { t: 'n', v: 9876543210 }, A300001: { t: 'n', v: 9876543211 }, '!ref': 'A1:A1048576' }, utils.decode_range);
    assert.equal(r.length, 300001); assert.equal(reviewLeads(r, { phone: 0 }, 1, false).total, 2);
  });
});