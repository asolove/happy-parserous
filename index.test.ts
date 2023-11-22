import { describe, expect, test } from "bun:test";

import { and, char, parse, repeat } from './index';

describe("Characters", () => {
    test("matches character", () => {
        let a = char('a');
        expect(parse(a, 'a').type).toEqual('success');
        expect(parse(a, 'b').type).toEqual('error');

        expect(() => { char('ab') }).toThrow();
    });
});

describe("Sequences", () => {
    test('matches multiple parsers consecutively', () => {
        let ab = and(char('a'), char('b'));
        expect(ab.parse('ab').type).toEqual('success');
        expect(ab.parse('ab', 1).type).toEqual('error');
        expect(ab.parse('ac').type).toEqual('error');
    });
});

describe("Repeat", () => {
    test('*', () => {
        let aStar = repeat(char("a"), 0, Infinity);
        let r = aStar.parse('aaaaaaaaaab'); // 10 a's, then a b.
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(10);
            expect(r.nextIndex).toEqual(10);
        }

        r = aStar.parse('a');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(1);
            expect(r.nextIndex).toEqual(1);
        }

        r = aStar.parse('b');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(0);
            expect(r.nextIndex).toEqual(0);
        }
    });

    test('+', () => {
        let aPlus = repeat(char("a"), 1, Infinity);
        let r = aPlus.parse('aaaaaaaaaab'); // 10 a's, then a b.
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(10);
            expect(r.nextIndex).toEqual(10);
        }


        r = aPlus.parse('a');
        expect(r.type).toEqual('success');
        if(r.type === 'success') {
            expect(r.result[1].length).toEqual(1);
            expect(r.nextIndex).toEqual(1);
        }

        r = aPlus.parse('b');
        expect(r.type).toEqual('error');
        r = aPlus.parse('ba');
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
        let r = intAndFloat.parse('11.11');
        expect(r.type).toEqual('success');
    })
})