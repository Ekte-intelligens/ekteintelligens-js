/**
 * Test script for TotalExtractor with various number formats
 *
 * To run this script:
 * 1. Install jsdom if not already installed: npm install --save-dev jsdom @types/jsdom
 * 2. Run with: npx ts-node test-total-extractor.ts
 *
 * Or run as a Jest test (recommended):
 * npm test -- test-total-extractor
 */

// Simple DOM simulation for Node.js
if (typeof document === "undefined") {
    try {
        const { JSDOM } = require("jsdom");
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
        (global as any).window = dom.window;
        (global as any).document = dom.window.document;
    } catch (e) {
        console.error("❌ jsdom is required to run this script in Node.js.");
        console.error(
            "   Install it with: npm install --save-dev jsdom @types/jsdom"
        );
        console.error(
            "   Or run it as a Jest test: npm test -- test-total-extractor"
        );
        process.exit(1);
    }
}

import { TotalExtractor } from "./src/utils/total-extractor";

interface TestCase {
    input: string;
    expected: number;
    description: string;
}

const testCases: TestCase[] = [
    // European decimal format (comma as decimal separator) - will be rounded
    {
        input: "1,79",
        expected: 2,
        description: "European decimal format (1.79 → 2)",
    },
    {
        input: "123,45",
        expected: 123,
        description: "European decimal format (123.45 → 123)",
    },
    {
        input: "0,50",
        expected: 1,
        description: "European decimal format (0.5 → 1)",
    },

    // US decimal format (dot as decimal separator) - will be rounded
    { input: "1.79", expected: 2, description: "US decimal format (1.79 → 2)" },
    {
        input: "123.45",
        expected: 123,
        description: "US decimal format (123.45 → 123)",
    },
    { input: "0.50", expected: 1, description: "US decimal format (0.5 → 1)" },

    // Thousands separator with comma
    {
        input: "1,790",
        expected: 1790,
        description: "Comma as thousands separator (3 digits after)",
    },
    {
        input: "12,345",
        expected: 12345,
        description: "Comma as thousands separator (5 digits total)",
    },
    {
        input: "1,234,567",
        expected: 1234567,
        description: "Multiple comma thousands separators",
    },
    {
        input: "10,000",
        expected: 10000,
        description: "Comma as thousands separator (round number)",
    },

    // Thousands separator with dot (some locales)
    {
        input: "1.790",
        expected: 1790,
        description: "Dot as thousands separator (3 digits after)",
    },
    {
        input: "12.345",
        expected: 12345,
        description: "Dot as thousands separator (5 digits total)",
    },
    {
        input: "1.234.567",
        expected: 1234567,
        description: "Multiple dot thousands separators",
    },

    // Space as thousands separator
    {
        input: "1 790",
        expected: 1790,
        description: "Space as thousands separator",
    },
    {
        input: "12 345",
        expected: 12345,
        description: "Space as thousands separator (5 digits)",
    },
    {
        input: "1 234 567",
        expected: 1234567,
        description: "Multiple space thousands separators",
    },

    // Mixed formats (both comma and dot) - will be rounded
    {
        input: "1,234.56",
        expected: 1235,
        description: "US format: comma thousands, dot decimal (1234.56 → 1235)",
    },
    {
        input: "1.234,56",
        expected: 1235,
        description:
            "European format: dot thousands, comma decimal (1234.56 → 1235)",
    },
    {
        input: "12,345.67",
        expected: 12346,
        description: "US format: multiple thousands (12345.67 → 12346)",
    },

    // With currency symbols
    {
        input: "$1,790",
        expected: 1790,
        description: "Dollar sign with comma thousands",
    },
    {
        input: "€1,79",
        expected: 2,
        description: "Euro sign with comma decimal (1.79 → 2)",
    },
    {
        input: "£1,234.56",
        expected: 1235,
        description: "Pound sign with US format (1234.56 → 1235)",
    },
    {
        input: "1,790 kr",
        expected: 1790,
        description: "Currency suffix with comma thousands",
    },
    {
        input: "1,79 €",
        expected: 2,
        description: "Currency suffix with comma decimal (1.79 → 2)",
    },

    // Edge cases
    { input: "1790", expected: 1790, description: "No separators" },
    { input: "1", expected: 1, description: "Single digit" },
    {
        input: "100",
        expected: 100,
        description: "Round number (no separators)",
    },
    { input: "1,2", expected: 1, description: "European decimal (1.2 → 1)" },
    { input: "1.2", expected: 1, description: "US decimal (1.2 → 1)" },

    // Ambiguous cases (should be handled by 3-digit rule)
    {
        input: "1,234",
        expected: 1234,
        description:
            "Ambiguous: could be 1.234 or 1234 (3 digits after = thousands)",
    },
    {
        input: "1,23",
        expected: 1,
        description:
            "Ambiguous: could be 1.23 or 123 (2 digits after = decimal, 1.23 → 1)",
    },
    {
        input: "1,2345",
        expected: 1,
        description: "More than 3 digits after comma = decimal (1.2345 → 1)",
    },
];

function runTests() {
    console.log("🧪 Testing TotalExtractor with various number formats\n");
    console.log("=".repeat(80));

    let passed = 0;
    let failed = 0;
    const failures: Array<{
        input: string;
        expected: number;
        actual: number;
        description: string;
    }> = [];

    testCases.forEach((testCase, index) => {
        // Create a temporary element in the DOM with the test value
        const testId = `test-${index}`;
        const testElement = document.createElement("div");
        testElement.id = testId;
        testElement.textContent = testCase.input;
        document.body.appendChild(testElement);

        // Extract the total
        const extractor = new TotalExtractor(`#${testId}`);
        const actual = extractor.extractTotal();

        // Check result
        const isPass = Math.abs(actual - testCase.expected) < 0.01; // Allow small floating point differences

        if (isPass) {
            passed++;
            console.log(
                `✅ PASS: "${testCase.input}" → ${actual} (${testCase.description})`
            );
        } else {
            failed++;
            failures.push({
                input: testCase.input,
                expected: testCase.expected,
                actual: actual,
                description: testCase.description,
            });
            console.log(
                `❌ FAIL: "${testCase.input}" → Expected: ${testCase.expected}, Got: ${actual} (${testCase.description})`
            );
        }

        // Clean up
        document.body.removeChild(testElement);
    });

    console.log("=".repeat(80));
    console.log(
        `\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests\n`
    );

    if (failures.length > 0) {
        console.log("❌ Failed tests:");
        failures.forEach((failure) => {
            console.log(
                `   "${failure.input}" - Expected: ${failure.expected}, Got: ${failure.actual} (${failure.description})`
            );
        });
        process.exit(1);
    } else {
        console.log("✅ All tests passed!");
        process.exit(0);
    }
}

// Run the tests
runTests();
