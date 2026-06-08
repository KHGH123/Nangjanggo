import { FOOD_TAGS, getTagColor } from './foodTags';

// ── FOOD_TAGS 구조 검증 ────────────────────────────────
describe('FOOD_TAGS', () => {
    test('9개의 태그가 정의되어 있다', () => {
        expect(FOOD_TAGS).toHaveLength(9);
    });

    test('각 태그는 label, value, color를 가진다', () => {
        FOOD_TAGS.forEach(tag => {
            expect(tag).toHaveProperty('label');
            expect(tag).toHaveProperty('value');
            expect(tag).toHaveProperty('color');
        });
    });

    test('모든 color는 hex 색상 코드 형식이다', () => {
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        FOOD_TAGS.forEach(tag => {
            expect(tag.color).toMatch(hexPattern);
        });
    });
});

// ── getTagColor ────────────────────────────────────────
describe('getTagColor', () => {
    test('존재하는 태그의 color를 반환한다', () => {
        expect(getTagColor('육류')).toBe('#FF6B6B');
        expect(getTagColor('채소')).toBe('#51CF66');
        expect(getTagColor('유제품')).toBe('#74C0FC');
    });

    test('존재하지 않는 태그는 기본 색상을 반환한다', () => {
        expect(getTagColor('없는태그')).toBe('#ADB5BD');
        expect(getTagColor('')).toBe('#ADB5BD');
        expect(getTagColor(null)).toBe('#ADB5BD');
        expect(getTagColor(undefined)).toBe('#ADB5BD');
    });

    test('기타 태그는 기본 색상과 동일한 색상을 반환한다', () => {
        expect(getTagColor('기타')).toBe('#ADB5BD');
    });
});
