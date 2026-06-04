let _mockDate = null;

export function setMockDate(date) {
    _mockDate = date ? new Date(date) : null;
}

export function clearMockDate() {
    _mockDate = null;
}

export function getNow() {
    return _mockDate ? new Date(_mockDate) : new Date();
}

export function getMockDate() {
    return _mockDate;
}
