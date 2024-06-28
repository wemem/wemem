import { describe, expect, test } from 'vitest';

import { createI18n, I18n } from '../../';
import { i18nTime } from '../time';

// Intl api is not available in github action, skip the test
describe('humanTime', () => {
  test('absolute', async () => {
    createI18n();
    expect(i18nTime('2024-10-10 13:30:28')).toBe('Oct 10, 2024, 1:30:28 PM');
    expect(
      i18nTime('2024-10-10 13:30:28', {
        absolute: {
          accuracy: 'minute',
        },
      })
    ).toBe('Oct 10, 2024, 1:30 PM');
    expect(
      i18nTime('2024-10-10 13:30:28', {
        absolute: {
          accuracy: 'day',
        },
      })
    ).toBe('Oct 10, 2024');
    expect(
      i18nTime('2024-10-10 13:30:28', {
        absolute: {
          accuracy: 'day',
          noYear: true,
        },
      })
    ).toBe('Oct 10');
    expect(
      i18nTime('2024-10-10 13:30:28', {
        absolute: {
          accuracy: 'year',
        },
      })
    ).toBe('2024');
    expect(
      i18nTime('2024-10-10 13:30:28', {
        absolute: {
          noDate: true,
          accuracy: 'minute',
        },
      })
    ).toBe('1:30 PM');
  });

  test('relative', async () => {
    createI18n();
    expect(
      i18nTime('2024-10-10 13:30:28.005', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('1s ago');
    expect(
      i18nTime('2024-10-10 13:25:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('5m ago');
    expect(
      i18nTime('2024-10-10 12:59:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('31m ago');
    expect(
      i18nTime('2024-10-10 12:30:30', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('1h ago');
    expect(
      i18nTime('2024-10-9 13:30:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('yesterday');
    expect(
      i18nTime('2024-10-9 12:30:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('yesterday');
    expect(
      i18nTime('2024-10-8 23:59:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('2d ago');
    expect(
      i18nTime('2024-10-7 23:59:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('3d ago');
    expect(
      i18nTime('2024-10-4 00:00:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('6d ago');
    expect(
      i18nTime('2024-10-3 23:59:59', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('last wk.');
    expect(
      i18nTime('2024-9-29 23:59:59', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('last wk.');
    expect(
      i18nTime('2024-9-28 23:59:59', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('2w ago');
    expect(
      i18nTime('2024-9-15 00:00:00', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('last mo.');
    expect(
      i18nTime('2024-9-1 00:00:00', {
        now: '2024-9-30 13:30:30',
        relative: true,
      })
    ).toBe('4w ago');
    expect(
      i18nTime('2024-9-10 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('last mo.');
    expect(
      i18nTime('2023-9-10 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('last yr.');
  });

  test('relative - accuracy', async () => {
    createI18n();
    expect(
      i18nTime('2024-10-10 13:30:28.005', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'minute',
        },
      })
    ).toBe('now');
    expect(
      i18nTime('2024-10-10 13:25:00', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'minute',
        },
      })
    ).toBe('5m ago');
    expect(
      i18nTime('2024-10-10 12:59:00', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'hour',
        },
      })
    ).toBe('now');
    expect(
      i18nTime('2024-10-10 12:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'day',
        },
      })
    ).toBe('today');
    expect(
      i18nTime('2024-10-4 00:00:00', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'week',
        },
      })
    ).toBe('last wk.');
    expect(
      i18nTime('2024-10-9 00:00:00', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'week',
        },
      })
    ).toBe('this week');
    expect(
      i18nTime('2024-9-1 00:00:00', {
        now: '2024-9-30 13:30:30',
        relative: {
          accuracy: 'month',
        },
      })
    ).toBe('this month');
    expect(
      i18nTime('2024-9-10 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'year',
        },
      })
    ).toBe('this year');
    expect(
      i18nTime('2023-9-10 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'year',
        },
      })
    ).toBe('last yr.');
  });

  test('relative - disable yesterdayAndTomorrow', async () => {
    createI18n();
    expect(
      i18nTime('2024-10-9 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('1d ago');
    expect(
      i18nTime('2024-10-11 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('in 1d');
  });

  test('relative - weekday', async () => {
    createI18n();
    expect(
      i18nTime('2024-10-9 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('Wednesday');
    expect(
      i18nTime('2024-10-4 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('Friday');
    expect(
      i18nTime('2024-10-3 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('1w ago');
    expect(
      i18nTime('2024-10-11 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('Friday');
    expect(
      i18nTime('2024-10-16 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('Wednesday');
    expect(
      i18nTime('2024-10-17 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
          yesterdayAndTomorrow: false,
        },
      })
    ).toBe('in 1w');
  });

  test('mix relative and absolute', async () => {
    createI18n();
    expect(
      i18nTime('2024-10-9 14:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          max: [1, 'day'],
        },
      })
    ).toBe('23h ago');
    expect(
      i18nTime('2024-10-9 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          max: [1, 'day'],
        },
        absolute: {
          accuracy: 'day',
        },
      })
    ).toBe('Oct 9, 2024');

    expect(
      i18nTime('2024-10-9 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          max: [2, 'day'],
        },
        absolute: {
          accuracy: 'day',
        },
      })
    ).toBe('yesterday');

    expect(
      i18nTime('2024-10-8 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          max: [2, 'day'],
        },
        absolute: {
          accuracy: 'day',
        },
      })
    ).toBe('Oct 8, 2024');
  });

  test('chinese', () => {
    createI18n();
    I18n.changeLanguage('zh-Hans');
    expect(i18nTime('2024-10-10 13:30:28.005')).toBe('2024年10月10日 13:30:28');
    expect(
      i18nTime('2024-10-10 13:30:28.005', {
        absolute: {
          accuracy: 'day',
        },
      })
    ).toBe('2024年10月10日');
    expect(
      i18nTime('2024-10-10 13:30:28.005', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('1秒前');
    expect(
      i18nTime('2024-10-9 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: true,
      })
    ).toBe('昨天');
    expect(
      i18nTime('2024-10-8 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          weekday: true,
        },
      })
    ).toBe('星期二');
    expect(
      i18nTime('2024-10-8 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'week',
        },
      })
    ).toBe('本周');
    expect(
      i18nTime('2024-10-8 13:30:30', {
        now: '2024-10-10 13:30:30',
        relative: {
          accuracy: 'month',
        },
      })
    ).toBe('本月');
  });
});
