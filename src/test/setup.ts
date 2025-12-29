import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function() {};
