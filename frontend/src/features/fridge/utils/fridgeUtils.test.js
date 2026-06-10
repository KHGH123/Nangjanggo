import { setMockDate, clearMockDate } from '@/shared/utils/mockDate';
import {
    getDDay,
    getDDayColor,
    getDDayLabel,
    formatDate,
    getEulReul,
    getIGa,
    getFoodId,
} from './fridgeUtils';

beforeEach(() => {
    setMockDate('2026-06-08');
});

afterEach(() => {
    clearMockDate();
});

// ── getFoodId ──────────────────────────────────────────
describe('getFoodId', () => {
    test('foodId 필드가 있으면 foodId를 반환한다', () => {
        expect(getFoodId({ foodId: 10, id: 99 })).toBe(10);
    });
    test('foodId가 없으면 id를 반환한다', () => {
        expect(getFoodId({ id: 99 })).toBe(99);
    });
});

// ── getDDay ────────────────────────────────────────────
describe('getDDay', () => {
    test('오늘 만료면 0을 반환한다', () => {
        expect(getDDay('2026-06-08')).toBe(0);
    });
    test('3일 후 만료면 3을 반환한다', () => {
        expect(getDDay('2026-06-11')).toBe(3);
    });
    test('어제 만료면 -1을 반환한다', () => {
        expect(getDDay('2026-06-07')).toBe(-1);
    });
    test('날짜가 없으면 null을 반환한다', () => {
        expect(getDDay(null)).toBeNull();
        expect(getDDay('')).toBeNull();
    });
});

// ── getDDayColor ───────────────────────────────────────
describe('getDDayColor', () => {
    test('3일 이하면 빨강을 반환한다', () => {
        expect(getDDayColor(3)).toBe('#FF3B30');
        expect(getDDayColor(0)).toBe('#FF3B30');
        expect(getDDayColor(-1)).toBe('#FF3B30');
    });
    test('4~7일이면 노랑을 반환한다', () => {
        expect(getDDayColor(4)).toBe('#FFD600');
        expect(getDDayColor(7)).toBe('#FFD600');
    });
    test('8일 이상이면 초록을 반환한다', () => {
        expect(getDDayColor(8)).toBe('#34C759');
        expect(getDDayColor(30)).toBe('#34C759');
    });
});

// ── getDDayLabel ───────────────────────────────────────
describe('getDDayLabel', () => {
    test('양수면 D-N 형식을 반환한다', () => {
        expect(getDDayLabel(3)).toBe('D-3');
        expect(getDDayLabel(0)).toBe('D-0');
    });
    test('음수면 D+N 형식을 반환한다', () => {
        expect(getDDayLabel(-1)).toBe('D+1');
        expect(getDDayLabel(-10)).toBe('D+10');
    });
});

// ── formatDate ─────────────────────────────────────────
describe('formatDate', () => {
    test('날짜를 YY.MM.DD 형식으로 반환한다', () => {
        expect(formatDate('2026-06-08')).toBe('26.06.08');
        expect(formatDate('2026-01-01')).toBe('26.01.01');
    });
    test('날짜가 없으면 "-"를 반환한다', () => {
        expect(formatDate(null)).toBe('-');
        expect(formatDate('')).toBe('-');
    });
});

// ── getEulReul ─────────────────────────────────────────
describe('getEulReul', () => {
    test('받침 있는 단어에는 "을"을 반환한다', () => {
        expect(getEulReul('닭')).toBe('을');
        expect(getEulReul('우유')).toBe('를');  // 유 = 받침 없음
    });
    test('받침 없는 단어에는 "를"을 반환한다', () => {
        expect(getEulReul('두부')).toBe('를');
    });
    test('빈 값이면 "을"을 반환한다', () => {
        expect(getEulReul('')).toBe('을');
        expect(getEulReul(null)).toBe('을');
    });
});

// ── getIGa ─────────────────────────────────────────────
describe('getIGa', () => {
    test('받침 있는 단어에는 "이"를 반환한다', () => {
        expect(getIGa('닭')).toBe('이');
    });
    test('받침 없는 단어에는 "가"를 반환한다', () => {
        expect(getIGa('두부')).toBe('가');
    });
    test('빈 값이면 "이"를 반환한다', () => {
        expect(getIGa('')).toBe('이');
        expect(getIGa(null)).toBe('이');
    });
});
