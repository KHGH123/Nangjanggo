export const FOOD_TAGS = [
    { label: '육류',   value: '육류',   color: '#FF6B6B' },
    { label: '채소',   value: '채소',   color: '#51CF66' },
    { label: '과일',   value: '과일',   color: '#FF9F43' },
    { label: '유제품', value: '유제품', color: '#74C0FC' },
    { label: '해산물', value: '해산물', color: '#339AF0' },
    { label: '가공식품', value: '가공식품', color: '#CC5DE8' },
    { label: '음료',   value: '음료',   color: '#22D3EE' },
    { label: '조미료', value: '조미료', color: '#F59F00' },
    { label: '기타',   value: '기타',   color: '#ADB5BD' },
];

export const getTagColor = (value) =>
    FOOD_TAGS.find(t => t.value === value)?.color ?? '#ADB5BD';
