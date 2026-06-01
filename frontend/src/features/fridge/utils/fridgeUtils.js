export const STATUS_LABELS = {
    PRIVATE: '개인 보관',
    SHARED: '공용',
    CANDIDATE: '찜 가능',
    EXPIRING: '폐기 대상',
    CONSUMED: '소비됨',
};

export const getFoodId = (food) => food.foodId ?? food.id;

export function getDDay(expirationDate) {
    if (!expirationDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
}

export function getDDayColor(dday) {
    if (dday <= 3) return '#FF3B30';
    if (dday <= 7) return '#FFD600';
    return '#34C759';
}

export function getDDayLabel(dday) {
    if (dday < 0) return `D+${Math.abs(dday)}`;
    return `D-${dday}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}.${mm}.${dd}`;
}

export function getEulReul(word) {
    if (!word) return '을';
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '을';
    return (code - 0xAC00) % 28 !== 0 ? '을' : '를';
}

export function getIGa(word) {
    if (!word) return '이';
    const code = word.charCodeAt(word.length - 1);
    if (code < 0xAC00 || code > 0xD7A3) return '이';
    return (code - 0xAC00) % 28 !== 0 ? '이' : '가';
}
