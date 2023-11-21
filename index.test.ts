import { describe, expect, test } from "bun:test";

import { and, char } from './index';

describe("Characters", () => {
    test("matches", () => {
        let a = char('a');
        expect(a.parse('a', 0).type).toEqual('success');
        expect(a.parse('b', 0).type).toEqual('error');

        expect(() => { char('ab') }).toThrow();
    })
})

describe("Sequences", () => {
    test('matches', () => {
        let ab = and(char('a'), char('b'));
        expect(ab.parse('ab', 0).type).toEqual('success');
        expect(ab.parse('ab', 1).type).toEqual('error');
        expect(ab.parse('ac', 0).type).toEqual('error');
    })
})