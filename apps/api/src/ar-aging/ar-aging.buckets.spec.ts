import { bucketForDays } from './ar-aging.service';

describe('bucketForDays (AR aging bucket assignment)', () => {
  it('returns Current for non-positive days', () => {
    expect(bucketForDays(0)).toBe('Current');
    expect(bucketForDays(-5)).toBe('Current');
  });

  it('returns Bucket31_60 for 1..30 days overdue', () => {
    expect(bucketForDays(1)).toBe('Bucket31_60');
    expect(bucketForDays(30)).toBe('Bucket31_60');
  });

  it('returns Bucket61_90 for 31..60 days overdue', () => {
    expect(bucketForDays(31)).toBe('Bucket61_90');
    expect(bucketForDays(60)).toBe('Bucket61_90');
  });

  it('returns Bucket91_120 for 61..90 days overdue', () => {
    expect(bucketForDays(61)).toBe('Bucket91_120');
    expect(bucketForDays(90)).toBe('Bucket91_120');
  });

  it('returns Bucket120Plus for 91+ days overdue', () => {
    expect(bucketForDays(91)).toBe('Bucket120Plus');
    expect(bucketForDays(200)).toBe('Bucket120Plus');
  });

  it('is monotonic across boundaries', () => {
    const order = ['Current', 'Bucket31_60', 'Bucket61_90', 'Bucket91_120', 'Bucket120Plus'];
    let prev = -1;
    for (let d = 0; d <= 200; d++) {
      const idx = order.indexOf(bucketForDays(d));
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
});
