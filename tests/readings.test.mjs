// Runs the page's own script outside a browser: node --test
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// The page wires up its form while loading; a stand-in element is enough.
function loadPage() {
    const element = { addEventListener() {}, value: '' };
    const page = vm.createContext({
        document: { getElementById: () => element },
        window: { addEventListener() {} }
    });
    vm.runInContext(script, page);
    return page;
}

// What the page makes of a pasted list: per row the date, the preset or picked
// shift, every shift it offers and the workplace.
function read(text, page = loadPage()) {
    page.pasted = text;
    return JSON.parse(vm.runInContext(`JSON.stringify(resolveSchedule(pasted).map(shift => ({
        date: [shift.row.day, shift.row.month, shift.row.year].join('.'),
        shift: shift.reading ? span(shift.reading) : null,
        offered: shift.readings.map(span),
        place: shift.row.location
    })))`, page));
}

function calendar(name, text, page = loadPage()) {
    page.person = name;
    page.pasted = text;
    return vm.runInContext('generateICS(person, resolveSchedule(pasted))', page);
}

// The staff app's export: 12-hour times without AM/PM, underscore between them.
const EXPORT = [
    'Vakter for Hansen, Kari',
    '',
    'Dato\tArbeidstid\tSted',
    '01.06.2026\t08:00_04:00\t0001 Test Store',
    '02.06.2026\t03:00_11:15\t0001 Test Store',
    '03.06.2026\t12:00_08:00\t0001 Test Store',
    '04.06.2026\t10:00_06:00\t0001 Test Store',
    '05.06.2026\t09:00_05:00\t0001 Test Store',
    '06.06.2026\t03:00_10:00\t0001 Test Store',
    '07.06.2026\t09:45_04:00\t0001 Test Store',
    '08.06.2026\t02:00_10:00\t0001 Test Store',
    '09.06.2026\t08:00_03:00\t0001 Test Store',
    '10.06.2026\t06:30_03:00\t0001 Test Store',
    'This is a system generated list.'
].join('\n');

const SHIFTS = [
    '08:00-16:00', '15:00-23:15', '12:00-20:00', '10:00-18:00', '09:00-17:00',
    '15:00-22:00', '09:45-16:00', '14:00-22:00', '08:00-15:00', '06:30-15:00'
];

test('12-hour export is read on the 24-hour clock', () => {
    const rows = read(EXPORT);
    assert.deepEqual(rows.map(row => row.shift), SHIFTS);
    assert.deepEqual(rows.map(row => row.place), Array(10).fill('0001 Test Store'));
});

test('one cell per line reads like tab-separated cells', () => {
    assert.deepEqual(read(EXPORT.replaceAll('\t', '\n')), read(EXPORT));
});

test('24-hour list is used as written', () => {
    const rows = read([
        'No\tDate\tWork Time\tLocation',
        '1\t05.08.2025\t06:30-14:00\t0001 Test Store',
        '2\t06.08.2025\t13:00-20:00\t0001 Test Store',
        '3\t07.08.2025\t08:00-12:00\t0001 Test Store',
        '4\t08.08.2025\t22:00-06:00\t0001 Test Store'
    ].join('\n'));
    assert.deepEqual(rows.map(row => row.shift), ['06:30-14:00', '13:00-20:00', '08:00-12:00', '22:00-06:00']);
    assert.deepEqual(rows.map(row => row.offered.length), [1, 1, 1, 1]);
    assert.deepEqual(rows.map(row => row.place), Array(4).fill('0001 Test Store'));
});

test('a row with two shifts inside working hours is not preset', () => {
    const [row] = read('01.06.2026\t06:00_10:00\t0001 Test Store');
    assert.equal(row.shift, null);
    assert.deepEqual(row.offered, ['06:00-10:00', '18:00-22:00']);
});

test('a night shift can be picked instead of the preset day shift', () => {
    const page = loadPage();
    const text = '01.06.2026\t10:00_06:00\t0001 Test Store';
    assert.equal(read(text, page)[0].shift, '10:00-18:00');
    assert.deepEqual(read(text, page)[0].offered, ['10:00-18:00', '22:00-06:00']);

    vm.runInContext(`choices.set('1.6.2026 10:00_06:00', '22:00-06:00')`, page);
    assert.equal(read(text, page)[0].shift, '22:00-06:00');
    const ics = calendar('Kari', text, page);
    assert.match(ics, /\r\nDTSTART:20260601T220000\r\n/);
    assert.match(ics, /\r\nDTEND:20260602T060000\r\n/);
});

test('calendar event carries the 24-hour shift', () => {
    const ics = calendar('Kari Hansen', '02.06.2026\t03:00_11:15\t0001 Test Store');
    assert.match(ics, /\r\nDTSTART:20260602T150000\r\n/);
    assert.match(ics, /\r\nDTEND:20260602T231500\r\n/);
    assert.match(ics, /\r\nSUMMARY:Kari Hansen vakt 15:00-23:15\r\n/);
    assert.match(ics, /\r\nLOCATION:0001 Test Store\r\n/);
});

test('a list pasted twice gives each shift once', () => {
    assert.equal(read(EXPORT + '\n' + EXPORT).length, 10);
});

test('an impossible date or time is not a shift', () => {
    assert.deepEqual(read('31.02.2026\t08:00_04:00\tX\n01.06.2026\t25:00_04:00\tX'), []);
});

test('a list without shifts is an error', () => {
    assert.throws(() => calendar('Kari', 'nothing here'), /No valid schedule entries found/);
});
