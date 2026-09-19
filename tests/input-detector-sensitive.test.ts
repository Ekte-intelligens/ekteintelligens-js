import { InputDetector } from "../src/utils/input-detector";

describe("InputDetector sensitive inputs, checkboxes and listener lifecycle", () => {
    let detector: InputDetector;
    let calls: number;
    let last: Record<string, any>;

    const blur = (selector: string, value?: string) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (value !== undefined) input.value = value;
        input.dispatchEvent(new Event("blur"));
        return input;
    };

    beforeEach(() => {
        document.body.innerHTML = `
      <input name="email" />
      <input name="password" type="password" />
      <input name="pw2" type="text" id="userPassword" />
      <input name="cardholder" autocomplete="cc-number" />
      <input name="ssn" />
      <input name="kid" autocomplete="one-time-code" />
      <input name="businessName" />
      <input name="accNumber" />
      <input name="field_3" type="text" />
      <input name="cardNotes" />
      <input name="terms" type="checkbox" />
    `;
        calls = 0;
        last = {};
        detector = new InputDetector(null);
        detector.setOnContentUpdate((content) => {
            calls++;
            last = { ...content };
        });
        detector.startListening();
        blur('[name="email"]', "test@example.com");
    });

    it("never stores credential, card or national-id inputs", () => {
        blur('[name="password"]', "hunter2");
        blur('[name="pw2"]', "hunter2");
        blur('[name="cardholder"]', "4111111111111111");
        blur('[name="ssn"]', "01019012345");
        blur('[name="kid"]', "123456");

        expect(last).toEqual({ email: "test@example.com" });
    });

    it("still ignores a password field after a show-password toggle", () => {
        const password = document.querySelector(
            '[name="password"]',
        ) as HTMLInputElement;
        password.type = "text";
        blur('[name="password"]', "hunter2");

        expect(last.password).toBeUndefined();
    });

    it("re-checks the type at blur time (field revealed when listeners attached)", () => {
        // Neutral name, type=text while listening started, so it HAS a
        // listener; hidden again (type=password) by the time it blurs.
        const field = document.querySelector(
            '[name="field_3"]',
        ) as HTMLInputElement;
        field.type = "password";
        blur('[name="field_3"]', "hunter2");

        expect(last.field_3).toBeUndefined();
    });

    it("does not over-block names that merely contain a fragment", () => {
        // "businessName" contains "ssn", "accNumber" contains "ccnumber",
        // "cardNotes" starts like "cardNo"
        blur('[name="businessName"]', "Acme AS");
        blur('[name="accNumber"]', "A-1001");
        blur('[name="cardNotes"]', "Happy birthday");

        expect(last.businessName).toBe("Acme AS");
        expect(last.accNumber).toBe("A-1001");
        expect(last.cardNotes).toBe("Happy birthday");
    });

    it("stores a checkbox only while it is ticked", () => {
        const terms = document.querySelector(
            '[name="terms"]',
        ) as HTMLInputElement;

        blur('[name="terms"]');
        expect(last.terms).toBeUndefined();

        terms.checked = true;
        blur('[name="terms"]');
        expect(last.terms).toBe("on");

        terms.checked = false;
        blur('[name="terms"]');
        expect(last.terms).toBeUndefined();
    });

    it("does not stack listeners across stop/start cycles", () => {
        detector.stopListening();
        detector.startListening();
        detector.startListening();
        calls = 0;

        blur('[name="email"]', "other@example.com");
        expect(calls).toBe(1);
    });

    it("detaches on stopListening", () => {
        detector.stopListening();
        calls = 0;

        blur('[name="email"]', "other@example.com");
        expect(calls).toBe(0);
    });
});
