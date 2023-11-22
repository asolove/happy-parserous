import { describe, expect, test } from "bun:test";

import { and, char, parse, repeat } from './index';

describe("Characters", () => {
    test("errors on invalid input", () => {
        expect(() => { char('ab') }).toThrow();
        expect(() => { char('') }).toThrow();
        expect(() => { char(5 as any) }).toThrow();
        expect(() => { char(['a'] as any) }).toThrow();
    })
    test("matches character", () => {
        let a = char('a');
        expect(parse(a, 'a').type).toEqual('success');
        expect(parse(a, 'b').type).toEqual('error');
    });
});

describe("Sequences", () => {
    test('matches multiple parsers consecutively', () => {
        let ab = and(char('a'), char('b'));
        expect(parse(ab, 'ab').type).toEqual('success');
        expect(parse(ab, 'aab').type).toEqual('error');
        expect(parse(ab, 'ac').type).toEqual('error');
    });
});

describe("Repeat", () => {
    test('*', () => {
        let aStar = repeat(char("a"), 0, Infinity);
        let r = parse(aStar, 'aaaaaaaaaab'); // 10 a's, then a b.
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(10);
            expect(r.nextIndex).toEqual(10);
        }

        r = parse(aStar, 'a');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(1);
            expect(r.nextIndex).toEqual(1);
        }

        r = parse(aStar, 'b');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(0);
            expect(r.nextIndex).toEqual(0);
        }
    });

    test('+', () => {
        let aPlus = repeat(char("a"), 1, Infinity);
        let r = parse(aPlus, 'aaaaaaaaaab'); // 10 a's, then a b.
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(10);
            expect(r.nextIndex).toEqual(10);
        }


        r = parse(aPlus, 'a');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(1);
            expect(r.nextIndex).toEqual(1);
        }

        r = parse(aPlus, 'b');
        expect(r.type).toEqual('error');
        r = parse(aPlus, 'ba');
        expect(r.type).toEqual('error');
    });
});


describe("Backtracking", () => {
    test('on sequences', () => {
        let integer = repeat(char('1'), 1, Infinity);
        let float = and(
            repeat(char('1'), 1, Infinity),
            and(char('.'), repeat(char('1'), 1, Infinity)));
        let intAndFloat = and(integer, float);

        // On first pass, integer will consume up to '11', then 
        // the float parser will fail to match. Need to backtrack
        // so that integer just consumes '1', and flot can succeed.
        let r = parse(intAndFloat, '11.11');
        expect(r.type).toEqual('success');
    })
})