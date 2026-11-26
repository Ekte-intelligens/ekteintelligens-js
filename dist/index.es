var pr = Object.defineProperty;
var gr = (i, e, t) => e in i ? pr(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var p = (i, e, t) => gr(i, typeof e != "symbol" ? e + "" : e, t);
const Y = class Y {
  constructor(e) {
    p(this, "inputMapping");
    p(this, "content", {});
    p(this, "sessionId");
    p(this, "hasEmailOrPhone", !1);
    p(this, "onContentUpdate");
    // One stable reference: `.bind(this)` returns a new function on every
    // call, so removeEventListener(this.handleInputBlur.bind(this)) never
    // removed anything and a stop/start cycle stacked duplicate listeners.
    // Adding the same reference twice is a no-op, so restarts are safe too.
    p(this, "boundHandleInputBlur", (e) => this.handleInputBlur(e));
    this.inputMapping = this.cleanInputMapping(e);
  }
  cleanInputMapping(e) {
    if (!e) return e;
    const t = { ...e };
    return t.form_selector && (t.form_selector = this.cleanSelector(
      t.form_selector
    )), t.inputs && t.inputs.length > 0 && (t.inputs = t.inputs.map(
      (s) => this.cleanSelector(s)
    )), t;
  }
  cleanSelector(e) {
    return e.replace(/\\\\/g, "\\");
  }
  setOnContentUpdate(e) {
    this.onContentUpdate = e;
  }
  setSessionId(e) {
    this.sessionId = e;
  }
  startListening() {
    this.getTargetInputs().forEach((t) => {
      t.addEventListener("blur", this.boundHandleInputBlur);
    });
  }
  stopListening() {
    this.getTargetInputs().forEach((t) => {
      t.removeEventListener("blur", this.boundHandleInputBlur);
    });
  }
  /**
   * Credentials, payment-card and national-id inputs are never observed or
   * stored, whatever the campaign's input mapping says. Detected by input
   * type, the autocomplete hint (cc-*, *-password, one-time-code) and
   * name/id.
   */
  isSensitiveInput(e) {
    const t = (e.getAttribute("type") || e.type || "").toLowerCase();
    if (Y.IGNORED_INPUT_TYPES.has(t)) return !0;
    const s = (e.getAttribute("autocomplete") || "").toLowerCase();
    return /(^|\s)(cc-[a-z-]+|current-password|new-password|one-time-code)(\s|$)/.test(
      s
    ) ? !0 : Y.SENSITIVE_NAME.test(e.name || "") || Y.SENSITIVE_NAME.test(e.id || "");
  }
  getTargetInputs() {
    const e = (t) => t.filter(
      (s) => !this.isInputExcluded(s) && !this.isSensitiveInput(s) && !s.closest(`[${Y.NO_CAPTURE_ATTRIBUTE}]`)
    );
    if (!this.inputMapping)
      return e(
        Array.from(document.querySelectorAll("input"))
      );
    if (this.inputMapping.form_selector) {
      const t = document.querySelector(
        this.inputMapping.form_selector
      );
      if (t)
        return e(
          Array.from(t.querySelectorAll("input"))
        );
    }
    return this.inputMapping.inputs && this.inputMapping.inputs.length > 0 ? e(
      this.inputMapping.inputs.map((t) => document.querySelector(t)).filter(
        (t) => t !== null
      )
    ) : e(Array.from(document.querySelectorAll("input")));
  }
  isInputExcluded(e) {
    var n;
    const t = (n = this.inputMapping) == null ? void 0 : n.excluded_inputs;
    if (!t || t.length === 0) return !1;
    const s = (e.name || "").toLowerCase(), r = (e.id || "").toLowerCase();
    return t.some((o) => {
      const a = o.toLowerCase();
      return s !== "" && a === s || r !== "" && a === r;
    });
  }
  handleInputBlur(e) {
    const t = e.target;
    if (this.isInputExcluded(t) || this.isSensitiveInput(t)) return;
    const s = this.getFieldName(t);
    if ((t.type === "checkbox" || t.type === "radio") && !t.checked) {
      t.type === "checkbox" && s in this.content && (delete this.content[s], this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
      return;
    }
    const r = t.value.trim();
    r && (this.content[s] = r, this.isEmailOrPhone(s, r) && (this.hasEmailOrPhone = !0), this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
  }
  getFieldName(e) {
    var s, r;
    let t = e.name || e.id || e.getAttribute("data-field") || e.type || "unknown";
    if ((s = this.inputMapping) != null && s.field_mappings && this.inputMapping.field_mappings[t])
      t = this.inputMapping.field_mappings[t];
    else if ((r = this.inputMapping) != null && r.field_mappings) {
      const n = e.getAttribute("autocomplete-data");
      n && this.inputMapping.field_mappings[n] && (t = this.inputMapping.field_mappings[n]);
    }
    return t;
  }
  isEmailOrPhone(e, t) {
    const s = e.toLowerCase();
    return s.includes("email") || s.includes("mail") ? this.isValidEmail(t) : s.includes("phone") || s.includes("tel") ? this.isValidPhone(t) : this.isValidEmail(t) || this.isValidPhone(t);
  }
  isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }
  isValidPhone(e) {
    return /^[\+]?[0-9\s\-\(\)]{7,}$/.test(e);
  }
  getContent() {
    return { ...this.content };
  }
  hasEmailOrPhoneNumber() {
    return this.hasEmailOrPhone;
  }
};
/** Inputs inside an element with this attribute are never captured. */
p(Y, "NO_CAPTURE_ATTRIBUTE", "data-ei-no-capture"), // Input types that never hold contact details worth recovering a cart
// with. `password` is the one that matters: checkouts with a login or
// create-account form had the password uploaded as session content.
p(Y, "IGNORED_INPUT_TYPES", /* @__PURE__ */ new Set([
  "password",
  "hidden",
  "file",
  "submit",
  "button",
  "reset",
  "image"
])), // name/id fragments of credential, payment-card and national-id fields.
// Short fragments need boundaries so ordinary fields are not dropped:
// "businessName" contains "ssn", "accNumber" contains "ccnumber",
// "cardNotes" starts like "cardNo".
p(Y, "SENSITIVE_NAME", /passw|passord|pwd|cvc|cvv|card[-_ ]?(number|(num|no)([^a-z]|$))|security[-_ ]?code|kontonummer|account[-_ ]?number|personnummer|f[oø]dselsnummer|(^|[^a-z])(ssn|iban)([^a-z]|$)|(^|[^a-z])cc[-_]?(number|num|csc|exp)/i);
let We = Y;
class mr {
  constructor(e) {
    p(this, "productMapping");
    this.productMapping = this.cleanProductMapping(e);
  }
  cleanProductMapping(e) {
    if (!e) return e;
    if (e.fields) {
      const t = { ...e }, s = {};
      for (const [r, n] of Object.entries(
        e.fields
      ))
        s[r] = this.cleanSelector(
          n
        );
      return t.fields = s, t;
    }
    return e;
  }
  cleanSelector(e) {
    return e.replace(/\\\\/g, "\\");
  }
  detectProducts() {
    const e = [];
    return !this.productMapping || Object.keys(this.productMapping).length === 0 ? this.detectCommonProducts() : this.productMapping.fields ? this.detectProductsWithFieldsMapping() : e;
  }
  detectProductsWithFieldsMapping() {
    const e = [], t = this.productMapping.fields;
    if (!t)
      return e;
    const s = Object.values(t), r = this.findCommonParentSelector(s);
    if (r && document.querySelectorAll(r).forEach((o) => {
      const a = this.extractProductFromFieldsMapping(
        o,
        t
      );
      a && Object.keys(a).length > 0 && e.push(a);
    }), e.length === 0) {
      const n = this.extractProductFromFieldsMapping(
        document.body,
        t
      );
      n && Object.keys(n).length > 0 && e.push(n);
    }
    return e.length === 0 && this.findElementsWithAnySelector(s).forEach((o) => {
      const a = this.extractProductFromFieldsMapping(
        o,
        t
      );
      a && Object.keys(a).length > 0 && e.push(a);
    }), e;
  }
  findCommonParentSelector(e) {
    const t = e[0];
    if (!t) return null;
    const s = t.split(" > ");
    if (s.length > 1) {
      const n = s[0];
      if (e.every(
        (a) => a.startsWith(n)
      ))
        return n;
    }
    const r = [
      "body",
      "main",
      "#content",
      "#main",
      ".main",
      ".content"
    ];
    for (const n of r)
      if (document.querySelectorAll(n).length > 0)
        return n;
    return null;
  }
  extractProductFromFieldsMapping(e, t) {
    try {
      const s = {};
      for (const [r, n] of Object.entries(t)) {
        let o = this.extractValue(e, n);
        if (o === null && n.startsWith("data-")) {
          const a = document.querySelectorAll(
            `[${n}]`
          );
          a.length > 0 && (o = a[0].getAttribute(
            n
          ));
        }
        o !== null && (r.toLowerCase().includes("price") ? s[r] = this.extractPrice(
          e,
          n
        ) : r.toLowerCase().includes("quantity") ? s[r] = this.extractQuantity(
          e,
          n
        ) : s[r] = o);
      }
      return Object.keys(s).length > 0 ? s : null;
    } catch (s) {
      return console.warn(
        "Error extracting product from fields mapping:",
        s
      ), null;
    }
  }
  detectCommonProducts() {
    const e = [], t = [
      "[data-product-id]",
      ".product-item",
      ".cart-item",
      "[data-sku]",
      ".product",
      ".item"
    ];
    for (const s of t)
      document.querySelectorAll(s).forEach((n) => {
        const o = this.extractProductFromCommonElement(n);
        o && e.push(o);
      });
    return e;
  }
  extractProductFromCommonElement(e) {
    try {
      const t = {
        id: this.extractValue(e, "data-product-id") || this.extractValue(e, "data-sku") || this.extractValue(e, "id") || "",
        name: this.extractValue(e, "data-product-name") || this.extractValue(e, "title") || this.extractTextContent(
          e,
          ".product-name, .item-name, .title"
        ) || "",
        price: this.extractPrice(e, "data-price") || this.extractPrice(e, "data-price-amount") || 0,
        quantity: this.extractQuantity(e, "data-quantity") || this.extractQuantity(e, "quantity") || 1
      };
      return t.id || t.name ? t : null;
    } catch (t) {
      return console.warn(
        "Error extracting product from common element:",
        t
      ), null;
    }
  }
  extractValue(e, t) {
    var s, r, n;
    try {
      if (t.startsWith("data-"))
        return e.getAttribute(t) || null;
      if (t.startsWith(">"))
        try {
          const a = e.querySelector(t);
          return a && ((s = a.textContent) == null ? void 0 : s.trim()) || null;
        } catch (a) {
          return console.warn(`Invalid selector: ${t}`, a), null;
        }
      if (t.includes(",")) {
        const a = t.split(",").map((l) => l.trim());
        for (const l of a)
          try {
            const c = e.querySelector(l);
            if (c)
              return ((r = c.textContent) == null ? void 0 : r.trim()) || null;
          } catch (c) {
            console.warn(
              `Invalid selector in comma list: ${l}`,
              c
            );
            continue;
          }
        return null;
      }
      const o = e.querySelector(t);
      return o && ((n = o.textContent) == null ? void 0 : n.trim()) || null;
    } catch (o) {
      return console.warn(
        `Error extracting value with selector: ${t}`,
        o
      ), null;
    }
  }
  extractTextContent(e, t) {
    var r;
    const s = e.querySelector(t);
    return s && ((r = s.textContent) == null ? void 0 : r.trim()) || null;
  }
  extractPrice(e, t) {
    const s = this.extractValue(e, t);
    if (!s) return 0;
    let r = s.replace(/^[A-Z]{3}\s*/i, "");
    if (r = r.replace(/^[€$£¥]\s*/i, ""), r = r.replace(/[^\d.,]/g, ""), r.includes(",")) {
      const o = r.split(",");
      o.length === 2 && o[1].length === 3 ? r = o[0] + o[1] : r = r.replace(",", ".");
    }
    const n = parseFloat(r);
    return isNaN(n) ? 0 : n;
  }
  extractQuantity(e, t) {
    const s = this.extractValue(e, t);
    if (!s) return 1;
    const r = parseInt(s);
    return isNaN(r) ? 1 : r;
  }
  findElementsWithAnySelector(e) {
    const t = /* @__PURE__ */ new Set();
    for (const s of e)
      try {
        document.querySelectorAll(s).forEach((n) => t.add(n));
      } catch (r) {
        console.warn(`Invalid selector: ${s}`, r);
      }
    return Array.from(t);
  }
}
class vr {
  constructor(e) {
    p(this, "totalSelector");
    this.totalSelector = e ? this.cleanSelector(e) : void 0;
  }
  cleanSelector(e) {
    return e.replace(/\\\\/g, "\\");
  }
  extractTotal() {
    var e;
    if (!this.totalSelector)
      return 0;
    try {
      const t = document.querySelector(this.totalSelector);
      if (!t)
        return console.warn(`Total selector not found: ${this.totalSelector}`), 0;
      const s = ((e = t.textContent) == null ? void 0 : e.trim()) || "";
      if (!s)
        return console.warn(
          `No text content found for total selector: ${this.totalSelector}`
        ), 0;
      let r = s.replace(/[^\d.,]/g, "");
      const n = r.includes(","), o = r.includes(".");
      if (n && o) {
        const l = r.lastIndexOf(","), c = r.lastIndexOf(".");
        l > c ? r.substring(l + 1).length === 2 ? (r = r.replace(/\./g, ""), r = r.replace(",", ".")) : r = r.replace(/,/g, "") : r = r.replace(/,/g, "");
      } else if (n && !o) {
        const l = r.match(/,/g);
        if ((l ? l.length : 0) > 1)
          r = r.replace(/,/g, "");
        else {
          const u = r.match(/,(\d+)$/);
          u && u[1].length === 3 ? r = r.replace(",", "") : r = r.replace(",", ".");
        }
      } else if (!n && o) {
        const l = r.match(/\./g);
        if ((l ? l.length : 0) > 1)
          r = r.replace(/\./g, "");
        else {
          const u = r.match(/\.(\d+)$/);
          u && u[1].length === 3 && (r = r.replace(".", ""));
        }
      }
      const a = parseFloat(r);
      return isNaN(a) ? (console.warn(`Could not parse total value: ${s}`), 0) : Math.round(a);
    } catch (t) {
      return console.warn(
        `Error extracting total with selector: ${this.totalSelector}`,
        t
      ), 0;
    }
  }
  hasTotalSelector() {
    return !!this.totalSelector;
  }
}
const yr = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Ie).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class Nt extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class br extends Nt {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class rs extends Nt {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class ns extends Nt {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var mt;
(function(i) {
  i.Any = "any", i.ApNortheast1 = "ap-northeast-1", i.ApNortheast2 = "ap-northeast-2", i.ApSouth1 = "ap-south-1", i.ApSoutheast1 = "ap-southeast-1", i.ApSoutheast2 = "ap-southeast-2", i.CaCentral1 = "ca-central-1", i.EuCentral1 = "eu-central-1", i.EuWest1 = "eu-west-1", i.EuWest2 = "eu-west-2", i.EuWest3 = "eu-west-3", i.SaEast1 = "sa-east-1", i.UsEast1 = "us-east-1", i.UsWest1 = "us-west-1", i.UsWest2 = "us-west-2";
})(mt || (mt = {}));
var _r = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class wr {
  constructor(e, { headers: t = {}, customFetch: s, region: r = mt.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = yr(s);
  }
  /**
   * Updates the authorization header
   * @param token - the new jwt token sent in the authorisation header
   */
  setAuth(e) {
    this.headers.Authorization = `Bearer ${e}`;
  }
  /**
   * Invokes a function
   * @param functionName - The name of the Function to invoke.
   * @param options - Options for invoking the Function.
   */
  invoke(e, t = {}) {
    var s;
    return _r(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: n, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region);
        const c = new URL(`${this.url}/${e}`);
        l && l !== "any" && (a["x-region"] = l, c.searchParams.set("forceFunctionRegion", l));
        let u;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", u = o) : typeof FormData < "u" && o instanceof FormData ? u = o : (a["Content-Type"] = "application/json", u = JSON.stringify(o)));
        const d = yield this.fetch(c.toString(), {
          method: n || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: u
        }).catch((v) => {
          throw new br(v);
        }), h = d.headers.get("x-relay-error");
        if (h && h === "true")
          throw new rs(d);
        if (!d.ok)
          throw new ns(d);
        let f = ((s = d.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), g;
        return f === "application/json" ? g = yield d.json() : f === "application/octet-stream" ? g = yield d.blob() : f === "text/event-stream" ? g = d : f === "multipart/form-data" ? g = yield d.formData() : g = yield d.text(), { data: g, error: null, response: d };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof ns || r instanceof rs ? r.context : void 0
        };
      }
    });
  }
}
var M = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Sr(i) {
  if (i.__esModule) return i;
  var e = i.default;
  if (typeof e == "function") {
    var t = function s() {
      return this instanceof s ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(i).forEach(function(s) {
    var r = Object.getOwnPropertyDescriptor(i, s);
    Object.defineProperty(t, s, r.get ? r : {
      enumerable: !0,
      get: function() {
        return i[s];
      }
    });
  }), t;
}
var F = {}, Ut = {}, Ze = {}, Ue = {}, et = {}, tt = {}, kr = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, Ce = kr();
const Er = Ce.fetch, As = Ce.fetch.bind(Ce), Ts = Ce.Headers, Cr = Ce.Request, Ir = Ce.Response, Ie = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: Ts,
  Request: Cr,
  Response: Ir,
  default: As,
  fetch: Er
}, Symbol.toStringTag, { value: "Module" })), Ar = /* @__PURE__ */ Sr(Ie);
var st = {};
Object.defineProperty(st, "__esModule", { value: !0 });
let Tr = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
st.default = Tr;
var Ps = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(tt, "__esModule", { value: !0 });
const Pr = Ps(Ar), xr = Ps(st);
let Or = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = Pr.default : this.fetch = fetch;
  }
  /**
   * If there's an error with the query, throwOnError will reject the promise by
   * throwing the error instead of returning it as part of a successful response.
   *
   * {@link https://github.com/supabase/supabase-js/issues/92}
   */
  throwOnError() {
    return this.shouldThrowOnError = !0, this;
  }
  /**
   * Set an HTTP header for the request.
   */
  setHeader(e, t) {
    return this.headers = Object.assign({}, this.headers), this.headers[e] = t, this;
  }
  then(e, t) {
    this.schema === void 0 || (["GET", "HEAD"].includes(this.method) ? this.headers["Accept-Profile"] = this.schema : this.headers["Content-Profile"] = this.schema), this.method !== "GET" && this.method !== "HEAD" && (this.headers["Content-Type"] = "application/json");
    const s = this.fetch;
    let r = s(this.url.toString(), {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
      signal: this.signal
    }).then(async (n) => {
      var o, a, l;
      let c = null, u = null, d = null, h = n.status, f = n.statusText;
      if (n.ok) {
        if (this.method !== "HEAD") {
          const b = await n.text();
          b === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = b : u = JSON.parse(b));
        }
        const v = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), m = (a = n.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        v && m && m.length > 1 && (d = parseInt(m[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (c = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const v = await n.text();
        try {
          c = JSON.parse(v), Array.isArray(c) && n.status === 404 && (u = [], c = null, h = 200, f = "OK");
        } catch {
          n.status === 404 && v === "" ? (h = 204, f = "No Content") : c = {
            message: v
          };
        }
        if (c && this.isMaybeSingle && (!((l = c == null ? void 0 : c.details) === null || l === void 0) && l.includes("0 rows")) && (c = null, h = 200, f = "OK"), c && this.shouldThrowOnError)
          throw new xr.default(c);
      }
      return {
        error: c,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (r = r.catch((n) => {
      var o, a, l;
      return {
        error: {
          message: `${(o = n == null ? void 0 : n.name) !== null && o !== void 0 ? o : "FetchError"}: ${n == null ? void 0 : n.message}`,
          details: `${(a = n == null ? void 0 : n.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(l = n == null ? void 0 : n.code) !== null && l !== void 0 ? l : ""}`
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), r.then(e, t);
  }
  /**
   * Override the type of the returned `data`.
   *
   * @typeParam NewResult - The new result type to override with
   * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
   */
  returns() {
    return this;
  }
  /**
   * Override the type of the returned `data` field in the response.
   *
   * @typeParam NewResult - The new type to cast the response data to
   * @typeParam Options - Optional type configuration (defaults to { merge: true })
   * @typeParam Options.merge - When true, merges the new type with existing return type. When false, replaces the existing types entirely (defaults to true)
   * @example
   * ```typescript
   * // Merge with existing types (default behavior)
   * const query = supabase
   *   .from('users')
   *   .select()
   *   .overrideTypes<{ custom_field: string }>()
   *
   * // Replace existing types completely
   * const replaceQuery = supabase
   *   .from('users')
   *   .select()
   *   .overrideTypes<{ id: number; name: string }, { merge: false }>()
   * ```
   * @returns A PostgrestBuilder instance with the new type
   */
  overrideTypes() {
    return this;
  }
};
tt.default = Or;
var Lr = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(et, "__esModule", { value: !0 });
const jr = Lr(tt);
let Rr = class extends jr.default {
  /**
   * Perform a SELECT on the query result.
   *
   * By default, `.insert()`, `.update()`, `.upsert()`, and `.delete()` do not
   * return modified rows. By calling this method, modified rows are returned in
   * `data`.
   *
   * @param columns - The columns to retrieve, separated by commas
   */
  select(e) {
    let t = !1;
    const s = (e ?? "*").split("").map((r) => /\s/.test(r) && !t ? "" : (r === '"' && (t = !t), r)).join("");
    return this.url.searchParams.set("select", s), this.headers.Prefer && (this.headers.Prefer += ","), this.headers.Prefer += "return=representation", this;
  }
  /**
   * Order the query result by `column`.
   *
   * You can call this method multiple times to order by multiple columns.
   *
   * You can order referenced tables, but it only affects the ordering of the
   * parent table if you use `!inner` in the query.
   *
   * @param column - The column to order by
   * @param options - Named parameters
   * @param options.ascending - If `true`, the result will be in ascending order
   * @param options.nullsFirst - If `true`, `null`s appear first. If `false`,
   * `null`s appear last.
   * @param options.referencedTable - Set this to order a referenced table by
   * its columns
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  order(e, { ascending: t = !0, nullsFirst: s, foreignTable: r, referencedTable: n = r } = {}) {
    const o = n ? `${n}.order` : "order", a = this.url.searchParams.get(o);
    return this.url.searchParams.set(o, `${a ? `${a},` : ""}${e}.${t ? "asc" : "desc"}${s === void 0 ? "" : s ? ".nullsfirst" : ".nullslast"}`), this;
  }
  /**
   * Limit the query result by `count`.
   *
   * @param count - The maximum number of rows to return
   * @param options - Named parameters
   * @param options.referencedTable - Set this to limit rows of referenced
   * tables instead of the parent table
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  limit(e, { foreignTable: t, referencedTable: s = t } = {}) {
    const r = typeof s > "u" ? "limit" : `${s}.limit`;
    return this.url.searchParams.set(r, `${e}`), this;
  }
  /**
   * Limit the query result by starting at an offset `from` and ending at the offset `to`.
   * Only records within this range are returned.
   * This respects the query order and if there is no order clause the range could behave unexpectedly.
   * The `from` and `to` values are 0-based and inclusive: `range(1, 3)` will include the second, third
   * and fourth rows of the query.
   *
   * @param from - The starting index from which to limit the result
   * @param to - The last index to which to limit the result
   * @param options - Named parameters
   * @param options.referencedTable - Set this to limit rows of referenced
   * tables instead of the parent table
   * @param options.foreignTable - Deprecated, use `options.referencedTable`
   * instead
   */
  range(e, t, { foreignTable: s, referencedTable: r = s } = {}) {
    const n = typeof r > "u" ? "offset" : `${r}.offset`, o = typeof r > "u" ? "limit" : `${r}.limit`;
    return this.url.searchParams.set(n, `${e}`), this.url.searchParams.set(o, `${t - e + 1}`), this;
  }
  /**
   * Set the AbortSignal for the fetch request.
   *
   * @param signal - The AbortSignal to use for the fetch request
   */
  abortSignal(e) {
    return this.signal = e, this;
  }
  /**
   * Return `data` as a single object instead of an array of objects.
   *
   * Query result must be one row (e.g. using `.limit(1)`), otherwise this
   * returns an error.
   */
  single() {
    return this.headers.Accept = "application/vnd.pgrst.object+json", this;
  }
  /**
   * Return `data` as a single object instead of an array of objects.
   *
   * Query result must be zero or one row (e.g. using `.limit(1)`), otherwise
   * this returns an error.
   */
  maybeSingle() {
    return this.method === "GET" ? this.headers.Accept = "application/json" : this.headers.Accept = "application/vnd.pgrst.object+json", this.isMaybeSingle = !0, this;
  }
  /**
   * Return `data` as a string in CSV format.
   */
  csv() {
    return this.headers.Accept = "text/csv", this;
  }
  /**
   * Return `data` as an object in [GeoJSON](https://geojson.org) format.
   */
  geojson() {
    return this.headers.Accept = "application/geo+json", this;
  }
  /**
   * Return `data` as the EXPLAIN plan for the query.
   *
   * You need to enable the
   * [db_plan_enabled](https://supabase.com/docs/guides/database/debugging-performance#enabling-explain)
   * setting before using this method.
   *
   * @param options - Named parameters
   *
   * @param options.analyze - If `true`, the query will be executed and the
   * actual run time will be returned
   *
   * @param options.verbose - If `true`, the query identifier will be returned
   * and `data` will include the output columns of the query
   *
   * @param options.settings - If `true`, include information on configuration
   * parameters that affect query planning
   *
   * @param options.buffers - If `true`, include information on buffer usage
   *
   * @param options.wal - If `true`, include information on WAL record generation
   *
   * @param options.format - The format of the output, can be `"text"` (default)
   * or `"json"`
   */
  explain({ analyze: e = !1, verbose: t = !1, settings: s = !1, buffers: r = !1, wal: n = !1, format: o = "text" } = {}) {
    var a;
    const l = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      r ? "buffers" : null,
      n ? "wal" : null
    ].filter(Boolean).join("|"), c = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${o}; for="${c}"; options=${l};`, o === "json" ? this : this;
  }
  /**
   * Rollback the query.
   *
   * `data` will still be returned, but the query is not committed.
   */
  rollback() {
    var e;
    return ((e = this.headers.Prefer) !== null && e !== void 0 ? e : "").trim().length > 0 ? this.headers.Prefer += ",tx=rollback" : this.headers.Prefer = "tx=rollback", this;
  }
  /**
   * Override the type of the returned `data`.
   *
   * @typeParam NewResult - The new result type to override with
   * @deprecated Use overrideTypes<yourType, { merge: false }>() method at the end of your call chain instead
   */
  returns() {
    return this;
  }
};
et.default = Rr;
var $r = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Ue, "__esModule", { value: !0 });
const Dr = $r(et);
let Nr = class extends Dr.default {
  /**
   * Match only rows where `column` is equal to `value`.
   *
   * To check if the value of `column` is NULL, you should use `.is()` instead.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  eq(e, t) {
    return this.url.searchParams.append(e, `eq.${t}`), this;
  }
  /**
   * Match only rows where `column` is not equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  neq(e, t) {
    return this.url.searchParams.append(e, `neq.${t}`), this;
  }
  /**
   * Match only rows where `column` is greater than `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  gt(e, t) {
    return this.url.searchParams.append(e, `gt.${t}`), this;
  }
  /**
   * Match only rows where `column` is greater than or equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  gte(e, t) {
    return this.url.searchParams.append(e, `gte.${t}`), this;
  }
  /**
   * Match only rows where `column` is less than `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  lt(e, t) {
    return this.url.searchParams.append(e, `lt.${t}`), this;
  }
  /**
   * Match only rows where `column` is less than or equal to `value`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  lte(e, t) {
    return this.url.searchParams.append(e, `lte.${t}`), this;
  }
  /**
   * Match only rows where `column` matches `pattern` case-sensitively.
   *
   * @param column - The column to filter on
   * @param pattern - The pattern to match with
   */
  like(e, t) {
    return this.url.searchParams.append(e, `like.${t}`), this;
  }
  /**
   * Match only rows where `column` matches all of `patterns` case-sensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  likeAllOf(e, t) {
    return this.url.searchParams.append(e, `like(all).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches any of `patterns` case-sensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  likeAnyOf(e, t) {
    return this.url.searchParams.append(e, `like(any).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches `pattern` case-insensitively.
   *
   * @param column - The column to filter on
   * @param pattern - The pattern to match with
   */
  ilike(e, t) {
    return this.url.searchParams.append(e, `ilike.${t}`), this;
  }
  /**
   * Match only rows where `column` matches all of `patterns` case-insensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  ilikeAllOf(e, t) {
    return this.url.searchParams.append(e, `ilike(all).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` matches any of `patterns` case-insensitively.
   *
   * @param column - The column to filter on
   * @param patterns - The patterns to match with
   */
  ilikeAnyOf(e, t) {
    return this.url.searchParams.append(e, `ilike(any).{${t.join(",")}}`), this;
  }
  /**
   * Match only rows where `column` IS `value`.
   *
   * For non-boolean columns, this is only relevant for checking if the value of
   * `column` is NULL by setting `value` to `null`.
   *
   * For boolean columns, you can also set `value` to `true` or `false` and it
   * will behave the same way as `.eq()`.
   *
   * @param column - The column to filter on
   * @param value - The value to filter with
   */
  is(e, t) {
    return this.url.searchParams.append(e, `is.${t}`), this;
  }
  /**
   * Match only rows where `column` is included in the `values` array.
   *
   * @param column - The column to filter on
   * @param values - The values array to filter with
   */
  in(e, t) {
    const s = Array.from(new Set(t)).map((r) => typeof r == "string" && new RegExp("[,()]").test(r) ? `"${r}"` : `${r}`).join(",");
    return this.url.searchParams.append(e, `in.(${s})`), this;
  }
  /**
   * Only relevant for jsonb, array, and range columns. Match only rows where
   * `column` contains every element appearing in `value`.
   *
   * @param column - The jsonb, array, or range column to filter on
   * @param value - The jsonb, array, or range value to filter with
   */
  contains(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `cs.${t}`) : Array.isArray(t) ? this.url.searchParams.append(e, `cs.{${t.join(",")}}`) : this.url.searchParams.append(e, `cs.${JSON.stringify(t)}`), this;
  }
  /**
   * Only relevant for jsonb, array, and range columns. Match only rows where
   * every element appearing in `column` is contained by `value`.
   *
   * @param column - The jsonb, array, or range column to filter on
   * @param value - The jsonb, array, or range value to filter with
   */
  containedBy(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `cd.${t}`) : Array.isArray(t) ? this.url.searchParams.append(e, `cd.{${t.join(",")}}`) : this.url.searchParams.append(e, `cd.${JSON.stringify(t)}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is greater than any element in `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeGt(e, t) {
    return this.url.searchParams.append(e, `sr.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is either contained in `range` or greater than any element in
   * `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeGte(e, t) {
    return this.url.searchParams.append(e, `nxl.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is less than any element in `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeLt(e, t) {
    return this.url.searchParams.append(e, `sl.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where every element in
   * `column` is either contained in `range` or less than any element in
   * `range`.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeLte(e, t) {
    return this.url.searchParams.append(e, `nxr.${t}`), this;
  }
  /**
   * Only relevant for range columns. Match only rows where `column` is
   * mutually exclusive to `range` and there can be no element between the two
   * ranges.
   *
   * @param column - The range column to filter on
   * @param range - The range to filter with
   */
  rangeAdjacent(e, t) {
    return this.url.searchParams.append(e, `adj.${t}`), this;
  }
  /**
   * Only relevant for array and range columns. Match only rows where
   * `column` and `value` have an element in common.
   *
   * @param column - The array or range column to filter on
   * @param value - The array or range value to filter with
   */
  overlaps(e, t) {
    return typeof t == "string" ? this.url.searchParams.append(e, `ov.${t}`) : this.url.searchParams.append(e, `ov.{${t.join(",")}}`), this;
  }
  /**
   * Only relevant for text and tsvector columns. Match only rows where
   * `column` matches the query string in `query`.
   *
   * @param column - The text or tsvector column to filter on
   * @param query - The query text to match with
   * @param options - Named parameters
   * @param options.config - The text search configuration to use
   * @param options.type - Change how the `query` text is interpreted
   */
  textSearch(e, t, { config: s, type: r } = {}) {
    let n = "";
    r === "plain" ? n = "pl" : r === "phrase" ? n = "ph" : r === "websearch" && (n = "w");
    const o = s === void 0 ? "" : `(${s})`;
    return this.url.searchParams.append(e, `${n}fts${o}.${t}`), this;
  }
  /**
   * Match only rows where each column in `query` keys is equal to its
   * associated value. Shorthand for multiple `.eq()`s.
   *
   * @param query - The object to filter with, with column names as keys mapped
   * to their filter values
   */
  match(e) {
    return Object.entries(e).forEach(([t, s]) => {
      this.url.searchParams.append(t, `eq.${s}`);
    }), this;
  }
  /**
   * Match only rows which doesn't satisfy the filter.
   *
   * Unlike most filters, `opearator` and `value` are used as-is and need to
   * follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure they are properly sanitized.
   *
   * @param column - The column to filter on
   * @param operator - The operator to be negated to filter with, following
   * PostgREST syntax
   * @param value - The value to filter with, following PostgREST syntax
   */
  not(e, t, s) {
    return this.url.searchParams.append(e, `not.${t}.${s}`), this;
  }
  /**
   * Match only rows which satisfy at least one of the filters.
   *
   * Unlike most filters, `filters` is used as-is and needs to follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure it's properly sanitized.
   *
   * It's currently not possible to do an `.or()` filter across multiple tables.
   *
   * @param filters - The filters to use, following PostgREST syntax
   * @param options - Named parameters
   * @param options.referencedTable - Set this to filter on referenced tables
   * instead of the parent table
   * @param options.foreignTable - Deprecated, use `referencedTable` instead
   */
  or(e, { foreignTable: t, referencedTable: s = t } = {}) {
    const r = s ? `${s}.or` : "or";
    return this.url.searchParams.append(r, `(${e})`), this;
  }
  /**
   * Match only rows which satisfy the filter. This is an escape hatch - you
   * should use the specific filter methods wherever possible.
   *
   * Unlike most filters, `opearator` and `value` are used as-is and need to
   * follow [PostgREST
   * syntax](https://postgrest.org/en/stable/api.html#operators). You also need
   * to make sure they are properly sanitized.
   *
   * @param column - The column to filter on
   * @param operator - The operator to filter with, following PostgREST syntax
   * @param value - The value to filter with, following PostgREST syntax
   */
  filter(e, t, s) {
    return this.url.searchParams.append(e, `${t}.${s}`), this;
  }
};
Ue.default = Nr;
var Ur = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Ze, "__esModule", { value: !0 });
const Te = Ur(Ue);
let Fr = class {
  constructor(e, { headers: t = {}, schema: s, fetch: r }) {
    this.url = e, this.headers = t, this.schema = s, this.fetch = r;
  }
  /**
   * Perform a SELECT query on the table or view.
   *
   * @param columns - The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`
   *
   * @param options - Named parameters
   *
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   *
   * @param options.count - Count algorithm to use to count rows in the table or view.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  select(e, { head: t = !1, count: s } = {}) {
    const r = t ? "HEAD" : "GET";
    let n = !1;
    const o = (e ?? "*").split("").map((a) => /\s/.test(a) && !n ? "" : (a === '"' && (n = !n), a)).join("");
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new Te.default({
      method: r,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an INSERT into the table or view.
   *
   * By default, inserted rows are not returned. To return it, chain the call
   * with `.select()`.
   *
   * @param values - The values to insert. Pass an object to insert a single row
   * or an array to insert multiple rows.
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count inserted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   *
   * @param options.defaultToNull - Make missing fields default to `null`.
   * Otherwise, use the default value for the column. Only applies for bulk
   * inserts.
   */
  insert(e, { count: t, defaultToNull: s = !0 } = {}) {
    const r = "POST", n = [];
    if (this.headers.Prefer && n.push(this.headers.Prefer), t && n.push(`count=${t}`), s || n.push("missing=default"), this.headers.Prefer = n.join(","), Array.isArray(e)) {
      const o = e.reduce((a, l) => a.concat(Object.keys(l)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((l) => `"${l}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new Te.default({
      method: r,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an UPSERT on the table or view. Depending on the column(s) passed
   * to `onConflict`, `.upsert()` allows you to perform the equivalent of
   * `.insert()` if a row with the corresponding `onConflict` columns doesn't
   * exist, or if it does exist, perform an alternative action depending on
   * `ignoreDuplicates`.
   *
   * By default, upserted rows are not returned. To return it, chain the call
   * with `.select()`.
   *
   * @param values - The values to upsert with. Pass an object to upsert a
   * single row or an array to upsert multiple rows.
   *
   * @param options - Named parameters
   *
   * @param options.onConflict - Comma-separated UNIQUE column(s) to specify how
   * duplicate rows are determined. Two rows are duplicates if all the
   * `onConflict` columns are equal.
   *
   * @param options.ignoreDuplicates - If `true`, duplicate rows are ignored. If
   * `false`, duplicate rows are merged with existing rows.
   *
   * @param options.count - Count algorithm to use to count upserted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   *
   * @param options.defaultToNull - Make missing fields default to `null`.
   * Otherwise, use the default value for the column. This only applies when
   * inserting new rows, not when merging with existing rows under
   * `ignoreDuplicates: false`. This also only applies when doing bulk upserts.
   */
  upsert(e, { onConflict: t, ignoreDuplicates: s = !1, count: r, defaultToNull: n = !0 } = {}) {
    const o = "POST", a = [`resolution=${s ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), r && a.push(`count=${r}`), n || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const l = e.reduce((c, u) => c.concat(Object.keys(u)), []);
      if (l.length > 0) {
        const c = [...new Set(l)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", c.join(","));
      }
    }
    return new Te.default({
      method: o,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform an UPDATE on the table or view.
   *
   * By default, updated rows are not returned. To return it, chain the call
   * with `.select()` after filters.
   *
   * @param values - The values to update with
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count updated rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  update(e, { count: t } = {}) {
    const s = "PATCH", r = [];
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new Te.default({
      method: s,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      body: e,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
  /**
   * Perform a DELETE on the table or view.
   *
   * By default, deleted rows are not returned. To return it, chain the call
   * with `.select()` after filters.
   *
   * @param options - Named parameters
   *
   * @param options.count - Count algorithm to use to count deleted rows.
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  delete({ count: e } = {}) {
    const t = "DELETE", s = [];
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new Te.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Ze.default = Fr;
var rt = {}, nt = {};
Object.defineProperty(nt, "__esModule", { value: !0 });
nt.version = void 0;
nt.version = "0.0.0-automated";
Object.defineProperty(rt, "__esModule", { value: !0 });
rt.DEFAULT_HEADERS = void 0;
const Mr = nt;
rt.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Mr.version}` };
var xs = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Ut, "__esModule", { value: !0 });
const Br = xs(Ze), qr = xs(Ue), zr = rt;
let Hr = class Os {
  // TODO: Add back shouldThrowOnError once we figure out the typings
  /**
   * Creates a PostgREST client.
   *
   * @param url - URL of the PostgREST endpoint
   * @param options - Named parameters
   * @param options.headers - Custom headers
   * @param options.schema - Postgres schema to switch to
   * @param options.fetch - Custom fetch
   */
  constructor(e, { headers: t = {}, schema: s, fetch: r } = {}) {
    this.url = e, this.headers = Object.assign(Object.assign({}, zr.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new Br.default(t, {
      headers: Object.assign({}, this.headers),
      schema: this.schemaName,
      fetch: this.fetch
    });
  }
  /**
   * Select a schema to query or perform an function (rpc) call.
   *
   * The schema needs to be on the list of exposed schemas inside Supabase.
   *
   * @param schema - The schema to query
   */
  schema(e) {
    return new Os(this.url, {
      headers: this.headers,
      schema: e,
      fetch: this.fetch
    });
  }
  /**
   * Perform a function call.
   *
   * @param fn - The function name to call
   * @param args - The arguments to pass to the function call
   * @param options - Named parameters
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   * @param options.get - When set to `true`, the function will be called with
   * read-only access mode.
   * @param options.count - Count algorithm to use to count rows returned by the
   * function. Only applicable for [set-returning
   * functions](https://www.postgresql.org/docs/current/functions-srf.html).
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  rpc(e, t = {}, { head: s = !1, get: r = !1, count: n } = {}) {
    let o;
    const a = new URL(`${this.url}/rpc/${e}`);
    let l;
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (o = "POST", l = t);
    const c = Object.assign({}, this.headers);
    return n && (c.Prefer = `count=${n}`), new qr.default({
      method: o,
      url: a,
      headers: c,
      schema: this.schemaName,
      body: l,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Ut.default = Hr;
var Ae = M && M.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(F, "__esModule", { value: !0 });
F.PostgrestError = F.PostgrestBuilder = F.PostgrestTransformBuilder = F.PostgrestFilterBuilder = F.PostgrestQueryBuilder = F.PostgrestClient = void 0;
const Ls = Ae(Ut);
F.PostgrestClient = Ls.default;
const js = Ae(Ze);
F.PostgrestQueryBuilder = js.default;
const Rs = Ae(Ue);
F.PostgrestFilterBuilder = Rs.default;
const $s = Ae(et);
F.PostgrestTransformBuilder = $s.default;
const Ds = Ae(tt);
F.PostgrestBuilder = Ds.default;
const Ns = Ae(st);
F.PostgrestError = Ns.default;
var Kr = F.default = {
  PostgrestClient: Ls.default,
  PostgrestQueryBuilder: js.default,
  PostgrestFilterBuilder: Rs.default,
  PostgrestTransformBuilder: $s.default,
  PostgrestBuilder: Ds.default,
  PostgrestError: Ns.default
};
const {
  PostgrestClient: Wr,
  PostgrestQueryBuilder: Io,
  PostgrestFilterBuilder: Ao,
  PostgrestTransformBuilder: To,
  PostgrestBuilder: Po,
  PostgrestError: xo
} = Kr;
function Vr() {
  if (typeof WebSocket < "u")
    return WebSocket;
  if (typeof global.WebSocket < "u")
    return global.WebSocket;
  if (typeof window.WebSocket < "u")
    return window.WebSocket;
  if (typeof self.WebSocket < "u")
    return self.WebSocket;
  throw new Error("`WebSocket` is not supported in this environment");
}
const Gr = Vr(), Jr = "2.11.15", Yr = `realtime-js/${Jr}`, Xr = "1.0.0", Us = 1e4, Qr = 1e3;
var xe;
(function(i) {
  i[i.connecting = 0] = "connecting", i[i.open = 1] = "open", i[i.closing = 2] = "closing", i[i.closed = 3] = "closed";
})(xe || (xe = {}));
var $;
(function(i) {
  i.closed = "closed", i.errored = "errored", i.joined = "joined", i.joining = "joining", i.leaving = "leaving";
})($ || ($ = {}));
var z;
(function(i) {
  i.close = "phx_close", i.error = "phx_error", i.join = "phx_join", i.reply = "phx_reply", i.leave = "phx_leave", i.access_token = "access_token";
})(z || (z = {}));
var vt;
(function(i) {
  i.websocket = "websocket";
})(vt || (vt = {}));
var he;
(function(i) {
  i.Connecting = "connecting", i.Open = "open", i.Closing = "closing", i.Closed = "closed";
})(he || (he = {}));
class Zr {
  constructor() {
    this.HEADER_LENGTH = 1;
  }
  decode(e, t) {
    return e.constructor === ArrayBuffer ? t(this._binaryDecode(e)) : t(typeof e == "string" ? JSON.parse(e) : {});
  }
  _binaryDecode(e) {
    const t = new DataView(e), s = new TextDecoder();
    return this._decodeBroadcast(e, t, s);
  }
  _decodeBroadcast(e, t, s) {
    const r = t.getUint8(1), n = t.getUint8(2);
    let o = this.HEADER_LENGTH + 2;
    const a = s.decode(e.slice(o, o + r));
    o = o + r;
    const l = s.decode(e.slice(o, o + n));
    o = o + n;
    const c = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: l, payload: c };
  }
}
class Fs {
  constructor(e, t) {
    this.callback = e, this.timerCalc = t, this.timer = void 0, this.tries = 0, this.callback = e, this.timerCalc = t;
  }
  reset() {
    this.tries = 0, clearTimeout(this.timer);
  }
  // Cancels any previous scheduleTimeout and schedules callback
  scheduleTimeout() {
    clearTimeout(this.timer), this.timer = setTimeout(() => {
      this.tries = this.tries + 1, this.callback();
    }, this.timerCalc(this.tries + 1));
  }
}
var T;
(function(i) {
  i.abstime = "abstime", i.bool = "bool", i.date = "date", i.daterange = "daterange", i.float4 = "float4", i.float8 = "float8", i.int2 = "int2", i.int4 = "int4", i.int4range = "int4range", i.int8 = "int8", i.int8range = "int8range", i.json = "json", i.jsonb = "jsonb", i.money = "money", i.numeric = "numeric", i.oid = "oid", i.reltime = "reltime", i.text = "text", i.time = "time", i.timestamp = "timestamp", i.timestamptz = "timestamptz", i.timetz = "timetz", i.tsrange = "tsrange", i.tstzrange = "tstzrange";
})(T || (T = {}));
const is = (i, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((n, o) => (n[o] = en(o, i, e, r), n), {});
}, en = (i, e, t, s) => {
  const r = e.find((a) => a.name === i), n = r == null ? void 0 : r.type, o = t[i];
  return n && !s.includes(n) ? Ms(n, o) : yt(o);
}, Ms = (i, e) => {
  if (i.charAt(0) === "_") {
    const t = i.slice(1, i.length);
    return nn(e, t);
  }
  switch (i) {
    case T.bool:
      return tn(e);
    case T.float4:
    case T.float8:
    case T.int2:
    case T.int4:
    case T.int8:
    case T.numeric:
    case T.oid:
      return sn(e);
    case T.json:
    case T.jsonb:
      return rn(e);
    case T.timestamp:
      return on(e);
    case T.abstime:
    case T.date:
    case T.daterange:
    case T.int4range:
    case T.int8range:
    case T.money:
    case T.reltime:
    case T.text:
    case T.time:
    case T.timestamptz:
    case T.timetz:
    case T.tsrange:
    case T.tstzrange:
      return yt(e);
    default:
      return yt(e);
  }
}, yt = (i) => i, tn = (i) => {
  switch (i) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return i;
  }
}, sn = (i) => {
  if (typeof i == "string") {
    const e = parseFloat(i);
    if (!Number.isNaN(e))
      return e;
  }
  return i;
}, rn = (i) => {
  if (typeof i == "string")
    try {
      return JSON.parse(i);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), i;
    }
  return i;
}, nn = (i, e) => {
  if (typeof i != "string")
    return i;
  const t = i.length - 1, s = i[t];
  if (i[0] === "{" && s === "}") {
    let n;
    const o = i.slice(1, t);
    try {
      n = JSON.parse("[" + o + "]");
    } catch {
      n = o ? o.split(",") : [];
    }
    return n.map((a) => Ms(e, a));
  }
  return i;
}, on = (i) => typeof i == "string" ? i.replace(" ", "T") : i, Bs = (i) => {
  let e = i;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class lt {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = Us) {
    this.channel = e, this.event = t, this.payload = s, this.timeout = r, this.sent = !1, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
  }
  resend(e) {
    this.timeout = e, this._cancelRefEvent(), this.ref = "", this.refEvent = null, this.receivedResp = null, this.sent = !1, this.send();
  }
  send() {
    this._hasReceived("timeout") || (this.startTimeout(), this.sent = !0, this.channel.socket.push({
      topic: this.channel.topic,
      event: this.event,
      payload: this.payload,
      ref: this.ref,
      join_ref: this.channel._joinRef()
    }));
  }
  updatePayload(e) {
    this.payload = Object.assign(Object.assign({}, this.payload), e);
  }
  receive(e, t) {
    var s;
    return this._hasReceived(e) && t((s = this.receivedResp) === null || s === void 0 ? void 0 : s.response), this.recHooks.push({ status: e, callback: t }), this;
  }
  startTimeout() {
    if (this.timeoutTimer)
      return;
    this.ref = this.channel.socket._makeRef(), this.refEvent = this.channel._replyEventName(this.ref);
    const e = (t) => {
      this._cancelRefEvent(), this._cancelTimeout(), this.receivedResp = t, this._matchReceive(t);
    };
    this.channel._on(this.refEvent, {}, e), this.timeoutTimer = setTimeout(() => {
      this.trigger("timeout", {});
    }, this.timeout);
  }
  trigger(e, t) {
    this.refEvent && this.channel._trigger(this.refEvent, { status: e, response: t });
  }
  destroy() {
    this._cancelRefEvent(), this._cancelTimeout();
  }
  _cancelRefEvent() {
    this.refEvent && this.channel._off(this.refEvent, {});
  }
  _cancelTimeout() {
    clearTimeout(this.timeoutTimer), this.timeoutTimer = void 0;
  }
  _matchReceive({ status: e, response: t }) {
    this.recHooks.filter((s) => s.status === e).forEach((s) => s.callback(t));
  }
  _hasReceived(e) {
    return this.receivedResp && this.receivedResp.status === e;
  }
}
var os;
(function(i) {
  i.SYNC = "sync", i.JOIN = "join", i.LEAVE = "leave";
})(os || (os = {}));
class Oe {
  /**
   * Initializes the Presence.
   *
   * @param channel - The RealtimeChannel
   * @param opts - The options,
   *        for example `{events: {state: 'state', diff: 'diff'}}`
   */
  constructor(e, t) {
    this.channel = e, this.state = {}, this.pendingDiffs = [], this.joinRef = null, this.caller = {
      onJoin: () => {
      },
      onLeave: () => {
      },
      onSync: () => {
      }
    };
    const s = (t == null ? void 0 : t.events) || {
      state: "presence_state",
      diff: "presence_diff"
    };
    this.channel._on(s.state, {}, (r) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = Oe.syncState(this.state, r, n, o), this.pendingDiffs.forEach((l) => {
        this.state = Oe.syncDiff(this.state, l, n, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = Oe.syncDiff(this.state, r, n, o), a());
    }), this.onJoin((r, n, o) => {
      this.channel._trigger("presence", {
        event: "join",
        key: r,
        currentPresences: n,
        newPresences: o
      });
    }), this.onLeave((r, n, o) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: r,
        currentPresences: n,
        leftPresences: o
      });
    }), this.onSync(() => {
      this.channel._trigger("presence", { event: "sync" });
    });
  }
  /**
   * Used to sync the list of presences on the server with the
   * client's state.
   *
   * An optional `onJoin` and `onLeave` callback can be provided to
   * react to changes in the client's local presences across
   * disconnects and reconnects with the server.
   *
   * @internal
   */
  static syncState(e, t, s, r) {
    const n = this.cloneDeep(e), o = this.transformState(t), a = {}, l = {};
    return this.map(n, (c, u) => {
      o[c] || (l[c] = u);
    }), this.map(o, (c, u) => {
      const d = n[c];
      if (d) {
        const h = u.map((m) => m.presence_ref), f = d.map((m) => m.presence_ref), g = u.filter((m) => f.indexOf(m.presence_ref) < 0), v = d.filter((m) => h.indexOf(m.presence_ref) < 0);
        g.length > 0 && (a[c] = g), v.length > 0 && (l[c] = v);
      } else
        a[c] = u;
    }), this.syncDiff(n, { joins: a, leaves: l }, s, r);
  }
  /**
   * Used to sync a diff of presence join and leave events from the
   * server, as they happen.
   *
   * Like `syncState`, `syncDiff` accepts optional `onJoin` and
   * `onLeave` callbacks to react to a user joining or leaving from a
   * device.
   *
   * @internal
   */
  static syncDiff(e, t, s, r) {
    const { joins: n, leaves: o } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return s || (s = () => {
    }), r || (r = () => {
    }), this.map(n, (a, l) => {
      var c;
      const u = (c = e[a]) !== null && c !== void 0 ? c : [];
      if (e[a] = this.cloneDeep(l), u.length > 0) {
        const d = e[a].map((f) => f.presence_ref), h = u.filter((f) => d.indexOf(f.presence_ref) < 0);
        e[a].unshift(...h);
      }
      s(a, u, l);
    }), this.map(o, (a, l) => {
      let c = e[a];
      if (!c)
        return;
      const u = l.map((d) => d.presence_ref);
      c = c.filter((d) => u.indexOf(d.presence_ref) < 0), e[a] = c, r(a, c, l), c.length === 0 && delete e[a];
    }), e;
  }
  /** @internal */
  static map(e, t) {
    return Object.getOwnPropertyNames(e).map((s) => t(s, e[s]));
  }
  /**
   * Remove 'metas' key
   * Change 'phx_ref' to 'presence_ref'
   * Remove 'phx_ref' and 'phx_ref_prev'
   *
   * @example
   * // returns {
   *  abc123: [
   *    { presence_ref: '2', user_id: 1 },
   *    { presence_ref: '3', user_id: 2 }
   *  ]
   * }
   * RealtimePresence.transformState({
   *  abc123: {
   *    metas: [
   *      { phx_ref: '2', phx_ref_prev: '1' user_id: 1 },
   *      { phx_ref: '3', user_id: 2 }
   *    ]
   *  }
   * })
   *
   * @internal
   */
  static transformState(e) {
    return e = this.cloneDeep(e), Object.getOwnPropertyNames(e).reduce((t, s) => {
      const r = e[s];
      return "metas" in r ? t[s] = r.metas.map((n) => (n.presence_ref = n.phx_ref, delete n.phx_ref, delete n.phx_ref_prev, n)) : t[s] = r, t;
    }, {});
  }
  /** @internal */
  static cloneDeep(e) {
    return JSON.parse(JSON.stringify(e));
  }
  /** @internal */
  onJoin(e) {
    this.caller.onJoin = e;
  }
  /** @internal */
  onLeave(e) {
    this.caller.onLeave = e;
  }
  /** @internal */
  onSync(e) {
    this.caller.onSync = e;
  }
  /** @internal */
  inPendingSyncState() {
    return !this.joinRef || this.joinRef !== this.channel._joinRef();
  }
}
var as;
(function(i) {
  i.ALL = "*", i.INSERT = "INSERT", i.UPDATE = "UPDATE", i.DELETE = "DELETE";
})(as || (as = {}));
var ls;
(function(i) {
  i.BROADCAST = "broadcast", i.PRESENCE = "presence", i.POSTGRES_CHANGES = "postgres_changes", i.SYSTEM = "system";
})(ls || (ls = {}));
var G;
(function(i) {
  i.SUBSCRIBED = "SUBSCRIBED", i.TIMED_OUT = "TIMED_OUT", i.CLOSED = "CLOSED", i.CHANNEL_ERROR = "CHANNEL_ERROR";
})(G || (G = {}));
class Ft {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = $.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new lt(this, z.join, this.params, this.timeout), this.rejoinTimer = new Fs(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = $.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = $.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = $.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = $.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(z.reply, {}, (r, n) => {
      this._trigger(this._replyEventName(n), r);
    }), this.presence = new Oe(this), this.broadcastEndpointURL = Bs(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == $.closed) {
      const { config: { broadcast: n, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(G.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(G.CLOSED));
      const l = {}, c = {
        broadcast: n,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((u) => u.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: c }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(G.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, g = [];
          for (let v = 0; v < f; v++) {
            const m = h[v], { filter: { event: b, schema: E, table: y, filter: w } } = m, P = u && u[v];
            if (P && P.event === b && P.schema === E && P.table === y && P.filter === w)
              g.push(Object.assign(Object.assign({}, m), { id: P.id }));
            else {
              this.unsubscribe(), this.state = $.errored, e == null || e(G.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = g, e && e(G.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = $.errored, e == null || e(G.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(G.TIMED_OUT);
      });
    }
    return this;
  }
  presenceState() {
    return this.presence.state;
  }
  async track(e, t = {}) {
    return await this.send({
      type: "presence",
      event: "track",
      payload: e
    }, t.timeout || this.timeout);
  }
  async untrack(e = {}) {
    return await this.send({
      type: "presence",
      event: "untrack"
    }, e);
  }
  on(e, t, s) {
    return this._on(e, t, s);
  }
  /**
   * Sends a message into the channel.
   *
   * @param args Arguments to send to channel
   * @param args.type The type of event to send
   * @param args.event The name of the event being sent
   * @param args.payload Payload to be sent
   * @param opts Options to be used during the send process
   */
  async send(e, t = {}) {
    var s, r;
    if (!this._canPush() && e.type === "broadcast") {
      const { event: n, payload: o } = e, l = {
        method: "POST",
        headers: {
          Authorization: this.socket.accessTokenValue ? `Bearer ${this.socket.accessTokenValue}` : "",
          apikey: this.socket.apiKey ? this.socket.apiKey : "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [
            {
              topic: this.subTopic,
              event: n,
              payload: o,
              private: this.private
            }
          ]
        })
      };
      try {
        const c = await this._fetchWithTimeout(this.broadcastEndpointURL, l, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((r = c.body) === null || r === void 0 ? void 0 : r.cancel()), c.ok ? "ok" : "error";
      } catch (c) {
        return c.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((n) => {
        var o, a, l;
        const c = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((l = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || l === void 0) && l.ack) && n("ok"), c.receive("ok", () => n("ok")), c.receive("error", () => n("error")), c.receive("timeout", () => n("timed out"));
      });
  }
  updateJoinPayload(e) {
    this.joinPush.updatePayload(e);
  }
  /**
   * Leaves the channel.
   *
   * Unsubscribes from server events, and instructs channel to terminate on server.
   * Triggers onClose() hooks.
   *
   * To receive leave acknowledgements, use the a `receive` hook to bind to the server ack, ie:
   * channel.unsubscribe().receive("ok", () => alert("left!") )
   */
  unsubscribe(e = this.timeout) {
    this.state = $.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(z.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let s = null;
    return new Promise((r) => {
      s = new lt(this, z.leave, {}, e), s.receive("ok", () => {
        t(), r("ok");
      }).receive("timeout", () => {
        t(), r("timed out");
      }).receive("error", () => {
        r("error");
      }), s.send(), this._canPush() || s.trigger("ok", {});
    }).finally(() => {
      s == null || s.destroy();
    });
  }
  /**
   * Teardown the channel.
   *
   * Destroys and stops related timers.
   */
  teardown() {
    this.pushBuffer.forEach((e) => e.destroy()), this.rejoinTimer && clearTimeout(this.rejoinTimer.timer), this.joinPush.destroy();
  }
  /** @internal */
  async _fetchWithTimeout(e, t, s) {
    const r = new AbortController(), n = setTimeout(() => r.abort(), s), o = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: r.signal }));
    return clearTimeout(n), o;
  }
  /** @internal */
  _push(e, t, s = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let r = new lt(this, e, t, s);
    return this._canPush() ? r.send() : (r.startTimeout(), this.pushBuffer.push(r)), r;
  }
  /**
   * Overridable message hook
   *
   * Receives all events for specialized message handling before dispatching to the channel callbacks.
   * Must return the payload, modified or unmodified.
   *
   * @internal
   */
  _onMessage(e, t, s) {
    return t;
  }
  /** @internal */
  _isMember(e) {
    return this.topic === e;
  }
  /** @internal */
  _joinRef() {
    return this.joinPush.ref;
  }
  /** @internal */
  _trigger(e, t, s) {
    var r, n;
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: c, join: u } = z;
    if (s && [a, l, c, u].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let h = this._onMessage(o, t, s);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var g, v, m;
      return ((g = f.filter) === null || g === void 0 ? void 0 : g.event) === "*" || ((m = (v = f.filter) === null || v === void 0 ? void 0 : v.event) === null || m === void 0 ? void 0 : m.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(h, s)) : (n = this.bindings[o]) === null || n === void 0 || n.filter((f) => {
      var g, v, m, b, E, y;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const w = f.id, P = (g = f.filter) === null || g === void 0 ? void 0 : g.event;
          return w && ((v = t.ids) === null || v === void 0 ? void 0 : v.includes(w)) && (P === "*" || (P == null ? void 0 : P.toLocaleLowerCase()) === ((m = t.data) === null || m === void 0 ? void 0 : m.type.toLocaleLowerCase()));
        } else {
          const w = (E = (b = f == null ? void 0 : f.filter) === null || b === void 0 ? void 0 : b.event) === null || E === void 0 ? void 0 : E.toLocaleLowerCase();
          return w === "*" || w === ((y = t == null ? void 0 : t.event) === null || y === void 0 ? void 0 : y.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const g = h.data, { schema: v, table: m, commit_timestamp: b, type: E, errors: y } = g;
        h = Object.assign(Object.assign({}, {
          schema: v,
          table: m,
          commit_timestamp: b,
          eventType: E,
          new: {},
          old: {},
          errors: y
        }), this._getPayloadRecords(g));
      }
      f.callback(h, s);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === $.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === $.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === $.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === $.leaving;
  }
  /** @internal */
  _replyEventName(e) {
    return `chan_reply_${e}`;
  }
  /** @internal */
  _on(e, t, s) {
    const r = e.toLocaleLowerCase(), n = {
      type: r,
      filter: t,
      callback: s
    };
    return this.bindings[r] ? this.bindings[r].push(n) : this.bindings[r] = [n], this;
  }
  /** @internal */
  _off(e, t) {
    const s = e.toLocaleLowerCase();
    return this.bindings[s] = this.bindings[s].filter((r) => {
      var n;
      return !(((n = r.type) === null || n === void 0 ? void 0 : n.toLocaleLowerCase()) === s && Ft.isEqual(r.filter, t));
    }), this;
  }
  /** @internal */
  static isEqual(e, t) {
    if (Object.keys(e).length !== Object.keys(t).length)
      return !1;
    for (const s in e)
      if (e[s] !== t[s])
        return !1;
    return !0;
  }
  /** @internal */
  _rejoinUntilConnected() {
    this.rejoinTimer.scheduleTimeout(), this.socket.isConnected() && this._rejoin();
  }
  /**
   * Registers a callback that will be executed when the channel closes.
   *
   * @internal
   */
  _onClose(e) {
    this._on(z.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(z.error, {}, (t) => e(t));
  }
  /**
   * Returns `true` if the socket is connected and the channel has been joined.
   *
   * @internal
   */
  _canPush() {
    return this.socket.isConnected() && this._isJoined();
  }
  /** @internal */
  _rejoin(e = this.timeout) {
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = $.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = is(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = is(e.columns, e.old_record)), t;
  }
}
const cs = () => {
}, an = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class ln {
  /**
   * Initializes the Socket.
   *
   * @param endPoint The string WebSocket endpoint, ie, "ws://example.com/socket", "wss://example.com", "/socket" (inherited host & protocol)
   * @param httpEndpoint The string HTTP endpoint, ie, "https://example.com", "/" (inherited host & protocol)
   * @param options.transport The Websocket Transport, for example WebSocket. This can be a custom implementation
   * @param options.timeout The default timeout in milliseconds to trigger push timeouts.
   * @param options.params The optional params to pass when connecting.
   * @param options.headers Deprecated: headers cannot be set on websocket connections and this option will be removed in the future.
   * @param options.heartbeatIntervalMs The millisec interval to send a heartbeat message.
   * @param options.logger The optional function for specialized logging, ie: logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
   * @param options.logLevel Sets the log level for Realtime
   * @param options.encode The function to encode outgoing messages. Defaults to JSON: (payload, callback) => callback(JSON.stringify(payload))
   * @param options.decode The function to decode incoming messages. Defaults to Serializer's decode.
   * @param options.reconnectAfterMs he optional function that returns the millsec reconnect interval. Defaults to stepped backoff off.
   * @param options.worker Use Web Worker to set a side flow. Defaults to false.
   * @param options.workerUrl The URL of the worker script. Defaults to https://realtime.supabase.com/worker.js that includes a heartbeat event call to keep the connection alive.
   */
  constructor(e, t) {
    var s;
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = Us, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = cs, this.ref = 0, this.logger = cs, this.conn = null, this.sendBuffer = [], this.serializer = new Zr(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (n) => {
      let o;
      return n ? o = n : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => Ie).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${vt.websocket}`, this.httpEndpoint = Bs(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (n) => [1e3, 2e3, 5e3, 1e4][n - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (n, o) => o(JSON.stringify(n)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Fs(async () => {
      this.disconnect(), this.connect();
    }, this.reconnectAfterMs), this.fetch = this._resolveFetch(t == null ? void 0 : t.fetch), t != null && t.worker) {
      if (typeof window < "u" && !window.Worker)
        throw new Error("Web Worker is not supported");
      this.worker = (t == null ? void 0 : t.worker) || !1, this.workerUrl = t == null ? void 0 : t.workerUrl;
    }
    this.accessToken = (t == null ? void 0 : t.accessToken) || null;
  }
  /**
   * Connects the socket, unless already connected.
   */
  connect() {
    if (!this.conn) {
      if (this.transport || (this.transport = Gr), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Xr }));
  }
  /**
   * Disconnects the socket.
   *
   * @param code A numeric status code to send on disconnect.
   * @param reason A custom reason for the disconnect.
   */
  disconnect(e, t) {
    this.conn && (this.conn.onclose = function() {
    }, e ? this.conn.close(e, t ?? "") : this.conn.close(), this.conn = null, this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.reset(), this.channels.forEach((s) => s.teardown()));
  }
  /**
   * Returns all created channels
   */
  getChannels() {
    return this.channels;
  }
  /**
   * Unsubscribes and removes a single channel
   * @param channel A RealtimeChannel instance
   */
  async removeChannel(e) {
    const t = await e.unsubscribe();
    return this.channels.length === 0 && this.disconnect(), t;
  }
  /**
   * Unsubscribes and removes all channels
   */
  async removeAllChannels() {
    const e = await Promise.all(this.channels.map((t) => t.unsubscribe()));
    return this.channels = [], this.disconnect(), e;
  }
  /**
   * Logs the message.
   *
   * For customized logging, `this.logger` can be overridden.
   */
  log(e, t, s) {
    this.logger(e, t, s);
  }
  /**
   * Returns the current state of the socket.
   */
  connectionState() {
    switch (this.conn && this.conn.readyState) {
      case xe.connecting:
        return he.Connecting;
      case xe.open:
        return he.Open;
      case xe.closing:
        return he.Closing;
      default:
        return he.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === he.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((n) => n.topic === s);
    if (r)
      return r;
    {
      const n = new Ft(`realtime:${e}`, t, this);
      return this.channels.push(n), n;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: s, payload: r, ref: n } = e, o = () => {
      this.encode(e, (a) => {
        var l;
        (l = this.conn) === null || l === void 0 || l.send(a);
      });
    };
    this.log("push", `${t} ${s} (${n})`, r), this.isConnected() ? o() : this.sendBuffer.push(o);
  }
  /**
   * Sets the JWT access token used for channel subscription authorization and Realtime RLS.
   *
   * If param is null it will use the `accessToken` callback function or the token set on the client.
   *
   * On callback used, it will set the value of the token internal to the client.
   *
   * @param token A JWT string to override the token set on the client.
   */
  async setAuth(e = null) {
    let t = e || this.accessToken && await this.accessToken() || this.accessTokenValue;
    this.accessTokenValue != t && (this.accessTokenValue = t, this.channels.forEach((s) => {
      const r = {
        access_token: t,
        version: Yr
      };
      t && s.updateJoinPayload(r), s.joinedOnce && s._isJoined() && s._push(z.access_token, {
        access_token: t
      });
    }));
  }
  /**
   * Sends a heartbeat message if the socket is connected.
   */
  async sendHeartbeat() {
    var e;
    if (!this.isConnected()) {
      this.heartbeatCallback("disconnected");
      return;
    }
    if (this.pendingHeartbeatRef) {
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Qr, "hearbeat timeout");
      return;
    }
    this.pendingHeartbeatRef = this._makeRef(), this.push({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: this.pendingHeartbeatRef
    }), this.heartbeatCallback("sent"), await this.setAuth();
  }
  onHeartbeat(e) {
    this.heartbeatCallback = e;
  }
  /**
   * Flushes send buffer
   */
  flushSendBuffer() {
    this.isConnected() && this.sendBuffer.length > 0 && (this.sendBuffer.forEach((e) => e()), this.sendBuffer = []);
  }
  /**
   * Return the next message ref, accounting for overflows
   *
   * @internal
   */
  _makeRef() {
    let e = this.ref + 1;
    return e === this.ref ? this.ref = 0 : this.ref = e, this.ref.toString();
  }
  /**
   * Unsubscribe from channels with the specified topic.
   *
   * @internal
   */
  _leaveOpenTopic(e) {
    let t = this.channels.find((s) => s.topic === e && (s._isJoined() || s._isJoining()));
    t && (this.log("transport", `leaving duplicate topic "${e}"`), t.unsubscribe());
  }
  /**
   * Removes a subscription from the socket.
   *
   * @param channel An open subscription.
   *
   * @internal
   */
  _remove(e) {
    this.channels = this.channels.filter((t) => t.topic !== e.topic);
  }
  /**
   * Sets up connection handlers.
   *
   * @internal
   */
  setupConnection() {
    this.conn && (this.conn.binaryType = "arraybuffer", this.conn.onopen = () => this._onConnOpen(), this.conn.onerror = (e) => this._onConnError(e), this.conn.onmessage = (e) => this._onConnMessage(e), this.conn.onclose = (e) => this._onConnClose(e));
  }
  /** @internal */
  _onConnMessage(e) {
    this.decode(e.data, (t) => {
      let { topic: s, event: r, payload: n, ref: o } = t;
      s === "phoenix" && r === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), o && o === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${n.status || ""} ${s} ${r} ${o && "(" + o + ")" || ""}`, n), Array.from(this.channels).filter((a) => a._isMember(s)).forEach((a) => a._trigger(r, n, o)), this.stateChangeCallbacks.message.forEach((a) => a(t));
    });
  }
  /** @internal */
  _onConnOpen() {
    this.log("transport", `connected to ${this.endpointURL()}`), this.flushSendBuffer(), this.reconnectTimer.reset(), this.worker ? this.workerRef || this._startWorkerHeartbeat() : this._startHeartbeat(), this.stateChangeCallbacks.open.forEach((e) => e());
  }
  /** @internal */
  _startHeartbeat() {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), this.heartbeatIntervalMs);
  }
  /** @internal */
  _startWorkerHeartbeat() {
    this.workerUrl ? this.log("worker", `starting worker for from ${this.workerUrl}`) : this.log("worker", "starting default worker");
    const e = this._workerObjectUrl(this.workerUrl);
    this.workerRef = new Worker(e), this.workerRef.onerror = (t) => {
      this.log("worker", "worker error", t.message), this.workerRef.terminate();
    }, this.workerRef.onmessage = (t) => {
      t.data.event === "keepAlive" && this.sendHeartbeat();
    }, this.workerRef.postMessage({
      event: "start",
      interval: this.heartbeatIntervalMs
    });
  }
  /** @internal */
  _onConnClose(e) {
    this.log("transport", "close", e), this._triggerChanError(), this.heartbeatTimer && clearInterval(this.heartbeatTimer), this.reconnectTimer.scheduleTimeout(), this.stateChangeCallbacks.close.forEach((t) => t(e));
  }
  /** @internal */
  _onConnError(e) {
    this.log("transport", `${e}`), this._triggerChanError(), this.stateChangeCallbacks.error.forEach((t) => t(e));
  }
  /** @internal */
  _triggerChanError() {
    this.channels.forEach((e) => e._trigger(z.error));
  }
  /** @internal */
  _appendParams(e, t) {
    if (Object.keys(t).length === 0)
      return e;
    const s = e.match(/\?/) ? "&" : "?", r = new URLSearchParams(t);
    return `${e}${s}${r}`;
  }
  _workerObjectUrl(e) {
    let t;
    if (e)
      t = e;
    else {
      const s = new Blob([an], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class Mt extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function j(i) {
  return typeof i == "object" && i !== null && "__isStorageError" in i;
}
class cn extends Mt {
  constructor(e, t, s) {
    super(e), this.name = "StorageApiError", this.status = t, this.statusCode = s;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      statusCode: this.statusCode
    };
  }
}
class bt extends Mt {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var un = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const qs = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Ie).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, dn = () => un(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => Ie)).Response : Response;
}), _t = (i) => {
  if (Array.isArray(i))
    return i.map((t) => _t(t));
  if (typeof i == "function" || i !== Object(i))
    return i;
  const e = {};
  return Object.entries(i).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (n) => n.toUpperCase().replace(/[-_]/g, ""));
    e[r] = _t(s);
  }), e;
}, hn = (i) => {
  if (typeof i != "object" || i === null)
    return !1;
  const e = Object.getPrototypeOf(i);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in i) && !(Symbol.iterator in i);
};
var ge = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const ct = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), fn = (i, e, t) => ge(void 0, void 0, void 0, function* () {
  const s = yield dn();
  i instanceof s && !(t != null && t.noResolveJson) ? i.json().then((r) => {
    const n = i.status || 500, o = (r == null ? void 0 : r.statusCode) || n + "";
    e(new cn(ct(r), n, o));
  }).catch((r) => {
    e(new bt(ct(r), r));
  }) : e(new bt(ct(i), i));
}), pn = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" || !s ? r : (hn(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function Fe(i, e, t, s, r, n) {
  return ge(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      i(t, pn(e, s, r, n)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => fn(l, a, s));
    });
  });
}
function Ve(i, e, t, s) {
  return ge(this, void 0, void 0, function* () {
    return Fe(i, "GET", e, t, s);
  });
}
function J(i, e, t, s, r) {
  return ge(this, void 0, void 0, function* () {
    return Fe(i, "POST", e, s, r, t);
  });
}
function wt(i, e, t, s, r) {
  return ge(this, void 0, void 0, function* () {
    return Fe(i, "PUT", e, s, r, t);
  });
}
function gn(i, e, t, s) {
  return ge(this, void 0, void 0, function* () {
    return Fe(i, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function zs(i, e, t, s, r) {
  return ge(this, void 0, void 0, function* () {
    return Fe(i, "DELETE", e, s, r, t);
  });
}
var U = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const mn = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, us = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class vn {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = qs(r);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, r) {
    return U(this, void 0, void 0, function* () {
      try {
        let n;
        const o = Object.assign(Object.assign({}, us), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (n = new FormData(), n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l)), n.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (n = s, n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l))) : (n = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const c = this._removeEmptyFolders(t), u = this._getFinalPath(c), d = yield (e == "PUT" ? wt : J)(this.fetch, `${this.url}/object/${u}`, n, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: c, id: d.Id, fullPath: d.Key },
          error: null
        };
      } catch (n) {
        if (j(n))
          return { data: null, error: n };
        throw n;
      }
    });
  }
  /**
   * Uploads a file to an existing bucket.
   *
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  upload(e, t, s) {
    return U(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("POST", e, t, s);
    });
  }
  /**
   * Upload a file with a token generated from `createSignedUploadUrl`.
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param token The token generated from `createSignedUploadUrl`
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadToSignedUrl(e, t, s, r) {
    return U(this, void 0, void 0, function* () {
      const n = this._removeEmptyFolders(e), o = this._getFinalPath(n), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const c = Object.assign({ upsert: us.upsert }, r), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(c.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", c.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", c.cacheControl)) : (l = s, u["cache-control"] = `max-age=${c.cacheControl}`, u["content-type"] = c.contentType);
        const d = yield wt(this.fetch, a.toString(), l, { headers: u });
        return {
          data: { path: n, fullPath: d.Key },
          error: null
        };
      } catch (l) {
        if (j(l))
          return { data: null, error: l };
        throw l;
      }
    });
  }
  /**
   * Creates a signed upload URL.
   * Signed upload URLs can be used to upload files to the bucket without further authentication.
   * They are valid for 2 hours.
   * @param path The file path, including the current file name. For example `folder/image.png`.
   * @param options.upsert If set to true, allows the file to be overwritten if it already exists.
   */
  createSignedUploadUrl(e, t) {
    return U(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const r = Object.assign({}, this.headers);
        t != null && t.upsert && (r["x-upsert"] = "true");
        const n = yield J(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + n.url), a = o.searchParams.get("token");
        if (!a)
          throw new Mt("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (s) {
        if (j(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Replaces an existing file at the specified path with a new one.
   *
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to update.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  update(e, t, s) {
    return U(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("PUT", e, t, s);
    });
  }
  /**
   * Moves an existing file to a new path in the same bucket.
   *
   * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
   * @param toPath The new file path, including the new file name. For example `folder/image-new.png`.
   * @param options The destination options.
   */
  move(e, t, s) {
    return U(this, void 0, void 0, function* () {
      try {
        return { data: yield J(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (j(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Copies an existing file to a new path in the same bucket.
   *
   * @param fromPath The original file path, including the current file name. For example `folder/image.png`.
   * @param toPath The new file path, including the new file name. For example `folder/image-copy.png`.
   * @param options The destination options.
   */
  copy(e, t, s) {
    return U(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield J(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (r) {
        if (j(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Creates a signed URL. Use a signed URL to share a file for a fixed amount of time.
   *
   * @param path The file path, including the current file name. For example `folder/image.png`.
   * @param expiresIn The number of seconds until the signed URL expires. For example, `60` for a URL which is valid for one minute.
   * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   * @param options.transform Transform the asset before serving it to the client.
   */
  createSignedUrl(e, t, s) {
    return U(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e), n = yield J(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return n = { signedUrl: encodeURI(`${this.url}${n.signedURL}${o}`) }, { data: n, error: null };
      } catch (r) {
        if (j(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Creates multiple signed URLs. Use a signed URL to share a file for a fixed amount of time.
   *
   * @param paths The file paths to be downloaded, including the current file names. For example `['folder/image.png', 'folder2/image2.png']`.
   * @param expiresIn The number of seconds until the signed URLs expire. For example, `60` for URLs which are valid for one minute.
   * @param options.download triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   */
  createSignedUrls(e, t, s) {
    return U(this, void 0, void 0, function* () {
      try {
        const r = yield J(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), n = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: r.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${n}`) : null })),
          error: null
        };
      } catch (r) {
        if (j(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  /**
   * Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.
   *
   * @param path The full path and file name of the file to be downloaded. For example `folder/image.png`.
   * @param options.transform Transform the asset before serving it to the client.
   */
  download(e, t) {
    return U(this, void 0, void 0, function* () {
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = n ? `?${n}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield Ve(this.fetch, `${this.url}/${r}/${a}${o}`, {
          headers: this.headers,
          noResolveJson: !0
        })).blob(), error: null };
      } catch (a) {
        if (j(a))
          return { data: null, error: a };
        throw a;
      }
    });
  }
  /**
   * Retrieves the details of an existing file.
   * @param path
   */
  info(e) {
    return U(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield Ve(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: _t(s), error: null };
      } catch (s) {
        if (j(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Checks the existence of a file.
   * @param path
   */
  exists(e) {
    return U(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield gn(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (j(s) && s instanceof bt) {
          const r = s.originalError;
          if ([400, 404].includes(r == null ? void 0 : r.status))
            return { data: !1, error: s };
        }
        throw s;
      }
    });
  }
  /**
   * A simple convenience function to get the URL for an asset in a public bucket. If you do not want to use this function, you can construct the public URL by concatenating the bucket URL with the path to the asset.
   * This function does not verify if the bucket is public. If a public URL is created for a bucket which is not public, you will not be able to download the asset.
   *
   * @param path The path and name of the file to generate the public URL for. For example `folder/image.png`.
   * @param options.download Triggers the file as a download if set to true. Set this parameter as the name of the file if you want to trigger the download with a different filename.
   * @param options.transform Transform the asset before serving it to the client.
   */
  getPublicUrl(e, t) {
    const s = this._getFinalPath(e), r = [], n = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    n !== "" && r.push(n);
    const a = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image" : "object", l = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {});
    l !== "" && r.push(l);
    let c = r.join("&");
    return c !== "" && (c = `?${c}`), {
      data: { publicUrl: encodeURI(`${this.url}/${a}/public/${s}${c}`) }
    };
  }
  /**
   * Deletes files within the same bucket
   *
   * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
   */
  remove(e) {
    return U(this, void 0, void 0, function* () {
      try {
        return { data: yield zs(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
      } catch (t) {
        if (j(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Get file metadata
   * @param id the file id to retrieve metadata
   */
  // async getMetadata(
  //   id: string
  // ): Promise<
  //   | {
  //       data: Metadata
  //       error: null
  //     }
  //   | {
  //       data: null
  //       error: StorageError
  //     }
  // > {
  //   try {
  //     const data = await get(this.fetch, `${this.url}/metadata/${id}`, { headers: this.headers })
  //     return { data, error: null }
  //   } catch (error) {
  //     if (isStorageError(error)) {
  //       return { data: null, error }
  //     }
  //     throw error
  //   }
  // }
  /**
   * Update file metadata
   * @param id the file id to update metadata
   * @param meta the new file metadata
   */
  // async updateMetadata(
  //   id: string,
  //   meta: Metadata
  // ): Promise<
  //   | {
  //       data: Metadata
  //       error: null
  //     }
  //   | {
  //       data: null
  //       error: StorageError
  //     }
  // > {
  //   try {
  //     const data = await post(
  //       this.fetch,
  //       `${this.url}/metadata/${id}`,
  //       { ...meta },
  //       { headers: this.headers }
  //     )
  //     return { data, error: null }
  //   } catch (error) {
  //     if (isStorageError(error)) {
  //       return { data: null, error }
  //     }
  //     throw error
  //   }
  // }
  /**
   * Lists all the files within a bucket.
   * @param path The folder path.
   * @param options Search options including limit (defaults to 100), offset, sortBy, and search
   */
  list(e, t, s) {
    return U(this, void 0, void 0, function* () {
      try {
        const r = Object.assign(Object.assign(Object.assign({}, mn), t), { prefix: e || "" });
        return { data: yield J(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
      } catch (r) {
        if (j(r))
          return { data: null, error: r };
        throw r;
      }
    });
  }
  encodeMetadata(e) {
    return JSON.stringify(e);
  }
  toBase64(e) {
    return typeof Buffer < "u" ? Buffer.from(e).toString("base64") : btoa(e);
  }
  _getFinalPath(e) {
    return `${this.bucketId}/${e.replace(/^\/+/, "")}`;
  }
  _removeEmptyFolders(e) {
    return e.replace(/^\/|\/$/g, "").replace(/\/+/g, "/");
  }
  transformOptsToQueryString(e) {
    const t = [];
    return e.width && t.push(`width=${e.width}`), e.height && t.push(`height=${e.height}`), e.resize && t.push(`resize=${e.resize}`), e.format && t.push(`format=${e.format}`), e.quality && t.push(`quality=${e.quality}`), t.join("&");
  }
}
const yn = "2.10.4", bn = { "X-Client-Info": `storage-js/${yn}` };
var ve = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class _n {
  constructor(e, t = {}, s, r) {
    const n = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase.")), this.url = n.href, this.headers = Object.assign(Object.assign({}, bn), t), this.fetch = qs(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield Ve(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
      } catch (e) {
        if (j(e))
          return { data: null, error: e };
        throw e;
      }
    });
  }
  /**
   * Retrieves the details of an existing Storage bucket.
   *
   * @param id The unique identifier of the bucket you would like to retrieve.
   */
  getBucket(e) {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield Ve(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
      } catch (t) {
        if (j(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Creates a new Storage bucket
   *
   * @param id A unique identifier for the bucket you are creating.
   * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations. By default, buckets are private.
   * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
   * The global file size limit takes precedence over this value.
   * The default value is null, which doesn't set a per bucket file size limit.
   * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
   * The default value is null, which allows files with all mime types to be uploaded.
   * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
   * @returns newly created bucket id
   * @param options.type (private-beta) specifies the bucket type. see `BucketType` for more details.
   *   - default bucket type is `STANDARD`
   */
  createBucket(e, t = {
    public: !1
  }) {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield J(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          type: t.type,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (j(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Updates a Storage bucket
   *
   * @param id A unique identifier for the bucket you are updating.
   * @param options.public The visibility of the bucket. Public buckets don't require an authorization token to download objects, but still require a valid token for all other operations.
   * @param options.fileSizeLimit specifies the max file size in bytes that can be uploaded to this bucket.
   * The global file size limit takes precedence over this value.
   * The default value is null, which doesn't set a per bucket file size limit.
   * @param options.allowedMimeTypes specifies the allowed mime types that this bucket can accept during upload.
   * The default value is null, which allows files with all mime types to be uploaded.
   * Each mime type specified can be a wildcard, e.g. image/*, or a specific mime type, e.g. image/png.
   */
  updateBucket(e, t) {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield wt(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (j(s))
          return { data: null, error: s };
        throw s;
      }
    });
  }
  /**
   * Removes all objects inside a single bucket.
   *
   * @param id The unique identifier of the bucket you would like to empty.
   */
  emptyBucket(e) {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield J(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (j(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * Deletes an existing bucket. A bucket can't be deleted with existing objects inside it.
   * You must first `empty()` the bucket.
   *
   * @param id The unique identifier of the bucket you would like to delete.
   */
  deleteBucket(e) {
    return ve(this, void 0, void 0, function* () {
      try {
        return { data: yield zs(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (j(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class wn extends _n {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new vn(this.url, this.headers, e, this.fetch);
  }
}
const Sn = "2.53.0";
let Pe = "";
typeof Deno < "u" ? Pe = "deno" : typeof document < "u" ? Pe = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? Pe = "react-native" : Pe = "node";
const kn = { "X-Client-Info": `supabase-js-${Pe}/${Sn}` }, En = {
  headers: kn
}, Cn = {
  schema: "public"
}, In = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, An = {};
var Tn = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const Pn = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = As : e = fetch, (...t) => e(...t);
}, xn = () => typeof Headers > "u" ? Ts : Headers, On = (i, e, t) => {
  const s = Pn(t), r = xn();
  return (n, o) => Tn(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : i;
    let c = new r(o == null ? void 0 : o.headers);
    return c.has("apikey") || c.set("apikey", i), c.has("Authorization") || c.set("Authorization", `Bearer ${l}`), s(n, Object.assign(Object.assign({}, o), { headers: c }));
  });
};
var Ln = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
function jn(i) {
  return i.endsWith("/") ? i : i + "/";
}
function Rn(i, e) {
  var t, s;
  const { db: r, auth: n, realtime: o, global: a } = i, { db: l, auth: c, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, l), r),
    auth: Object.assign(Object.assign({}, c), n),
    realtime: Object.assign(Object.assign({}, u), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => Ln(this, void 0, void 0, function* () {
      return "";
    })
  };
  return i.accessToken ? h.accessToken = i.accessToken : delete h.accessToken, h;
}
const Hs = "2.71.1", Se = 30 * 1e3, St = 3, ut = St * Se, $n = "http://localhost:9999", Dn = "supabase.auth.token", Nn = { "X-Client-Info": `gotrue-js/${Hs}` }, kt = "X-Supabase-Api-Version", Ks = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, Un = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Fn = 10 * 60 * 1e3;
class Bt extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function _(i) {
  return typeof i == "object" && i !== null && "__isAuthError" in i;
}
class Mn extends Bt {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function Bn(i) {
  return _(i) && i.name === "AuthApiError";
}
class Ws extends Bt {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class le extends Bt {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class se extends le {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function qn(i) {
  return _(i) && i.name === "AuthSessionMissingError";
}
class qe extends le {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class ze extends le {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class He extends le {
  constructor(e, t = null) {
    super(e, "AuthImplicitGrantRedirectError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
function zn(i) {
  return _(i) && i.name === "AuthImplicitGrantRedirectError";
}
class ds extends le {
  constructor(e, t = null) {
    super(e, "AuthPKCEGrantCodeExchangeError", 500, void 0), this.details = null, this.details = t;
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      details: this.details
    };
  }
}
class Et extends le {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function dt(i) {
  return _(i) && i.name === "AuthRetryableFetchError";
}
class hs extends le {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class Ct extends le {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Ge = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), fs = ` 	
\r=`.split(""), Hn = (() => {
  const i = new Array(128);
  for (let e = 0; e < i.length; e += 1)
    i[e] = -1;
  for (let e = 0; e < fs.length; e += 1)
    i[fs[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Ge.length; e += 1)
    i[Ge[e].charCodeAt(0)] = e;
  return i;
})();
function ps(i, e, t) {
  if (i !== null)
    for (e.queue = e.queue << 8 | i, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Ge[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Ge[s]), e.queuedBits -= 6;
    }
}
function Vs(i, e, t) {
  const s = Hn[i];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(i)}"`);
  }
}
function gs(i) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, n = (o) => {
    Vn(o, s, t);
  };
  for (let o = 0; o < i.length; o += 1)
    Vs(i.charCodeAt(o), r, n);
  return e.join("");
}
function Kn(i, e) {
  if (i <= 127) {
    e(i);
    return;
  } else if (i <= 2047) {
    e(192 | i >> 6), e(128 | i & 63);
    return;
  } else if (i <= 65535) {
    e(224 | i >> 12), e(128 | i >> 6 & 63), e(128 | i & 63);
    return;
  } else if (i <= 1114111) {
    e(240 | i >> 18), e(128 | i >> 12 & 63), e(128 | i >> 6 & 63), e(128 | i & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${i.toString(16)}`);
}
function Wn(i, e) {
  for (let t = 0; t < i.length; t += 1) {
    let s = i.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (i.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    Kn(s, e);
  }
}
function Vn(i, e, t) {
  if (e.utf8seq === 0) {
    if (i <= 127) {
      t(i);
      return;
    }
    for (let s = 1; s < 6; s += 1)
      if (!(i >> 7 - s & 1)) {
        e.utf8seq = s;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = i & 31;
    else if (e.utf8seq === 3)
      e.codepoint = i & 15;
    else if (e.utf8seq === 4)
      e.codepoint = i & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (i <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | i & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function Gn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < i.length; r += 1)
    Vs(i.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function Jn(i) {
  const e = [];
  return Wn(i, (t) => e.push(t)), new Uint8Array(e);
}
function Yn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return i.forEach((r) => ps(r, t, s)), ps(null, t, s), e.join("");
}
function Xn(i) {
  return Math.round(Date.now() / 1e3) + i;
}
function Qn() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(i) {
    const e = Math.random() * 16 | 0;
    return (i == "x" ? e : e & 3 | 8).toString(16);
  });
}
const B = () => typeof window < "u" && typeof document < "u", ce = {
  tested: !1,
  writable: !1
}, Gs = () => {
  if (!B())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (ce.tested)
    return ce.writable;
  const i = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(i, i), globalThis.localStorage.removeItem(i), ce.tested = !0, ce.writable = !0;
  } catch {
    ce.tested = !0, ce.writable = !1;
  }
  return ce.writable;
};
function Zn(i) {
  const e = {}, t = new URL(i);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((r, n) => {
        e[n] = r;
      });
    } catch {
    }
  return t.searchParams.forEach((s, r) => {
    e[r] = s;
  }), e;
}
const Js = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => Ie).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, ei = (i) => typeof i == "object" && i !== null && "status" in i && "ok" in i && "json" in i && typeof i.json == "function", ke = async (i, e, t) => {
  await i.setItem(e, JSON.stringify(t));
}, ue = async (i, e) => {
  const t = await i.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, te = async (i, e) => {
  await i.removeItem(e);
};
class it {
  constructor() {
    this.promise = new it.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
it.promiseConstructor = Promise;
function ht(i) {
  const e = i.split(".");
  if (e.length !== 3)
    throw new Ct("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!Un.test(e[s]))
      throw new Ct("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(gs(e[0])),
    payload: JSON.parse(gs(e[1])),
    signature: Gn(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function ti(i) {
  return await new Promise((e) => {
    setTimeout(() => e(null), i);
  });
}
function si(i, e) {
  return new Promise((s, r) => {
    (async () => {
      for (let n = 0; n < 1 / 0; n++)
        try {
          const o = await i(n);
          if (!e(n, null, o)) {
            s(o);
            return;
          }
        } catch (o) {
          if (!e(n, o)) {
            r(o);
            return;
          }
        }
    })();
  });
}
function ri(i) {
  return ("0" + i.toString(16)).substr(-2);
}
function ni() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let n = 0; n < 56; n++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, ri).join("");
}
async function ii(i) {
  const t = new TextEncoder().encode(i), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((n) => String.fromCharCode(n)).join("");
}
async function oi(i) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), i;
  const t = await ii(i);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ye(i, e, t = !1) {
  const s = ni();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await ke(i, `${e}-code-verifier`, r);
  const n = await oi(s);
  return [n, s === n ? "plain" : "s256"];
}
const ai = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function li(i) {
  const e = i.headers.get(kt);
  if (!e || !e.match(ai))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function ci(i) {
  if (!i)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (i <= e)
    throw new Error("JWT has expired");
}
function ui(i) {
  switch (i) {
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: { name: "SHA-256" }
      };
    case "ES256":
      return {
        name: "ECDSA",
        namedCurve: "P-256",
        hash: { name: "SHA-256" }
      };
    default:
      throw new Error("Invalid alg claim");
  }
}
const di = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function be(i) {
  if (!di.test(i))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function ft() {
  const i = {};
  return new Proxy(i, {
    get: (e, t) => {
      if (t === "__isUserNotAvailableProxy")
        return !0;
      if (typeof t == "symbol") {
        const s = t.toString();
        if (s === "Symbol(Symbol.toPrimitive)" || s === "Symbol(Symbol.toStringTag)" || s === "Symbol(util.inspect.custom)")
          return;
      }
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`);
    },
    set: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    },
    deleteProperty: (e, t) => {
      throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`);
    }
  });
}
function ms(i) {
  return JSON.parse(JSON.stringify(i));
}
var hi = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
const de = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), fi = [502, 503, 504];
async function vs(i) {
  var e;
  if (!ei(i))
    throw new Et(de(i), 0);
  if (fi.includes(i.status))
    throw new Et(de(i), i.status);
  let t;
  try {
    t = await i.json();
  } catch (n) {
    throw new Ws(de(n), n);
  }
  let s;
  const r = li(i);
  if (r && r.getTime() >= Ks["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new hs(de(t), i.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new se();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n, o) => n && typeof o == "string", !0))
    throw new hs(de(t), i.status, t.weak_password.reasons);
  throw new Mn(de(t), i.status || 500, s);
}
const pi = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function S(i, e, t, s) {
  var r;
  const n = Object.assign({}, s == null ? void 0 : s.headers);
  n[kt] || (n[kt] = Ks["2024-01-01"].name), s != null && s.jwt && (n.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await gi(i, e, t + a, {
    headers: n,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function gi(i, e, t, s, r, n) {
  const o = pi(e, s, r, n);
  let a;
  try {
    a = await i(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new Et(de(l), 0);
  }
  if (a.ok || await vs(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await vs(l);
  }
}
function W(i) {
  var e;
  let t = null;
  bi(i) && (t = Object.assign({}, i), i.expires_at || (t.expires_at = Xn(i.expires_in)));
  const s = (e = i.user) !== null && e !== void 0 ? e : i;
  return { data: { session: t, user: s }, error: null };
}
function ys(i) {
  const e = W(i);
  return !e.error && i.weak_password && typeof i.weak_password == "object" && Array.isArray(i.weak_password.reasons) && i.weak_password.reasons.length && i.weak_password.message && typeof i.weak_password.message == "string" && i.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = i.weak_password), e;
}
function oe(i) {
  var e;
  return { data: { user: (e = i.user) !== null && e !== void 0 ? e : i }, error: null };
}
function mi(i) {
  return { data: i, error: null };
}
function vi(i) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: n } = i, o = hi(i, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: r,
    verification_type: n
  }, l = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: l
    },
    error: null
  };
}
function yi(i) {
  return i;
}
function bi(i) {
  return i.access_token && i.refresh_token && i.expires_in;
}
const pt = ["global", "local", "others"];
var _i = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
class wi {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = Js(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = pt[0]) {
    if (pt.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${pt.join(", ")}`);
    try {
      return await S(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (s) {
      if (_(s))
        return { data: null, error: s };
      throw s;
    }
  }
  /**
   * Sends an invite link to an email address.
   * @param email The email address of the user.
   * @param options Additional options to be included when inviting.
   */
  async inviteUserByEmail(e, t = {}) {
    try {
      return await S(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: t.data },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: oe
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  /**
   * Generates email links and OTPs to be sent via a custom email provider.
   * @param email The user's email.
   * @param options.password User password. For signup only.
   * @param options.data Optional user metadata. For signup only.
   * @param options.redirectTo The redirect url which should be appended to the generated link
   */
  async generateLink(e) {
    try {
      const { options: t } = e, s = _i(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: vi,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (_(t))
        return {
          data: {
            properties: null,
            user: null
          },
          error: t
        };
      throw t;
    }
  }
  // User Admin API
  /**
   * Creates a new user.
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async createUser(e) {
    try {
      return await S(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: oe
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Get a list of users.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   * @param params An object which supports `page` and `perPage` as numbers, to alter the paginated results.
   */
  async listUsers(e) {
    var t, s, r, n, o, a, l;
    try {
      const c = { nextPage: null, lastPage: 0, total: 0 }, u = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (n = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && n !== void 0 ? n : ""
        },
        xform: yi
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((g) => {
        const v = parseInt(g.split(";")[0].split("=")[1].substring(0, 1)), m = JSON.parse(g.split(";")[1].split("=")[1]);
        c[`${m}Page`] = v;
      }), c.total = parseInt(h)), { data: Object.assign(Object.assign({}, d), c), error: null };
    } catch (c) {
      if (_(c))
        return { data: { users: [] }, error: c };
      throw c;
    }
  }
  /**
   * Get user by id.
   *
   * @param uid The user's unique identifier
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async getUserById(e) {
    be(e);
    try {
      return await S(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: oe
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Updates the user data.
   *
   * @param attributes The data you want to update.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async updateUserById(e, t) {
    be(e);
    try {
      return await S(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: oe
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  /**
   * Delete a user. Requires a `service_role` key.
   *
   * @param id The user id you want to remove.
   * @param shouldSoftDelete If true, then the user will be soft-deleted from the auth schema. Soft deletion allows user identification from the hashed user ID but is not reversible.
   * Defaults to false for backward compatibility.
   *
   * This function should only be called on a server. Never expose your `service_role` key in the browser.
   */
  async deleteUser(e, t = !1) {
    be(e);
    try {
      return await S(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: oe
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    be(e.userId);
    try {
      const { data: t, error: s } = await S(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (r) => ({ data: { factors: r }, error: null })
      });
      return { data: t, error: s };
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    be(e.userId), be(e.id);
    try {
      return { data: await S(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
function bs(i = {}) {
  return {
    getItem: (e) => i[e] || null,
    setItem: (e, t) => {
      i[e] = t;
    },
    removeItem: (e) => {
      delete i[e];
    }
  };
}
function Si() {
  if (typeof globalThis != "object")
    try {
      Object.defineProperty(Object.prototype, "__magic__", {
        get: function() {
          return this;
        },
        configurable: !0
      }), __magic__.globalThis = __magic__, delete Object.prototype.__magic__;
    } catch {
      typeof self < "u" && (self.globalThis = self);
    }
}
const _e = {
  /**
   * @experimental
   */
  debug: !!(globalThis && Gs() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Ys extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class ki extends Ys {
}
async function Ei(i, e, t) {
  _e.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", i, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), _e.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", i);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(i, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      _e.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", i, r.name);
      try {
        return await t();
      } finally {
        _e.debug && console.log("@supabase/gotrue-js: navigatorLock: released", i, r.name);
      }
    } else {
      if (e === 0)
        throw _e.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", i), new ki(`Acquiring an exclusive Navigator LockManager lock "${i}" immediately failed`);
      if (_e.debug)
        try {
          const n = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(n, null, "  "));
        } catch (n) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", n);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
Si();
const Ci = {
  url: $n,
  storageKey: Dn,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: Nn,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function _s(i, e, t) {
  return await t();
}
const we = {};
class $e {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = $e.nextInstanceID, $e.nextInstanceID += 1, this.instanceID > 0 && B() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, Ci), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new wi({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = Js(r.fetch), this.lock = r.lock || _s, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : B() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = Ei : this.lock = _s, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : Gs() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = bs(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = bs(this.memoryStorage)), B() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (n) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", n);
      }
      (s = this.broadcastChannel) === null || s === void 0 || s.addEventListener("message", async (n) => {
        this._debug("received broadcast notification from other tab or client", n), await this._notifyAllSubscribers(n.data.event, n.data.session, !1);
      });
    }
    this.initialize();
  }
  /**
   * The JWKS used for verifying asymmetric JWTs
   */
  get jwks() {
    var e, t;
    return (t = (e = we[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    we[this.storageKey] = Object.assign(Object.assign({}, we[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = we[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    we[this.storageKey] = Object.assign(Object.assign({}, we[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Hs}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
  }
  /**
   * Initializes the client session either from the url or from storage.
   * This method is automatically called when instantiating the client, but should also be called
   * manually when checking for an error from an auth redirect (oauth, magiclink, password recovery, etc).
   */
  async initialize() {
    return this.initializePromise ? await this.initializePromise : (this.initializePromise = (async () => await this._acquireLock(-1, async () => await this._initialize()))(), await this.initializePromise);
  }
  /**
   * IMPORTANT:
   * 1. Never throw in this method, as it is called from the constructor
   * 2. Never return a session from this method as it would be cached over
   *    the whole lifetime of the client
   */
  async _initialize() {
    var e;
    try {
      const t = Zn(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), B() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: n } = await this._getSessionFromURL(t, s);
        if (n) {
          if (this._debug("#_initialize()", "error detecting session from URL", n), zn(n)) {
            const l = (e = n.details) === null || e === void 0 ? void 0 : e.code;
            if (l === "identity_already_exists" || l === "identity_not_found" || l === "single_identity_not_deletable")
              return { error: n };
          }
          return await this._removeSession(), { error: n };
        }
        const { session: o, redirectType: a } = r;
        return this._debug("#_initialize()", "detected session in URL", o, "redirect type", a), await this._saveSession(o), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o) : await this._notifyAllSubscribers("SIGNED_IN", o);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return _(t) ? { error: t } : {
        error: new Ws("Unexpected error during initialization", t)
      };
    } finally {
      await this._handleVisibilityChange(), this._debug("#_initialize()", "end");
    }
  }
  /**
   * Creates a new anonymous user.
   *
   * @returns A session where the is_anonymous claim in the access token JWT set to true
   */
  async signInAnonymously(e) {
    var t, s, r;
    try {
      const n = await S(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (r = e == null ? void 0 : e.options) === null || r === void 0 ? void 0 : r.captchaToken }
        },
        xform: W
      }), { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
    }
  }
  /**
   * Creates a new user.
   *
   * Be aware that if a user account exists in the system you may get back an
   * error message that attempts to hide this information from the user.
   * This method has support for PKCE via email signups. The PKCE flow cannot be used when autoconfirm is enabled.
   *
   * @returns A logged-in session if the server has "autoconfirm" ON
   * @returns A user if the server has "autoconfirm" OFF
   */
  async signUp(e) {
    var t, s, r;
    try {
      let n;
      if ("email" in e) {
        const { email: u, password: d, options: h } = e;
        let f = null, g = null;
        this.flowType === "pkce" && ([f, g] = await ye(this.storage, this.storageKey)), n = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: h == null ? void 0 : h.emailRedirectTo,
          body: {
            email: u,
            password: d,
            data: (t = h == null ? void 0 : h.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken },
            code_challenge: f,
            code_challenge_method: g
          },
          xform: W
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: h } = e;
        n = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (s = h == null ? void 0 : h.data) !== null && s !== void 0 ? s : {},
            channel: (r = h == null ? void 0 : h.channel) !== null && r !== void 0 ? r : "sms",
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken }
          },
          xform: W
        });
      } else
        throw new ze("You must provide either an email or phone number and a password");
      const { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
    }
  }
  /**
   * Log in an existing user with an email and password or phone and password.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or that the
   * email/phone and password combination is wrong or that the account can only
   * be accessed via social login.
   */
  async signInWithPassword(e) {
    try {
      let t;
      if ("email" in e) {
        const { email: n, password: o, options: a } = e;
        t = await S(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: ys
        });
      } else if ("phone" in e) {
        const { phone: n, password: o, options: a } = e;
        t = await S(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: ys
        });
      } else
        throw new ze("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new qe() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: r
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   */
  async signInWithOAuth(e) {
    var t, s, r, n;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (s = e.options) === null || s === void 0 ? void 0 : s.scopes,
      queryParams: (r = e.options) === null || r === void 0 ? void 0 : r.queryParams,
      skipBrowserRedirect: (n = e.options) === null || n === void 0 ? void 0 : n.skipBrowserRedirect
    });
  }
  /**
   * Log in an existing user by exchanging an Auth Code issued during the PKCE flow.
   */
  async exchangeCodeForSession(e) {
    return await this.initializePromise, this._acquireLock(-1, async () => this._exchangeCodeForSession(e));
  }
  /**
   * Signs in a user by verifying a message signed by the user's private key.
   * Only Solana supported at this time, using the Sign in with Solana standard.
   */
  async signInWithWeb3(e) {
    const { chain: t } = e;
    if (t === "solana")
      return await this.signInWithSolana(e);
    throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`);
  }
  async signInWithSolana(e) {
    var t, s, r, n, o, a, l, c, u, d, h, f;
    let g, v;
    if ("message" in e)
      g = e.message, v = e.signature;
    else {
      const { chain: m, wallet: b, statement: E, options: y } = e;
      let w;
      if (B())
        if (typeof b == "object")
          w = b;
        else {
          const k = window;
          if ("solana" in k && typeof k.solana == "object" && ("signIn" in k.solana && typeof k.solana.signIn == "function" || "signMessage" in k.solana && typeof k.solana.signMessage == "function"))
            w = k.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof b != "object" || !(y != null && y.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        w = b;
      }
      const P = new URL((t = y == null ? void 0 : y.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in w && w.signIn) {
        const k = await w.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, y == null ? void 0 : y.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: P.host,
          uri: P.href
        }), E ? { statement: E } : null));
        let C;
        if (Array.isArray(k) && k[0] && typeof k[0] == "object")
          C = k[0];
        else if (k && typeof k == "object" && "signedMessage" in k && "signature" in k)
          C = k;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in C && "signature" in C && (typeof C.signedMessage == "string" || C.signedMessage instanceof Uint8Array) && C.signature instanceof Uint8Array)
          g = typeof C.signedMessage == "string" ? C.signedMessage : new TextDecoder().decode(C.signedMessage), v = C.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in w) || typeof w.signMessage != "function" || !("publicKey" in w) || typeof w != "object" || !w.publicKey || !("toBase58" in w.publicKey) || typeof w.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        g = [
          `${P.host} wants you to sign in with your Solana account:`,
          w.publicKey.toBase58(),
          ...E ? ["", E, ""] : [""],
          "Version: 1",
          `URI: ${P.href}`,
          `Issued At: ${(r = (s = y == null ? void 0 : y.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n = y == null ? void 0 : y.signInWithSolana) === null || n === void 0) && n.notBefore ? [`Not Before: ${y.signInWithSolana.notBefore}`] : [],
          ...!((o = y == null ? void 0 : y.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${y.signInWithSolana.expirationTime}`] : [],
          ...!((a = y == null ? void 0 : y.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${y.signInWithSolana.chainId}`] : [],
          ...!((l = y == null ? void 0 : y.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${y.signInWithSolana.nonce}`] : [],
          ...!((c = y == null ? void 0 : y.signInWithSolana) === null || c === void 0) && c.requestId ? [`Request ID: ${y.signInWithSolana.requestId}`] : [],
          ...!((d = (u = y == null ? void 0 : y.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...y.signInWithSolana.resources.map((C) => `- ${C}`)
          ] : []
        ].join(`
`);
        const k = await w.signMessage(new TextEncoder().encode(g), "utf8");
        if (!k || !(k instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        v = k;
      }
    }
    try {
      const { data: m, error: b } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: g, signature: Yn(v) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: W
      });
      if (b)
        throw b;
      return !m || !m.session || !m.user ? {
        data: { user: null, session: null },
        error: new qe()
      } : (m.session && (await this._saveSession(m.session), await this._notifyAllSubscribers("SIGNED_IN", m.session)), { data: Object.assign({}, m), error: b });
    } catch (m) {
      if (_(m))
        return { data: { user: null, session: null }, error: m };
      throw m;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await ue(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: n, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: W
      });
      if (await te(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !n || !n.session || !n.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new qe()
      } : (n.session && (await this._saveSession(n.session), await this._notifyAllSubscribers("SIGNED_IN", n.session)), { data: Object.assign(Object.assign({}, n), { redirectType: r ?? null }), error: o });
    } catch (n) {
      if (_(n))
        return { data: { user: null, session: null, redirectType: null }, error: n };
      throw n;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: s, token: r, access_token: n, nonce: o } = e, a = await S(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: r,
          access_token: n,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: W
      }), { data: l, error: c } = a;
      return c ? { data: { user: null, session: null }, error: c } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new qe()
      } : (l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), { data: l, error: c });
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in a user using magiclink or a one-time password (OTP).
   *
   * If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.
   * If the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.
   * If you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.
   *
   * Be aware that you may get back an error message that will not distinguish
   * between the cases where the account does not exist or, that the account
   * can only be accessed via social login.
   *
   * Do note that you will need to configure a Whatsapp sender on Twilio
   * if you are using phone sign in with the 'whatsapp' channel. The whatsapp
   * channel is not supported on other providers
   * at this time.
   * This method supports PKCE when an email is passed.
   */
  async signInWithOtp(e) {
    var t, s, r, n, o;
    try {
      if ("email" in e) {
        const { email: a, options: l } = e;
        let c = null, u = null;
        this.flowType === "pkce" && ([c, u] = await ye(this.storage, this.storageKey));
        const { error: d } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = l == null ? void 0 : l.data) !== null && t !== void 0 ? t : {},
            create_user: (s = l == null ? void 0 : l.shouldCreateUser) !== null && s !== void 0 ? s : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            code_challenge: c,
            code_challenge_method: u
          },
          redirectTo: l == null ? void 0 : l.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: d };
      }
      if ("phone" in e) {
        const { phone: a, options: l } = e, { data: c, error: u } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (r = l == null ? void 0 : l.data) !== null && r !== void 0 ? r : {},
            create_user: (n = l == null ? void 0 : l.shouldCreateUser) !== null && n !== void 0 ? n : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            channel: (o = l == null ? void 0 : l.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: c == null ? void 0 : c.message_id }, error: u };
      }
      throw new ze("You must provide either an email or phone number.");
    } catch (a) {
      if (_(a))
        return { data: { user: null, session: null }, error: a };
      throw a;
    }
  }
  /**
   * Log in a user given a User supplied OTP or TokenHash received through mobile or email.
   */
  async verifyOtp(e) {
    var t, s;
    try {
      let r, n;
      "options" in e && (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, n = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: n } }),
        redirectTo: r,
        xform: W
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const l = o.session, c = o.user;
      return l != null && l.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (r) {
      if (_(r))
        return { data: { user: null, session: null }, error: r };
      throw r;
    }
  }
  /**
   * Attempts a single-sign on using an enterprise Identity Provider. A
   * successful SSO attempt will redirect the current page to the identity
   * provider authorization page. The redirect URL is implementation and SSO
   * protocol specific.
   *
   * You can use it by providing a SSO domain. Typically you can extract this
   * domain by asking users for their email address. If this domain is
   * registered on the Auth instance the redirect will use that organization's
   * currently active SSO Identity Provider for the login.
   *
   * If you have built an organization-specific login page, you can use the
   * organization's SSO Identity Provider UUID directly instead.
   */
  async signInWithSSO(e) {
    var t, s, r;
    try {
      let n = null, o = null;
      return this.flowType === "pkce" && ([n, o] = await ye(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: n, code_challenge_method: o }),
        headers: this.headers,
        xform: mi
      });
    } catch (n) {
      if (_(n))
        return { data: null, error: n };
      throw n;
    }
  }
  /**
   * Sends a reauthentication OTP to the user's email or phone number.
   * Requires the user to be signed-in.
   */
  async reauthenticate() {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._reauthenticate());
  }
  async _reauthenticate() {
    try {
      return await this._useSession(async (e) => {
        const { data: { session: t }, error: s } = e;
        if (s)
          throw s;
        if (!t)
          throw new se();
        const { error: r } = await S(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: r };
      });
    } catch (e) {
      if (_(e))
        return { data: { user: null, session: null }, error: e };
      throw e;
    }
  }
  /**
   * Resends an existing signup confirmation email, email change email, SMS OTP or phone change OTP.
   */
  async resend(e) {
    try {
      const t = `${this.url}/resend`;
      if ("email" in e) {
        const { email: s, type: r, options: n } = e, { error: o } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: s,
            type: r,
            gotrue_meta_security: { captcha_token: n == null ? void 0 : n.captchaToken }
          },
          redirectTo: n == null ? void 0 : n.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: o };
      } else if ("phone" in e) {
        const { phone: s, type: r, options: n } = e, { data: o, error: a } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: s,
            type: r,
            gotrue_meta_security: { captcha_token: n == null ? void 0 : n.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new ze("You must provide either an email or phone number and a type");
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Returns the session, refreshing it if necessary.
   *
   * The session returned can be null if the session is not detected which can happen in the event a user is not signed-in or has logged out.
   *
   * **IMPORTANT:** This method loads values directly from the storage attached
   * to the client. If that storage is based on request cookies for example,
   * the values in it may not be authentic and therefore it's strongly advised
   * against using this method and its results in such circumstances. A warning
   * will be emitted if this is detected. Use {@link #getUser()} instead.
   */
  async getSession() {
    return await this.initializePromise, await this._acquireLock(-1, async () => this._useSession(async (t) => t));
  }
  /**
   * Acquires a global lock based on the storage key.
   */
  async _acquireLock(e, t) {
    this._debug("#_acquireLock", "begin", e);
    try {
      if (this.lockAcquired) {
        const s = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), r = (async () => (await s, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await r;
          } catch {
          }
        })()), r;
      }
      return await this.lock(`lock:${this.storageKey}`, e, async () => {
        this._debug("#_acquireLock", "lock acquired for storage key", this.storageKey);
        try {
          this.lockAcquired = !0;
          const s = t();
          for (this.pendingInLock.push((async () => {
            try {
              await s;
            } catch {
            }
          })()), await s; this.pendingInLock.length; ) {
            const r = [...this.pendingInLock];
            await Promise.all(r), this.pendingInLock.splice(0, r.length);
          }
          return await s;
        } finally {
          this._debug("#_acquireLock", "lock released for storage key", this.storageKey), this.lockAcquired = !1;
        }
      });
    } finally {
      this._debug("#_acquireLock", "end");
    }
  }
  /**
   * Use instead of {@link #getSession} inside the library. It is
   * semantically usually what you want, as getting a session involves some
   * processing afterwards that requires only one client operating on the
   * session at once across multiple tabs or processes.
   */
  async _useSession(e) {
    this._debug("#_useSession", "begin");
    try {
      const t = await this.__loadSession();
      return await e(t);
    } finally {
      this._debug("#_useSession", "end");
    }
  }
  /**
   * NEVER USE DIRECTLY!
   *
   * Always use {@link #_useSession}.
   */
  async __loadSession() {
    this._debug("#__loadSession()", "begin"), this.lockAcquired || this._debug("#__loadSession()", "used outside of an acquired lock!", new Error().stack);
    try {
      let e = null;
      const t = await ue(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < ut : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await ue(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = ft();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (l, c, u) => (!o && c === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(l, c, u))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: r, error: n } = await this._callRefreshToken(e.refresh_token);
      return n ? { data: { session: null }, error: n } : { data: { session: r }, error: null };
    } finally {
      this._debug("#__loadSession()", "end");
    }
  }
  /**
   * Gets the current user details if there is an existing session. This method
   * performs a network request to the Supabase Auth server, so the returned
   * value is authentic and can be used to base authorization rules on.
   *
   * @param jwt Takes in an optional access token JWT. If no JWT is provided, the JWT from the current session is used.
   */
  async getUser(e) {
    return e ? await this._getUser(e) : (await this.initializePromise, await this._acquireLock(-1, async () => await this._getUser()));
  }
  async _getUser(e) {
    try {
      return e ? await S(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: oe
      }) : await this._useSession(async (t) => {
        var s, r, n;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new se() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0,
          xform: oe
        });
      });
    } catch (t) {
      if (_(t))
        return qn(t) && (await this._removeSession(), await te(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
      throw t;
    }
  }
  /**
   * Updates user data for a logged in user.
   */
  async updateUser(e, t = {}) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._updateUser(e, t));
  }
  async _updateUser(e, t = {}) {
    try {
      return await this._useSession(async (s) => {
        const { data: r, error: n } = s;
        if (n)
          throw n;
        if (!r.session)
          throw new se();
        const o = r.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await ye(this.storage, this.storageKey));
        const { data: c, error: u } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: oe
        });
        if (u)
          throw u;
        return o.user = c.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  /**
   * Sets the session data from the current session. If the current session is expired, setSession will take care of refreshing it to obtain a new session.
   * If the refresh token or access token in the current session is invalid, an error will be thrown.
   * @param currentSession The current session that minimally contains an access token and refresh token.
   */
  async setSession(e) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._setSession(e));
  }
  async _setSession(e) {
    try {
      if (!e.access_token || !e.refresh_token)
        throw new se();
      const t = Date.now() / 1e3;
      let s = t, r = !0, n = null;
      const { payload: o } = ht(e.access_token);
      if (o.exp && (s = o.exp, r = s <= t), r) {
        const { session: a, error: l } = await this._callRefreshToken(e.refresh_token);
        if (l)
          return { data: { user: null, session: null }, error: l };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        n = a;
      } else {
        const { data: a, error: l } = await this._getUser(e.access_token);
        if (l)
          throw l;
        n = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: s - t,
          expires_at: s
        }, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n);
      }
      return { data: { user: n.user, session: n }, error: null };
    } catch (t) {
      if (_(t))
        return { data: { session: null, user: null }, error: t };
      throw t;
    }
  }
  /**
   * Returns a new session, regardless of expiry status.
   * Takes in an optional current session. If not passed in, then refreshSession() will attempt to retrieve it from getSession().
   * If the current session's refresh token is invalid, an error will be thrown.
   * @param currentSession The current session. If passed in, it must contain a refresh token.
   */
  async refreshSession(e) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._refreshSession(e));
  }
  async _refreshSession(e) {
    try {
      return await this._useSession(async (t) => {
        var s;
        if (!e) {
          const { data: o, error: a } = t;
          if (a)
            throw a;
          e = (s = o.session) !== null && s !== void 0 ? s : void 0;
        }
        if (!(e != null && e.refresh_token))
          throw new se();
        const { session: r, error: n } = await this._callRefreshToken(e.refresh_token);
        return n ? { data: { user: null, session: null }, error: n } : r ? { data: { user: r.user, session: r }, error: null } : { data: { user: null, session: null }, error: null };
      });
    } catch (t) {
      if (_(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!B())
        throw new He("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new He(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new ds("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new He("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new ds("No code detected.");
        const { data: E, error: y } = await this._exchangeCodeForSession(e.code);
        if (y)
          throw y;
        const w = new URL(window.location.href);
        return w.searchParams.delete("code"), window.history.replaceState(window.history.state, "", w.toString()), { data: { session: E.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: n, refresh_token: o, expires_in: a, expires_at: l, token_type: c } = e;
      if (!n || !a || !o || !c)
        throw new He("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      l && (h = parseInt(l));
      const f = h - u;
      f * 1e3 <= Se && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const g = h - d;
      u - g >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", g, h, u) : u - g < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", g, h, u);
      const { data: v, error: m } = await this._getUser(n);
      if (m)
        throw m;
      const b = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: n,
        expires_in: d,
        expires_at: h,
        refresh_token: o,
        token_type: c,
        user: v.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: b, redirectType: e.type }, error: null };
    } catch (s) {
      if (_(s))
        return { data: { session: null, redirectType: null }, error: s };
      throw s;
    }
  }
  /**
   * Checks if the current URL contains parameters given by an implicit oauth grant flow (https://www.rfc-editor.org/rfc/rfc6749.html#section-4.2)
   */
  _isImplicitGrantCallback(e) {
    return !!(e.access_token || e.error_description);
  }
  /**
   * Checks if the current URL and backing storage contain parameters given by a PKCE flow
   */
  async _isPKCECallback(e) {
    const t = await ue(this.storage, `${this.storageKey}-code-verifier`);
    return !!(e.code && t);
  }
  /**
   * Inside a browser context, `signOut()` will remove the logged in user from the browser session and log them out - removing all items from localstorage and then trigger a `"SIGNED_OUT"` event.
   *
   * For server-side management, you can revoke all refresh tokens for a user by passing a user's JWT through to `auth.api.signOut(JWT: string)`.
   * There is no way to revoke a user's access token jwt until it expires. It is recommended to set a shorter expiry on the jwt for this reason.
   *
   * If using `others` scope, no `SIGNED_OUT` event is fired!
   */
  async signOut(e = { scope: "global" }) {
    return await this.initializePromise, await this._acquireLock(-1, async () => await this._signOut(e));
  }
  async _signOut({ scope: e } = { scope: "global" }) {
    return await this._useSession(async (t) => {
      var s;
      const { data: r, error: n } = t;
      if (n)
        return { error: n };
      const o = (s = r.session) === null || s === void 0 ? void 0 : s.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(Bn(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await te(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = Qn(), s = {
      id: t,
      callback: e,
      unsubscribe: () => {
        this._debug("#unsubscribe()", "state change callback with id removed", t), this.stateChangeEmitters.delete(t);
      }
    };
    return this._debug("#onAuthStateChange()", "registered callback with id", t), this.stateChangeEmitters.set(t, s), (async () => (await this.initializePromise, await this._acquireLock(-1, async () => {
      this._emitInitialSession(t);
    })))(), { data: { subscription: s } };
  }
  async _emitInitialSession(e) {
    return await this._useSession(async (t) => {
      var s, r;
      try {
        const { data: { session: n }, error: o } = t;
        if (o)
          throw o;
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", n)), this._debug("INITIAL_SESSION", "callback id", e, "session", n);
      } catch (n) {
        await ((r = this.stateChangeEmitters.get(e)) === null || r === void 0 ? void 0 : r.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", n), console.error(n);
      }
    });
  }
  /**
   * Sends a password reset request to an email address. This method supports the PKCE flow.
   *
   * @param email The email address of the user.
   * @param options.redirectTo The URL to send the user to after they click the password reset link.
   * @param options.captchaToken Verification token received when the user completes the captcha on the site.
   */
  async resetPasswordForEmail(e, t = {}) {
    let s = null, r = null;
    this.flowType === "pkce" && ([s, r] = await ye(
      this.storage,
      this.storageKey,
      !0
      // isPasswordRecovery
    ));
    try {
      return await S(this.fetch, "POST", `${this.url}/recover`, {
        body: {
          email: e,
          code_challenge: s,
          code_challenge_method: r,
          gotrue_meta_security: { captcha_token: t.captchaToken }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (n) {
      if (_(n))
        return { data: null, error: n };
      throw n;
    }
  }
  /**
   * Gets all the identities linked to a user.
   */
  async getUserIdentities() {
    var e;
    try {
      const { data: t, error: s } = await this.getUser();
      if (s)
        throw s;
      return { data: { identities: (e = t.user.identities) !== null && e !== void 0 ? e : [] }, error: null };
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Links an oauth identity to an existing user.
   * This method supports the PKCE flow.
   */
  async linkIdentity(e) {
    var t;
    try {
      const { data: s, error: r } = await this._useSession(async (n) => {
        var o, a, l, c, u;
        const { data: d, error: h } = n;
        if (h)
          throw h;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (l = e.options) === null || l === void 0 ? void 0 : l.queryParams,
          skipBrowserRedirect: !0
        });
        return await S(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (u = (c = d.session) === null || c === void 0 ? void 0 : c.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (r)
        throw r;
      return B() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
    } catch (s) {
      if (_(s))
        return { data: { provider: e.provider, url: null }, error: s };
      throw s;
    }
  }
  /**
   * Unlinks an identity from a user by deleting it. The user will no longer be able to sign in with that identity once it's unlinked.
   */
  async unlinkIdentity(e) {
    try {
      return await this._useSession(async (t) => {
        var s, r;
        const { data: n, error: o } = t;
        if (o)
          throw o;
        return await S(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (r = (s = n.session) === null || s === void 0 ? void 0 : s.access_token) !== null && r !== void 0 ? r : void 0
        });
      });
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * Generates a new JWT.
   * @param refreshToken A valid refresh token that was returned on login.
   */
  async _refreshAccessToken(e) {
    const t = `#_refreshAccessToken(${e.substring(0, 5)}...)`;
    this._debug(t, "begin");
    try {
      const s = Date.now();
      return await si(async (r) => (r > 0 && await ti(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: W
      })), (r, n) => {
        const o = 200 * Math.pow(2, r);
        return n && dt(n) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < Se;
      });
    } catch (s) {
      if (this._debug(t, "error", s), _(s))
        return { data: { session: null, user: null }, error: s };
      throw s;
    } finally {
      this._debug(t, "end");
    }
  }
  _isValidSession(e) {
    return typeof e == "object" && e !== null && "access_token" in e && "refresh_token" in e && "expires_at" in e;
  }
  async _handleProviderSignIn(e, t) {
    const s = await this._getUrlForProvider(`${this.url}/authorize`, e, {
      redirectTo: t.redirectTo,
      scopes: t.scopes,
      queryParams: t.queryParams
    });
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), B() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
  }
  /**
   * Recovers the session from LocalStorage and refreshes the token
   * Note: this method is async to accommodate for AsyncStorage e.g. in React native.
   */
  async _recoverAndRefresh() {
    var e, t;
    const s = "#_recoverAndRefresh()";
    this._debug(s, "begin");
    try {
      const r = await ue(this.storage, this.storageKey);
      if (r && this.userStorage) {
        let o = await ue(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await ke(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : ft();
      } else if (r && !r.user && !r.user) {
        const o = await ue(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await te(this.storage, this.storageKey + "-user"), await ke(this.storage, this.storageKey, r)) : r.user = ft();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const n = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < ut;
      if (this._debug(s, `session has${n ? "" : " not"} expired with margin of ${ut}s`), n) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), dt(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
        }
      } else if (r.user && r.user.__isUserNotAvailableProxy === !0)
        try {
          const { data: o, error: a } = await this._getUser(r.access_token);
          !a && (o != null && o.user) ? (r.user = o.user, await this._saveSession(r), await this._notifyAllSubscribers("SIGNED_IN", r)) : this._debug(s, "could not get user data, skipping SIGNED_IN notification");
        } catch (o) {
          console.error("Error getting user data:", o), this._debug(s, "error getting user data, skipping SIGNED_IN notification", o);
        }
      else
        await this._notifyAllSubscribers("SIGNED_IN", r);
    } catch (r) {
      this._debug(s, "error", r), console.error(r);
      return;
    } finally {
      this._debug(s, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, s;
    if (!e)
      throw new se();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new it();
      const { data: n, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!n.session)
        throw new se();
      await this._saveSession(n.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", n.session);
      const a = { session: n.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (n) {
      if (this._debug(r, "error", n), _(n)) {
        const o = { session: null, error: n };
        return dt(n) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
      }
      throw (s = this.refreshingDeferred) === null || s === void 0 || s.reject(n), n;
    } finally {
      this.refreshingDeferred = null, this._debug(r, "end");
    }
  }
  async _notifyAllSubscribers(e, t, s = !0) {
    const r = `#_notifyAllSubscribers(${e})`;
    this._debug(r, "begin", t, `broadcast = ${s}`);
    try {
      this.broadcastChannel && s && this.broadcastChannel.postMessage({ event: e, session: t });
      const n = [], o = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (l) {
          n.push(l);
        }
      });
      if (await Promise.all(o), n.length > 0) {
        for (let a = 0; a < n.length; a += 1)
          console.error(n[a]);
        throw n[0];
      }
    } finally {
      this._debug(r, "end");
    }
  }
  /**
   * set currentSession and currentUser
   * process to _startAutoRefreshToken if possible
   */
  async _saveSession(e) {
    this._debug("#_saveSession()", e), this.suppressGetSessionWarning = !0;
    const t = Object.assign({}, e), s = t.user && t.user.__isUserNotAvailableProxy === !0;
    if (this.userStorage) {
      !s && t.user && await ke(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const n = ms(r);
      await ke(this.storage, this.storageKey, n);
    } else {
      const r = ms(t);
      await ke(this.storage, this.storageKey, r);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await te(this.storage, this.storageKey), await te(this.storage, this.storageKey + "-code-verifier"), await te(this.storage, this.storageKey + "-user"), this.userStorage && await te(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
  }
  /**
   * Removes any registered visibilitychange callback.
   *
   * {@see #startAutoRefresh}
   * {@see #stopAutoRefresh}
   */
  _removeVisibilityChangedCallback() {
    this._debug("#_removeVisibilityChangedCallback()");
    const e = this.visibilityChangedCallback;
    this.visibilityChangedCallback = null;
    try {
      e && B() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
    } catch (t) {
      console.error("removing visibilitychange callback failed", t);
    }
  }
  /**
   * This is the private implementation of {@link #startAutoRefresh}. Use this
   * within the library.
   */
  async _startAutoRefresh() {
    await this._stopAutoRefresh(), this._debug("#_startAutoRefresh()");
    const e = setInterval(() => this._autoRefreshTokenTick(), Se);
    this.autoRefreshTicker = e, e && typeof e == "object" && typeof e.unref == "function" ? e.unref() : typeof Deno < "u" && typeof Deno.unrefTimer == "function" && Deno.unrefTimer(e), setTimeout(async () => {
      await this.initializePromise, await this._autoRefreshTokenTick();
    }, 0);
  }
  /**
   * This is the private implementation of {@link #stopAutoRefresh}. Use this
   * within the library.
   */
  async _stopAutoRefresh() {
    this._debug("#_stopAutoRefresh()");
    const e = this.autoRefreshTicker;
    this.autoRefreshTicker = null, e && clearInterval(e);
  }
  /**
   * Starts an auto-refresh process in the background. The session is checked
   * every few seconds. Close to the time of expiration a process is started to
   * refresh the session. If refreshing fails it will be retried for as long as
   * necessary.
   *
   * If you set the {@link GoTrueClientOptions#autoRefreshToken} you don't need
   * to call this function, it will be called for you.
   *
   * On browsers the refresh process works only when the tab/window is in the
   * foreground to conserve resources as well as prevent race conditions and
   * flooding auth with requests. If you call this method any managed
   * visibility change callback will be removed and you must manage visibility
   * changes on your own.
   *
   * On non-browser platforms the refresh process works *continuously* in the
   * background, which may not be desirable. You should hook into your
   * platform's foreground indication mechanism and call these methods
   * appropriately to conserve resources.
   *
   * {@see #stopAutoRefresh}
   */
  async startAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._startAutoRefresh();
  }
  /**
   * Stops an active auto refresh process running in the background (if any).
   *
   * If you call this method any managed visibility change callback will be
   * removed and you must manage visibility changes on your own.
   *
   * See {@link #startAutoRefresh} for more details.
   */
  async stopAutoRefresh() {
    this._removeVisibilityChangedCallback(), await this._stopAutoRefresh();
  }
  /**
   * Runs the auto refresh token tick.
   */
  async _autoRefreshTokenTick() {
    this._debug("#_autoRefreshTokenTick()", "begin");
    try {
      await this._acquireLock(0, async () => {
        try {
          const e = Date.now();
          try {
            return await this._useSession(async (t) => {
              const { data: { session: s } } = t;
              if (!s || !s.refresh_token || !s.expires_at) {
                this._debug("#_autoRefreshTokenTick()", "no session");
                return;
              }
              const r = Math.floor((s.expires_at * 1e3 - e) / Se);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${Se}ms, refresh threshold is ${St} ticks`), r <= St && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Ys)
        this._debug("auto refresh token tick lock not available");
      else
        throw e;
    }
  }
  /**
   * Registers callbacks on the browser / platform, which in-turn run
   * algorithms when the browser window/tab are in foreground. On non-browser
   * platforms it assumes always foreground.
   */
  async _handleVisibilityChange() {
    if (this._debug("#_handleVisibilityChange()"), !B() || !(window != null && window.addEventListener))
      return this.autoRefreshToken && this.startAutoRefresh(), !1;
    try {
      this.visibilityChangedCallback = async () => await this._onVisibilityChanged(!1), window == null || window.addEventListener("visibilitychange", this.visibilityChangedCallback), await this._onVisibilityChanged(!0);
    } catch (e) {
      console.error("_handleVisibilityChange", e);
    }
  }
  /**
   * Callback registered with `window.addEventListener('visibilitychange')`.
   */
  async _onVisibilityChanged(e) {
    const t = `#_onVisibilityChanged(${e})`;
    this._debug(t, "visibilityState", document.visibilityState), document.visibilityState === "visible" ? (this.autoRefreshToken && this._startAutoRefresh(), e || (await this.initializePromise, await this._acquireLock(-1, async () => {
      if (document.visibilityState !== "visible") {
        this._debug(t, "acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");
        return;
      }
      await this._recoverAndRefresh();
    }))) : document.visibilityState === "hidden" && this.autoRefreshToken && this._stopAutoRefresh();
  }
  /**
   * Generates the relevant login URL for a third-party provider.
   * @param options.redirectTo A URL or mobile address to send the user to after they are confirmed.
   * @param options.scopes A space-separated list of scopes granted to the OAuth application.
   * @param options.queryParams An object of key-value pairs containing query parameters granted to the OAuth application.
   */
  async _getUrlForProvider(e, t, s) {
    const r = [`provider=${encodeURIComponent(t)}`];
    if (s != null && s.redirectTo && r.push(`redirect_to=${encodeURIComponent(s.redirectTo)}`), s != null && s.scopes && r.push(`scopes=${encodeURIComponent(s.scopes)}`), this.flowType === "pkce") {
      const [n, o] = await ye(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(n)}`,
        code_challenge_method: `${encodeURIComponent(o)}`
      });
      r.push(a.toString());
    }
    if (s != null && s.queryParams) {
      const n = new URLSearchParams(s.queryParams);
      r.push(n.toString());
    }
    return s != null && s.skipBrowserRedirect && r.push(`skip_http_redirect=${s.skipBrowserRedirect}`), `${e}?${r.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s;
        const { data: r, error: n } = t;
        return n ? { data: null, error: n } : await S(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
        });
      });
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s, r;
        const { data: n, error: o } = t;
        if (o)
          return { data: null, error: o };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: c } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return c ? { data: null, error: c } : (e.factorType === "totp" && (!((r = l == null ? void 0 : l.totp) === null || r === void 0) && r.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), { data: l, error: null });
      });
    } catch (t) {
      if (_(t))
        return { data: null, error: t };
      throw t;
    }
  }
  /**
   * {@see GoTrueMFAApi#verify}
   */
  async _verify(e) {
    return this._acquireLock(-1, async () => {
      try {
        return await this._useSession(async (t) => {
          var s;
          const { data: r, error: n } = t;
          if (n)
            return { data: null, error: n };
          const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), { data: o, error: a });
        });
      } catch (t) {
        if (_(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challenge}
   */
  async _challenge(e) {
    return this._acquireLock(-1, async () => {
      try {
        return await this._useSession(async (t) => {
          var s;
          const { data: r, error: n } = t;
          return n ? { data: null, error: n } : await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
          });
        });
      } catch (t) {
        if (_(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
  /**
   * {@see GoTrueMFAApi#challengeAndVerify}
   */
  async _challengeAndVerify(e) {
    const { data: t, error: s } = await this._challenge({
      factorId: e.factorId
    });
    return s ? { data: null, error: s } : await this._verify({
      factorId: e.factorId,
      challengeId: t.id,
      code: e.code
    });
  }
  /**
   * {@see GoTrueMFAApi#listFactors}
   */
  async _listFactors() {
    const { data: { user: e }, error: t } = await this.getUser();
    if (t)
      return { data: null, error: t };
    const s = (e == null ? void 0 : e.factors) || [], r = s.filter((o) => o.factor_type === "totp" && o.status === "verified"), n = s.filter((o) => o.factor_type === "phone" && o.status === "verified");
    return {
      data: {
        all: s,
        totp: r,
        phone: n
      },
      error: null
    };
  }
  /**
   * {@see GoTrueMFAApi#getAuthenticatorAssuranceLevel}
   */
  async _getAuthenticatorAssuranceLevel() {
    return this._acquireLock(-1, async () => await this._useSession(async (e) => {
      var t, s;
      const { data: { session: r }, error: n } = e;
      if (n)
        return { data: null, error: n };
      if (!r)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: o } = ht(r.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let l = a;
      ((s = (t = r.user.factors) === null || t === void 0 ? void 0 : t.filter((d) => d.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (l = "aal2");
      const u = o.amr || [];
      return { data: { currentLevel: a, nextLevel: l, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((a) => a.kid === e);
    if (s)
      return s;
    const r = Date.now();
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + Fn > r)
      return s;
    const { data: n, error: o } = await S(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (o)
      throw o;
    return !n.keys || n.keys.length === 0 || (this.jwks = n, this.jwks_cached_at = r, s = n.keys.find((a) => a.kid === e), !s) ? null : s;
  }
  /**
   * Extracts the JWT claims present in the access token by first verifying the
   * JWT against the server's JSON Web Key Set endpoint
   * `/.well-known/jwks.json` which is often cached, resulting in significantly
   * faster responses. Prefer this method over {@link #getUser} which always
   * sends a request to the Auth server for each JWT.
   *
   * If the project is not using an asymmetric JWT signing key (like ECC or
   * RSA) it always sends a request to the Auth server (similar to {@link
   * #getUser}) to verify the JWT.
   *
   * @param jwt An optional specific JWT you wish to verify, not the one you
   *            can obtain from {@link #getSession}.
   * @param options Various additional options that allow you to customize the
   *                behavior of this method.
   */
  async getClaims(e, t = {}) {
    try {
      let s = e;
      if (!s) {
        const { data: f, error: g } = await this.getSession();
        if (g || !f.session)
          return { data: null, error: g };
        s = f.session.access_token;
      }
      const { header: r, payload: n, signature: o, raw: { header: a, payload: l } } = ht(s);
      t != null && t.allowExpired || ci(n.exp);
      const c = !r.alg || r.alg.startsWith("HS") || !r.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(r.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!c) {
        const { error: f } = await this.getUser(s);
        if (f)
          throw f;
        return {
          data: {
            claims: n,
            header: r,
            signature: o
          },
          error: null
        };
      }
      const u = ui(r.alg), d = await crypto.subtle.importKey("jwk", c, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, d, o, Jn(`${a}.${l}`)))
        throw new Ct("Invalid JWT signature");
      return {
        data: {
          claims: n,
          header: r,
          signature: o
        },
        error: null
      };
    } catch (s) {
      if (_(s))
        return { data: null, error: s };
      throw s;
    }
  }
}
$e.nextInstanceID = 0;
const Ii = $e;
class Ai extends Ii {
  constructor(e) {
    super(e);
  }
}
var Ti = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class Pi {
  /**
   * Create a new client for use in the browser.
   * @param supabaseUrl The unique Supabase URL which is supplied when you create a new project in your project dashboard.
   * @param supabaseKey The unique Supabase Key which is supplied when you create a new project in your project dashboard.
   * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Supabase.
   * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
   * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
   * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
   * @param options.realtime Options passed along to realtime-js constructor.
   * @param options.storage Options passed along to the storage-js constructor.
   * @param options.global.fetch A custom fetch implementation.
   * @param options.global.headers Any additional headers to send with each network request.
   */
  constructor(e, t, s) {
    var r, n, o;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = jn(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const c = `sb-${l.hostname.split(".")[0]}-auth-token`, u = {
      db: Cn,
      realtime: An,
      auth: Object.assign(Object.assign({}, In), { storageKey: c }),
      global: En
    }, d = Rn(s ?? {}, u);
    this.storageKey = (r = d.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (n = d.global.headers) !== null && n !== void 0 ? n : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = d.auth) !== null && o !== void 0 ? o : {}, this.headers, d.global.fetch), this.fetch = On(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new Wr(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), this.storage = new wn(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new wr(this.functionsUrl.href, {
      headers: this.headers,
      customFetch: this.fetch
    });
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    return this.rest.from(e);
  }
  // NOTE: signatures must be kept in sync with PostgrestClient.schema
  /**
   * Select a schema to query or perform an function (rpc) call.
   *
   * The schema needs to be on the list of exposed schemas inside Supabase.
   *
   * @param schema - The schema to query
   */
  schema(e) {
    return this.rest.schema(e);
  }
  // NOTE: signatures must be kept in sync with PostgrestClient.rpc
  /**
   * Perform a function call.
   *
   * @param fn - The function name to call
   * @param args - The arguments to pass to the function call
   * @param options - Named parameters
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   * @param options.get - When set to `true`, the function will be called with
   * read-only access mode.
   * @param options.count - Count algorithm to use to count rows returned by the
   * function. Only applicable for [set-returning
   * functions](https://www.postgresql.org/docs/current/functions-srf.html).
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  rpc(e, t = {}, s = {}) {
    return this.rest.rpc(e, t, s);
  }
  /**
   * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
   *
   * @param {string} name - The name of the Realtime channel.
   * @param {Object} opts - The options to pass to the Realtime channel.
   *
   */
  channel(e, t = { config: {} }) {
    return this.realtime.channel(e, t);
  }
  /**
   * Returns all Realtime channels.
   */
  getChannels() {
    return this.realtime.getChannels();
  }
  /**
   * Unsubscribes and removes Realtime channel from Realtime client.
   *
   * @param {RealtimeChannel} channel - The name of the Realtime channel.
   *
   */
  removeChannel(e) {
    return this.realtime.removeChannel(e);
  }
  /**
   * Unsubscribes and removes all Realtime channels from Realtime client.
   */
  removeAllChannels() {
    return this.realtime.removeAllChannels();
  }
  _getAccessToken() {
    var e, t;
    return Ti(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: n, flowType: o, lock: a, debug: l }, c, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Ai({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), c),
      storageKey: n,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: s,
      storage: r,
      flowType: o,
      lock: a,
      debug: l,
      fetch: u,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new ln(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
  }
  _listenForAuthEvents() {
    return this.auth.onAuthStateChange((t, s) => {
      this._handleTokenChanged(t, "CLIENT", s == null ? void 0 : s.access_token);
    });
  }
  _handleTokenChanged(e, t, s) {
    (e === "TOKEN_REFRESHED" || e === "SIGNED_IN") && this.changedAccessToken !== s ? this.changedAccessToken = s : e === "SIGNED_OUT" && (this.realtime.setAuth(), t == "STORAGE" && this.auth.signOut(), this.changedAccessToken = void 0);
  }
}
const xi = (i, e, t) => new Pi(i, e, t);
function Oi() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const i = process.version.match(/^v(\d+)\./);
  return i ? parseInt(i[1], 10) <= 18 : !1;
}
Oi() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class Me {
  constructor(e, t) {
    p(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = xi(s, r);
  }
  async getCheckoutCampaign(e) {
    try {
      const { data: t, error: s } = await this.client.from("organizations_checkout_campaigns").select("*").eq("id", e).single();
      return s ? (console.error("Error fetching checkout campaign:", s), null) : t;
    } catch (t) {
      return console.error("Error fetching checkout campaign:", t), null;
    }
  }
  async submitCartSession(e) {
    try {
      const t = localStorage.getItem("ei_test"), s = {};
      t === "true" && (s.is_test = !0);
      const { data: r, error: n } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: { ...e, config: s }
        }
      );
      return n ? (console.error(
        "Error calling cart-checkout-session function:",
        n
      ), null) : r;
    } catch (t) {
      return console.error(
        "Error calling cart-checkout-session function:",
        t
      ), null;
    }
  }
  async deleteCartSession(e) {
    try {
      const { error: t } = await this.client.functions.invoke(
        "delete-checkout-session",
        {
          body: { session_id: e }
        }
      );
      return t ? (console.error(
        "Error calling delete-cart-session function:",
        t
      ), !1) : (console.log("Cart session deleted successfully:", e), !0);
    } catch (t) {
      return console.error("Error calling delete-cart-session function:", t), !1;
    }
  }
  /**
   * Record an assistant event via the `create-event` edge function.
   *
   * The `funnel_subscriber` variant is used for shortlink-open tracking:
   * the function resolves `id_short_encoded` to a funnel subscriber and
   * writes an `opened_link` event for them.
   */
  async createAssistantEvent(e) {
    try {
      const { error: t } = await this.client.functions.invoke(
        "create-event",
        {
          body: e
        }
      );
      return t ? (console.error("Error calling create-event function:", t), !1) : !0;
    } catch (t) {
      return console.error("Error calling create-event function:", t), !1;
    }
  }
  /**
   * Read back the restorable part of a cart session for the `?s=` id of an
   * abandoned-cart link. The session id and contact details are only
   * returned when `restoreToken` (the link's `rt`) matches.
   */
  async getCartRestore(e, t, s, r) {
    try {
      const { data: n, error: o } = await this.client.functions.invoke(
        "get-checkout-session-restore",
        {
          body: {
            id_short_encoded: e,
            restore_token: t ?? void 0,
            organization_id: s,
            checkout_campaign_id: r
          }
        }
      );
      if (o)
        return console.error(
          "Error calling get-checkout-session-restore function:",
          o
        ), null;
      const a = n;
      if (!a || !Array.isArray(a.products))
        return null;
      const l = (c) => typeof c == "string" && c ? c : null;
      return {
        ...a,
        session_id: l(a.session_id),
        email: l(a.email),
        phone: l(a.phone),
        phone_country_code: l(a.phone_country_code)
      };
    } catch (n) {
      return console.error(
        "Error calling get-checkout-session-restore function:",
        n
      ), null;
    }
  }
  async getPipelineCampaign(e) {
    try {
      const { data: t, error: s } = await this.client.from("organizations_pipelines_campaigns").select("*").eq("id", e).single();
      return s ? (console.error("Error fetching pipeline campaign:", s), null) : t;
    } catch (t) {
      return console.error("Error fetching pipeline campaign:", t), null;
    }
  }
  async runOrganizationPipeline(e) {
    try {
      const { error: t } = await this.client.functions.invoke(
        "run-organization-pipeline",
        {
          body: e
        }
      );
      return t ? (console.error(
        "Error calling run-organization-pipeline function:",
        t
      ), !1) : (console.log("Organization pipeline executed successfully"), !0);
    } catch (t) {
      return console.error(
        "Error calling run-organization-pipeline function:",
        t
      ), !1;
    }
  }
}
const D = class D {
  constructor(e) {
    this.channelId = e;
  }
  getToken() {
    var s;
    if (typeof document > "u")
      return null;
    const t = `; ${document.cookie}`.split(`; ${D.TOKEN_COOKIE}=`);
    return t.length === 2 && ((s = t.pop()) == null ? void 0 : s.split(";").shift()) || null;
  }
  /**
   * BookVisit issues a fresh token shortly after its app boots, so on a
   * restore link the cookie may not exist yet. Resolves null on abort.
   */
  waitForToken(e) {
    return new Promise((t) => {
      const s = () => {
        if (e.aborted) {
          t(null);
          return;
        }
        const r = this.getToken();
        if (r) {
          t(r);
          return;
        }
        setTimeout(s, D.TOKEN_POLL_MS);
      };
      s();
    });
  }
  async getBasket(e) {
    return this.request(
      `${D.BASKET_PATH}?IncludePaymentHistory=false&ChannelId=${encodeURIComponent(this.channelId)}`,
      { method: "GET" },
      e
    );
  }
  static basketHasRooms(e) {
    var s, r;
    const t = (r = (s = e == null ? void 0 : e.booking) == null ? void 0 : s.bookingData) == null ? void 0 : r.rooms;
    return Array.isArray(t) && t.length > 0;
  }
  async search(e, t) {
    const s = await this.request(
      D.SEARCH_PATH,
      {
        method: "POST",
        body: JSON.stringify({
          startDate: e.startDate,
          endDate: e.endDate,
          roomConfigs: e.roomConfigs,
          filter: {
            ...D.SEARCH_FILTER,
            ...e.promoCode ? { promoCode: e.promoCode } : {}
          },
          channelId: this.channelId
        })
      },
      t
    ), r = this.text(s == null ? void 0 : s.resultId);
    return !s || !r ? null : { resultId: r, hits: this.parseSearchHits(s) };
  }
  /**
   * Add one searched room to the basket. The first room of a basket is
   * added with `useExistingBasket: false`, which creates the basket.
   */
  async addRoom(e, t, s, r) {
    const n = await this.request(
      D.ADD_ROOM_PATH,
      {
        method: "PATCH",
        body: JSON.stringify({
          hitkey: e,
          nrOfUnits: 1,
          resultId: t,
          useExistingBasket: s,
          channelId: this.channelId
        })
      },
      r
    );
    return (n == null ? void 0 : n.success) !== !0 ? (n && console.error("BookVisit could not add room:", n.errorString), !1) : !0;
  }
  async request(e, t, s) {
    const r = this.getToken();
    if (!r)
      return console.warn("BookVisit JWT token not found in cookies"), null;
    try {
      const n = await fetch(`${D.API_BASE}${e}`, {
        ...t,
        credentials: "include",
        signal: s,
        headers: {
          authorization: `Bearer ${r}`,
          ...t.body ? { "content-type": "application/json" } : {}
        }
      });
      return n.ok ? await n.json() : (console.error(
        `BookVisit API error: ${n.status} ${n.statusText}`
      ), null);
    } catch (n) {
      return s != null && s.aborted || console.error(`BookVisit request to ${e} failed:`, n), null;
    }
  }
  /**
   * One entry per bookable `hitKey`: `roomsResult[].rateAlternatives[]
   * .ratesPerRoomConfig[]`. Member-only rates (`isLocked`) and packages
   * are left out, since the visitor cannot book them as a plain room.
   */
  parseSearchHits(e) {
    const t = /* @__PURE__ */ new Map();
    for (const r of Array.isArray(e == null ? void 0 : e.ratePlanContent) ? e.ratePlanContent : []) {
      const n = this.text((r == null ? void 0 : r.ratePlanId) ?? (r == null ? void 0 : r.id)), o = this.text(r == null ? void 0 : r.name);
      n && o && t.set(n, o);
    }
    const s = [];
    for (const r of Array.isArray(e == null ? void 0 : e.roomsResult) ? e.roomsResult : []) {
      const n = this.text(r == null ? void 0 : r.roomId);
      if (!(!n || r != null && r.isPackage))
        for (const o of Array.isArray(r.rateAlternatives) ? r.rateAlternatives : []) {
          if (o != null && o.packageId) continue;
          const a = this.text((o == null ? void 0 : o.rateplanId) ?? (o == null ? void 0 : o.ratePlanId)), l = (a ? t.get(a) : void 0) ?? this.text(o == null ? void 0 : o.displayName), c = this.text(o == null ? void 0 : o.currency) ?? this.text(e == null ? void 0 : e.currencyCode);
          for (const u of Array.isArray(o.ratesPerRoomConfig) ? o.ratesPerRoomConfig : []) {
            const d = this.text(u == null ? void 0 : u.hitKey);
            !d || (u == null ? void 0 : u.isLocked) === !0 || s.push({
              hitKey: d,
              roomId: n,
              ratePlanId: a,
              ratePlanName: l,
              price: this.amount(u == null ? void 0 : u.totalPrice),
              currency: c,
              roomConfig: this.roomConfig(u == null ? void 0 : u.roomConfig)
            });
          }
        }
    }
    return s;
  }
  amount(e) {
    const t = (e == null ? void 0 : e.priceInclVAT) ?? (e == null ? void 0 : e.displayPrice);
    return typeof t == "number" && isFinite(t) ? Math.round(t) : null;
  }
  roomConfig(e) {
    return !e || !Number.isInteger(e.adults) ? null : {
      adults: e.adults,
      childAges: Array.isArray(e.childAges) ? e.childAges : []
    };
  }
  text(e) {
    return typeof e == "string" && e.trim() ? e.trim() : typeof e == "number" && isFinite(e) ? String(e) : null;
  }
};
p(D, "API_BASE", "https://restapi.bookvisit.com"), p(D, "BASKET_PATH", "/baskets/basket-v1"), p(D, "SEARCH_PATH", "/accommodation/search-v1"), p(D, "ADD_ROOM_PATH", "/baskets/rooms/add-v1"), p(D, "TOKEN_COOKIE", "bv_jwt"), p(D, "TOKEN_POLL_MS", 200), p(D, "SEARCH_FILTER", {
  roomContent: "Full",
  packageContent: "Full",
  addOnContent: "Full",
  includeFullyBooked: !1,
  includeRooms: !0,
  includePackages: !1,
  includeSearchResultAlerts: !0
});
let De = D;
class qt {
  /**
   * The visitor's language code from browser settings ("en-US" -> "en",
   * "nb-NO" -> "nb"). Defaults to "en".
   */
  static getUserLocale() {
    return typeof navigator > "u" ? "en" : navigator.languages && navigator.languages.length > 0 ? navigator.languages[0].split("-")[0].toLowerCase() : navigator.language ? navigator.language.split("-")[0].toLowerCase() : "en";
  }
}
const ot = "assistantAnalyticsPayload", Li = "ei_enhanced_insights", Le = "ei_analytics", zt = "ei_insights", It = "ei_analytics_consent", ji = 3500, Ri = 10, $i = 3, Di = 50, Ni = 100, Ui = 8, Fi = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "gad_source",
  "gad_campaign",
  "fbclid",
  "ttclid",
  "msclkid",
  "twclid",
  "li_fat_id",
  "epik",
  "irclickid",
  "mc_cid",
  "ad_name"
], Mi = [
  "attribution_history",
  "touch_count",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_landing_page",
  "first_referrer",
  "first_date_visited",
  "enhanced_insights"
], Bi = 30 * 60 * 1e3;
function qi(i) {
  let e = 0, t = -1 / 0;
  const s = i.filter((r) => typeof r.enteredAt == "number").sort((r, n) => r.enteredAt - n.enteredAt);
  for (const r of s)
    r.enteredAt - t > Bi && (e += 1), t = Math.max(r.enteredAt, r.enteredAt + At(r));
  return e;
}
function zi() {
  try {
    if (typeof navigator > "u") return null;
    const i = String(navigator.userAgent ?? "");
    if (/ipad|tablet|playbook|silk/i.test(i) || /android(?!.*mobile)/i.test(i)) return "tablet";
    const e = navigator.userAgentData;
    return e && typeof e.mobile == "boolean" ? e.mobile ? "mobile" : "desktop" : /mobi|iphone|ipod|android|windows phone|opera mini/i.test(i) ? "mobile" : i ? "desktop" : null;
  } catch {
    return null;
  }
}
function At(i) {
  return typeof i.activeMs == "number" && i.activeMs > 0 ? i.activeMs : typeof i.leftAt == "number" && i.leftAt > i.enteredAt ? i.leftAt - i.enteredAt : 0;
}
let pe = {}, Ee = null, Ne = !0, ws = !1, V;
const Xs = [];
function Qs(i) {
  if (typeof document > "u") return [];
  const e = i + "=", t = [];
  for (const s of ("; " + document.cookie).split("; ")) {
    if (s.slice(0, e.length) !== e) continue;
    const r = s.slice(e.length).split(";")[0];
    if (r)
      try {
        t.push(decodeURIComponent(r));
      } catch {
      }
  }
  return t;
}
function Zs() {
  if (V !== void 0) return V;
  V = null;
  try {
    if (pe.cookieDomain)
      return V = pe.cookieDomain.replace(/^\./, ""), V;
    const i = window.location.hostname;
    if (!i || /^[\d.]+$/.test(i) || i === "localhost")
      return null;
    const e = i.split("."), t = "ei_domain_probe";
    for (let s = e.length - 2; s >= 0; s--) {
      const r = e.slice(s).join(".");
      if (document.cookie = `${t}=1; domain=.${r}; path=/; SameSite=Lax`, document.cookie.indexOf(`${t}=1`) !== -1)
        return document.cookie = `${t}=; domain=.${r}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`, V = r, V;
    }
  } catch {
  }
  return V;
}
function je(i, e) {
  try {
    const t = encodeURIComponent(JSON.stringify(e));
    if (t.length > ji) return !1;
    const s = Zs(), r = window.location.protocol === "https:" ? "; Secure" : "";
    return document.cookie = `${i}=${t}` + (s ? `; domain=.${s}` : "") + `; path=/; SameSite=Lax${r}`, !0;
  } catch {
    return !1;
  }
}
function Tt(i) {
  try {
    const e = Zs();
    document.cookie = `${i}=` + (e ? `; domain=.${e}` : "") + "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
  }
}
function er(i) {
  const e = [];
  for (const t of Qs(i))
    try {
      const s = JSON.parse(t);
      s && typeof s == "object" && !Array.isArray(s) && e.push(s);
    } catch {
    }
  return e;
}
function tr() {
  const i = {};
  for (const e of er(zt))
    for (const [t, s] of Object.entries(e)) {
      if (!s || typeof s != "object" || Array.isArray(s))
        continue;
      const r = i[t];
      r && String(s.last_visit_at ?? "") <= String(r.last_visit_at ?? "") || (i[t] = s);
    }
  return i;
}
function Hi(i) {
  if (je(Le, i)) return;
  const e = Je(i);
  for (let t = e.length - 1; t >= 2; t--) {
    const s = [e[0], ...e.slice(-(t - 1))];
    if (je(Le, xt(s)))
      return;
  }
  e.length > 1 && je(
    Le,
    xt([e[0], e[e.length - 1]])
  );
}
function Ki() {
  Tt(Le);
}
function Wi() {
  const i = er(Le);
  if (i.length === 0) return null;
  const e = (r) => {
    const n = Je(r), o = n[0], a = o && typeof o.date_visited == "string" ? o.date_visited : "";
    return { touches: n.length, at: a };
  };
  let t = i[0], s = e(t);
  for (const r of i.slice(1)) {
    const n = e(r);
    (n.touches > s.touches || n.touches === s.touches && !!n.at && (!s.at || n.at < s.at)) && (t = r, s = n);
  }
  return t;
}
function Vi() {
  const i = ar();
  if (!i) return null;
  const { visits: e, time_per_page: t, ...s } = i, r = {};
  return Object.entries(t ?? {}).sort((n, o) => o[1] - n[1]).slice(0, Ri).forEach(([n, o]) => {
    r[n] = o;
  }), { ...s, time_per_page: r };
}
function Gi() {
  try {
    if (typeof window > "u" || pe.shareInsightsAcrossSubdomains === !1 || !at())
      return;
    const i = Vi();
    if (!i) return;
    const e = window.location.hostname, t = tr();
    let s = Object.entries(t).filter(([n, o]) => n !== e && o && typeof o == "object").sort(
      (n, o) => {
        var a, l;
        return String(((a = n[1]) == null ? void 0 : a.last_visit_at) ?? "").localeCompare(
          String(((l = o[1]) == null ? void 0 : l.last_visit_at) ?? "")
        );
      }
    );
    s = s.slice(
      Math.max(0, s.length - ($i - 1))
    );
    let r = i;
    for (; ; ) {
      const n = {};
      for (const [a, l] of s) n[a] = l;
      if (n[e] = r, je(zt, n)) return;
      if (s.length > 0) {
        s = s.slice(1);
        continue;
      }
      if (r.time_per_page) {
        const { time_per_page: a, ...l } = r;
        r = l;
        continue;
      }
      const o = typeof r.pages == "string" ? r.pages : "";
      if (o) {
        const a = o.split(",");
        r = {
          ...r,
          pages: a.slice(Math.ceil(a.length / 2)).join(",")
        };
        continue;
      }
      return;
    }
  } catch {
  }
}
function Ji() {
  if (typeof window > "u") return [];
  const i = tr(), e = window.location.hostname;
  return Object.entries(i).filter(
    ([t, s]) => t !== e && s && typeof s == "object" && !Array.isArray(s)
  ).map(([, t]) => t);
}
function Yi(i, e) {
  if (e.length === 0) return i;
  const t = i ? [i, ...e] : e, s = (h) => typeof h == "number" && isFinite(h) ? h : 0;
  let r = 0, n = 0, o = 0;
  const a = [], l = {};
  let c = null, u = null;
  for (const h of t) {
    r += s(h.visit_count), n += s(h.session_count), o += s(h.total_time_seconds), typeof h.pages == "string" && h.pages.split(",").forEach((m) => {
      m && a.indexOf(m) === -1 && a.push(m);
    });
    const f = h.time_per_page;
    if (f && typeof f == "object" && !Array.isArray(f))
      for (const [m, b] of Object.entries(
        f
      ))
        l[m] = (l[m] ?? 0) + s(b);
    const g = typeof h.first_visit_at == "string" ? h.first_visit_at : null, v = typeof h.last_visit_at == "string" ? h.last_visit_at : null;
    g && (!c || g < c) && (c = g), v && (!u || v > u) && (u = v);
  }
  const d = {
    time_per_page: l,
    visit_count: r,
    unique_pages: a.length,
    total_time_seconds: o,
    pages: a.join(",")
  };
  return t.every((h) => typeof h.session_count == "number") && (d.session_count = n), c && (d.first_visit_at = c), u && (d.last_visit_at = u), i && Array.isArray(i.visits) && (d.visits = i.visits), d;
}
function sr() {
  try {
    const i = window, e = i.Cookiebot;
    if (e && e.consent && typeof e.consent.statistics == "boolean" && e.hasResponse)
      return !!(e.consent.statistics || e.consent.marketing);
    if (typeof i.OnetrustActiveGroups == "string" && i.OnetrustActiveGroups)
      return /C0002|C0004/.test(i.OnetrustActiveGroups);
  } catch {
  }
  return null;
}
function Xi() {
  if (ws || typeof window > "u") return;
  ws = !0;
  const i = () => {
    const e = sr();
    e === !0 ? Re(!0) : e === !1 && Re(!1);
  };
  try {
    window.addEventListener("CookiebotOnConsentReady", i), window.addEventListener("CookiebotOnAccept", i), window.addEventListener("CookiebotOnDecline", i), window.addEventListener("OneTrustGroupsUpdated", i);
    const e = window.__tcfapi;
    typeof e == "function" && e("addEventListener", 2, (t, s) => {
      var r, n;
      !s || !t || (t.eventStatus === "tcloaded" || t.eventStatus === "useractioncomplete") && Re(!!((n = (r = t.purpose) == null ? void 0 : r.consents) != null && n[1]));
    });
  } catch {
  }
}
function at() {
  return rr() ? !1 : !pe.requireConsent || Ne;
}
function rr() {
  return Qs(It).indexOf("0") !== -1;
}
function nr(i) {
  Xs.push(i);
}
function Re(i) {
  const e = i !== Ne;
  if (Ne = i, i)
    Tt(It), ir();
  else {
    je(It, 0), Ki(), Tt(zt);
    try {
      sessionStorage.removeItem(ot);
    } catch {
    }
  }
  if (e)
    for (const t of Xs)
      try {
        t(i);
      } catch {
      }
}
function Qi() {
  const i = {};
  for (const [e, t] of new URL(
    window.location.href
  ).searchParams.entries())
    i[e] = t;
  return {
    ...i,
    landing_page: window.location.origin + window.location.pathname,
    date_visited: (/* @__PURE__ */ new Date()).toISOString(),
    referrer: document.referrer
  };
}
function Pt(i) {
  return Fi.filter((e) => i[e] !== void 0).map((e) => e + "=" + String(i[e])).join("&");
}
function Je(i) {
  if (!i) return [];
  const e = i.attribution_history;
  if (Array.isArray(e))
    return e.filter(
      (s) => !!s && typeof s == "object" && !Array.isArray(s)
    );
  const t = {};
  for (const [s, r] of Object.entries(i))
    Mi.indexOf(s) === -1 && (t[s] = r);
  return Object.keys(t).length > 0 ? [t] : [];
}
function Zi(...i) {
  const e = /* @__PURE__ */ new Set(), t = [];
  for (const s of i)
    for (const r of s) {
      const n = String(r.date_visited ?? "") + "|" + Pt(r);
      e.has(n) || (e.add(n), t.push(r));
    }
  return t.sort(
    (s, r) => String(s.date_visited ?? "").localeCompare(String(r.date_visited ?? ""))
  );
}
function eo(i) {
  return i.length <= Ui ? i : [i[0], ...i.slice(-7)];
}
function to(i, e) {
  if (i.length === 0) return [e];
  const t = Pt(e);
  return !t || t === Pt(i[i.length - 1]) ? i : eo([...i, e]);
}
function xt(i) {
  if (i.length === 0) return {};
  const e = i[0], s = { ...i[i.length - 1] }, r = (n, o) => {
    e[o] !== void 0 && (s[n] = e[o]);
  };
  return r("first_utm_source", "utm_source"), r("first_utm_medium", "utm_medium"), r("first_utm_campaign", "utm_campaign"), r("first_landing_page", "landing_page"), r("first_referrer", "referrer"), r("first_date_visited", "date_visited"), s.touch_count = i.length, s.attribution_history = i, s;
}
function ir() {
  if (!(typeof window > "u" || !Ee) && !rr())
    try {
      window.sessionStorage && sessionStorage.setItem(
        ot,
        JSON.stringify(Ee)
      ), Hi(Ee);
    } catch {
    }
}
function so(i) {
  if (!(typeof window > "u")) {
    pe = i ?? {}, V = void 0;
    try {
      const e = window.sessionStorage ? sessionStorage.getItem(ot) : null;
      let t = null;
      if (e) {
        const r = JSON.parse(e);
        r && typeof r == "object" && !Array.isArray(r) && (t = r);
      }
      const s = to(
        Zi(
          Je(t),
          Je(Wi())
        ),
        Qi()
      );
      if (Ee = xt(s), pe.requireConsent) {
        Xi();
        const r = sr();
        r === null ? Ne = !1 : Re(r);
      } else
        Ne = !0, ir();
    } catch {
    }
  }
}
function or(i) {
  let e = i.trim();
  if (!e) return "";
  const t = e.search(/[?#]/);
  return t >= 0 && (e = e.slice(0, t)), e.startsWith("/") || (e = "/" + e), e.length > 1 && e.endsWith("/") && (e = e.slice(0, -1)), e;
}
function ro(i) {
  return or(i).replace(/\./g, "_");
}
function ar() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const i = window.localStorage.getItem(Li);
    if (!i) return null;
    const e = JSON.parse(i), t = Array.isArray(e == null ? void 0 : e.visits) ? e.visits.filter(
      (c) => c && typeof c.page == "string" && typeof c.enteredAt == "number"
    ) : [], s = t[0], r = t[t.length - 1];
    if (!s || !r) return null;
    const n = [];
    for (const c of t) {
      const u = or(c.page);
      u && n.indexOf(u) === -1 && n.push(u);
    }
    const o = t.reduce((c, u) => c + At(u), 0), a = {};
    for (const c of t) {
      const u = ro(c.page);
      u && (a[u] = (a[u] ?? 0) + At(c));
    }
    const l = {};
    return Object.entries(a).slice(0, Ni).forEach(([c, u]) => {
      l[c] = Math.round(u / 1e3);
    }), {
      time_per_page: l,
      visits: t.slice(-Di),
      visit_count: t.length,
      session_count: qi(t),
      unique_pages: n.length,
      total_time_seconds: Math.round(o / 1e3),
      pages: n.join(","),
      first_visit_at: new Date(s.enteredAt).toISOString(),
      last_visit_at: new Date(r.enteredAt).toISOString()
    };
  } catch {
    return null;
  }
}
function no() {
  try {
    if (!at()) return null;
    let i = {};
    if (typeof window < "u" && window.sessionStorage) {
      const s = sessionStorage.getItem(ot);
      if (s) {
        const r = JSON.parse(s);
        r && typeof r == "object" && (i = r);
      }
    }
    Object.keys(i).length === 0 && Ee && (i = { ...Ee });
    let e = ar();
    pe.shareInsightsAcrossSubdomains !== !1 && (e = Yi(
      e,
      Ji()
    )), e && (i.enhanced_insights = e);
    const t = zi();
    return t && (i.device = t), Object.keys(i).length > 0 ? JSON.stringify(i) : null;
  } catch {
    return null;
  }
}
const Ye = "ei_stay_params", io = 7 * 24 * 60 * 60 * 1e3, oo = 12 * 60 * 60 * 1e3, ao = 60, lo = 864e5, co = [
  ["from", "to", "MDY"],
  // Elina listing pages: US order
  ["start", "end", "DMY"],
  // Elina listing pages: Norwegian order
  ["checkin", "checkout", "DMY"],
  ["check_in", "check_out", "DMY"],
  ["arrival", "departure", "DMY"],
  ["fromDate", "toDate", "DMY"],
  ["startDate", "endDate", "DMY"]
];
let Xe = !0, ae = null, Ss = !1, ks = !1;
const Es = (i) => i < 10 ? "0" + i : String(i);
function Ke(i, e, t) {
  if (i < 2e3 || i > 2100 || e < 1 || e > 12 || t < 1 || t > 31) return null;
  const s = new Date(Date.UTC(i, e - 1, t));
  return s.getUTCMonth() !== e - 1 || s.getUTCDate() !== t ? null : `${i}-${Es(e)}-${Es(t)}`;
}
function Cs(i, e) {
  const t = i.trim();
  let s = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(t);
  if (s) {
    const h = Ke(+s[1], +s[2], +s[3]);
    return h ? [h] : [];
  }
  if (s = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t), !s) return [];
  const r = +s[1], n = +s[2], o = +s[3];
  if (t.charAt(s[1].length) === ".") {
    const h = Ke(o, n, r);
    return h ? [h] : [];
  }
  const l = Ke(o, n, r), c = Ke(o, r, n), u = [], d = e === "DMY" ? [l, c] : [c, l];
  for (const h of d)
    h && u.indexOf(h) === -1 && u.push(h);
  return u;
}
function lr(i, e) {
  const [t, s, r] = i.split("-").map(Number), [n, o, a] = e.split("-").map(Number);
  return Math.round(
    (Date.UTC(n, o - 1, a) - Date.UTC(t, s - 1, r)) / lo
  );
}
const cr = (i, e) => {
  const t = lr(i, e);
  return t >= 1 && t <= ao;
}, gt = (i) => {
  if (i == null) return;
  const e = Number(i.trim());
  return Number.isInteger(e) && e >= 0 && e <= 99 ? e : void 0;
};
function uo(i) {
  let e;
  try {
    e = new URL(i);
  } catch {
    return null;
  }
  const t = e.searchParams, s = [];
  for (const [c, u, d] of co) {
    const h = t.get(c), f = t.get(u);
    if (!h || !f) continue;
    const g = Cs(h, d), v = Cs(f, d), m = [];
    for (const b of g)
      for (const E of v)
        cr(b, E) && m.push({ checkin: b, checkout: E });
    m.length > 0 && s.push(m);
  }
  if (s.length === 0) return null;
  let r = null;
  if (s.length > 1) {
    e: for (const c of s)
      for (const u of c)
        if (s.some(
          (h) => h !== c && h.some(
            (f) => f.checkin === u.checkin && f.checkout === u.checkout
          )
        )) {
          r = u;
          break e;
        }
  }
  r || (r = s[0][0]);
  const n = {
    checkin: r.checkin,
    checkout: r.checkout,
    captured_at: (/* @__PURE__ */ new Date()).toISOString(),
    url: e.origin + e.pathname
  }, o = gt(t.get("adults")), a = gt(t.get("children")), l = gt(t.get("guests"));
  return o !== void 0 ? n.adults = o : l !== void 0 && (n.adults = l), a !== void 0 && (n.children = a), n;
}
const ur = (i, e = Date.now()) => {
  const t = Date.parse(i.captured_at);
  return Number.isFinite(t) && e - t >= 0 && e - t <= io;
};
function ho() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const i = window.localStorage.getItem(Ye);
    if (!i) return null;
    const e = JSON.parse(i);
    if (!e || typeof e != "object" || typeof e.checkin != "string" || typeof e.checkout != "string" || typeof e.captured_at != "string")
      return null;
    const t = e;
    return !ur(t) || !cr(t.checkin, t.checkout) ? (window.localStorage.removeItem(Ye), null) : t;
  } catch {
    return null;
  }
}
function dr() {
  var i;
  if (!(typeof window > "u" || !ae) && at())
    try {
      (i = window.localStorage) == null || i.setItem(
        Ye,
        JSON.stringify(ae)
      );
    } catch {
    }
}
function hr() {
  try {
    typeof window < "u" && window.localStorage && window.localStorage.removeItem(Ye);
  } catch {
  }
}
function Ot() {
  if (!Xe || typeof window > "u") return null;
  try {
    const i = uo(window.location.href);
    return i && (ae = i, dr()), i;
  } catch {
    return null;
  }
}
function fo(i) {
  if (Xe = (i == null ? void 0 : i.enabled) !== !1, !(!Xe || typeof window > "u")) {
    if (Ot(), !ks) {
      ks = !0;
      try {
        window.addEventListener("popstate", () => {
          Ot();
        });
      } catch {
      }
    }
    Ss || (Ss = !0, nr((e) => {
      e ? dr() : hr();
    }));
  }
}
function po() {
  if (!Xe) return null;
  const i = Ot();
  if (i) return i;
  if (ae && ur(ae)) return ae;
  const e = ho();
  return e && (ae = e), e;
}
function go() {
  ae = null, hr();
}
function mo(i, e, t = oo) {
  if (!e || !Array.isArray(i) || i.length === 0)
    return i;
  const s = Date.parse(e.captured_at);
  if (!Number.isFinite(s) || Date.now() - s > t)
    return i;
  let r = !1;
  const n = lr(e.checkin, e.checkout), o = i.map((a) => !a || typeof a != "object" || a.startDate || a.endDate || String(a.type ?? "").toLowerCase() === "addon" ? a : (r = !0, {
    ...a,
    startDate: e.checkin,
    endDate: e.checkout,
    nights: n,
    ei_stay_source: "url"
  }));
  return r ? o : i;
}
let Is = !1;
const H = class H {
  constructor(e) {
    p(this, "options");
    p(this, "supabaseService");
    p(this, "inputDetector");
    p(this, "productDetector");
    p(this, "totalExtractor");
    p(this, "campaign");
    p(this, "totalAverage", 0);
    p(this, "_sessionId");
    p(this, "isInitialized", !1);
    p(this, "previousContent", {});
    p(this, "previousProducts", []);
    p(this, "previousTotal", 0);
    p(this, "debounceTimer");
    p(this, "pendingContentUpdate");
    p(this, "isSubmitting", !1);
    // Lock to prevent concurrent submissions
    // Our injected autofield section and its per-field wrappers. Kept in
    // memory while off the page so typed values survive being re-added.
    p(this, "autofieldSection");
    p(this, "autofieldWrappers", []);
    p(this, "autofieldObserver");
    p(this, "boundHandleAutofieldBlur", (e) => this.handleAutofieldBlur(e));
    p(this, "boundSaveAutofieldToStorage", (e) => {
      const t = e.target, s = H.AUTOFIELD_STORAGE_KEYS[t.name];
      s && t.value && this.saveToSessionStorage(s, t.value);
    });
    this.options = e, this.supabaseService = new Me(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    var e, t, s;
    if (this.isInitialized)
      return !0;
    try {
      if (this.loadSessionIdFromStorage(), (e = this.options.config) != null && e.completedCheckout && this._sessionId)
        return await this.handleCompletedCheckout(), !0;
      const r = await this.supabaseService.getCheckoutCampaign(
        this.options.checkoutCampaignId
      );
      return this.totalAverage = r != null && r.average_checkout_value ? r.average_checkout_value : 0, r ? (this.campaign = r, this.inputDetector = new We(r.input_mapping), r.type !== "bookvisit" && r.type !== "synxis" && r.type !== "elinapms" && (this.productDetector = new mr(
        r.product_mapping
      ), this.totalExtractor = new vr(
        r.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), r.type === "bookvisit" && ((s = (t = r.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0 && window.location.pathname === "/checkout" && !Is && (Is = !0, this.injectBookVisitAutofields(r.input_mapping)), this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch checkout campaign data"), !1);
    } catch (r) {
      return console.error("Failed to initialize abandoned cart tool:", r), !1;
    }
  }
  /**
   * Debounced version of handleContentUpdate to prevent multiple rapid calls
   * from auto-fill operations from creating multiple session IDs
   */
  debouncedHandleContentUpdate(e, t) {
    this.pendingContentUpdate = { content: e, sessionId: t }, this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
      if (this.pendingContentUpdate) {
        const s = this.pendingContentUpdate;
        this.pendingContentUpdate = void 0, this.handleContentUpdate(s.content, s.sessionId);
      }
    }, 300);
  }
  async handleContentUpdate(e, t) {
    var s, r, n, o, a, l, c, u, d, h;
    if (this.isSubmitting) {
      this.pendingContentUpdate = { content: e, sessionId: t }, this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
        if (this.pendingContentUpdate) {
          const f = this.pendingContentUpdate;
          this.pendingContentUpdate = void 0, this.handleContentUpdate(
            f.content,
            f.sessionId
          );
        }
      }, 100);
      return;
    }
    this.isSubmitting = !0;
    try {
      let f = [], g = this.totalAverage;
      if (((s = this.campaign) == null ? void 0 : s.type) === "bookvisit") {
        const C = await this.withBasketTimeout(
          this.fetchBookVisitBasket()
        );
        C && (f = C.products, g = C.total);
      } else if (((r = this.campaign) == null ? void 0 : r.type) === "synxis") {
        const C = await this.withBasketTimeout(
          this.fetchSynxisBasket()
        );
        C && (f = C.products, g = C.total);
      } else if (((n = this.campaign) == null ? void 0 : n.type) === "elinapms") {
        const C = await this.fetchElinapmsBasket();
        C && (f = C.products, g = C.total);
      } else
        f = ((o = this.productDetector) == null ? void 0 : o.detectProducts()) || [], g = ((a = this.totalExtractor) == null ? void 0 : a.extractTotal()) || this.totalAverage;
      const v = ((l = this.options.features) == null ? void 0 : l.stayCapture) === !1 ? null : po();
      if (f = mo(f, v), !this.hasContentChanged(
        e,
        f,
        g
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const b = typeof window < "u" ? window.location.href : "", E = this._sessionId || t, y = this.withStay(no(), v), w = { ...e }, P = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: w,
        products: f,
        url: b,
        total: g,
        id: E,
        ...y ? { analytics: y } : {},
        ...((c = this.campaign) == null ? void 0 : c.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {},
        ...((d = this.campaign) == null ? void 0 : d.type) === "bookvisit" && this._bookvisitSessionIds ? { metadata: this._bookvisitSessionIds } : {}
      }, k = await this.supabaseService.submitCartSession(P);
      k && k.id ? (this._sessionId = k.id, (h = this.inputDetector) == null || h.setSessionId(k.id), H.saveSessionIdToStorage(k.id), this.previousContent = w, this.previousProducts = [...f], this.previousTotal = g, console.log("Cart session updated successfully:", k.id)) : console.error("Failed to submit cart session");
    } catch (f) {
      console.error("Error handling content update:", f);
    } finally {
      this.isSubmitting = !1;
    }
  }
  /**
   * Add the captured stay to the analytics JSON as `ei_stay`, next to
   * `enhanced_insights`. Only when analytics is being sent at all (consent),
   * so the stay never travels on its own.
   */
  withStay(e, t) {
    if (!e || !t) return e;
    try {
      const s = JSON.parse(e);
      return !s || typeof s != "object" ? e : (s.ei_stay = t, JSON.stringify(s));
    } catch {
      return e;
    }
  }
  /**
   * The submission lock is held while the basket is fetched, so a basket
   * request that hangs must not hold it indefinitely. On timeout the update
   * goes out without basket data — the same path as a failed basket fetch.
   */
  async withBasketTimeout(e) {
    let t;
    const s = new Promise((r) => {
      t = setTimeout(() => {
        console.warn("Basket fetch timed out, continuing without it"), r(null);
      }, H.BASKET_FETCH_TIMEOUT_MS);
    });
    try {
      return await Promise.race([e, s]);
    } finally {
      t && clearTimeout(t);
    }
  }
  hasContentChanged(e, t, s) {
    if (Object.keys(this.previousContent).length === 0 && this.previousProducts.length === 0 && this.previousTotal === 0)
      return !0;
    const r = JSON.stringify(e) !== JSON.stringify(this.previousContent), n = JSON.stringify(t) !== JSON.stringify(this.previousProducts), o = s !== this.previousTotal;
    return r || n || o;
  }
  destroy() {
    this.debounceTimer && (clearTimeout(this.debounceTimer), this.debounceTimer = void 0), this._urlCheckInterval && (clearInterval(this._urlCheckInterval), this._urlCheckInterval = void 0), this.stopSyncingAutofields(), this._iframeObserver && (this._iframeObserver.disconnect(), this._iframeObserver = void 0), this.pendingContentUpdate && (this.handleContentUpdate(
      this.pendingContentUpdate.content,
      this.pendingContentUpdate.sessionId
    ), this.pendingContentUpdate = void 0), this.inputDetector && this.inputDetector.stopListening(), this.isInitialized = !1, this._sessionId = void 0, this.isSubmitting = !1, this.clearSessionIdFromStorage();
  }
  getContent() {
    var e;
    return ((e = this.inputDetector) == null ? void 0 : e.getContent()) || {};
  }
  hasEmailOrPhone() {
    var e;
    return ((e = this.inputDetector) == null ? void 0 : e.hasEmailOrPhoneNumber()) || !1;
  }
  getSessionId() {
    return this._sessionId;
  }
  /**
   * Reset the change tracking to force the next update to be uploaded
   * Useful for testing or when you want to ensure the latest data is uploaded
   */
  resetChangeTracking() {
    this.previousContent = {}, this.previousProducts = [], this.previousTotal = 0, console.log("Change tracking reset - next update will be uploaded");
  }
  /**
   * Load session ID from localStorage
   */
  loadSessionIdFromStorage() {
    if (typeof window < "u" && window.localStorage)
      try {
        const e = localStorage.getItem("ei_session_id");
        e && (this._sessionId = e, console.log(
          "Loaded session ID from localStorage:",
          e
        ));
      } catch (e) {
        console.warn(
          "Failed to load session ID from localStorage:",
          e
        );
      }
  }
  /**
   * Save session ID to localStorage. Public so a restored cart can adopt
   * its original session before this tool initializes.
   */
  static saveSessionIdToStorage(e) {
    if (typeof window < "u" && window.localStorage)
      try {
        localStorage.setItem("ei_session_id", e), console.log("Saved session ID to localStorage:", e);
      } catch (t) {
        console.warn(
          "Failed to save session ID to localStorage:",
          t
        );
      }
  }
  /**
   * Clear session ID from localStorage
   */
  clearSessionIdFromStorage() {
    if (typeof window < "u" && window.localStorage)
      try {
        localStorage.removeItem("ei_session_id"), console.log("Cleared session ID from localStorage");
      } catch (e) {
        console.warn(
          "Failed to clear session ID from localStorage:",
          e
        );
      }
  }
  /**
   * Handle completed checkout by deleting the session from database and clearing localStorage
   */
  async handleCompletedCheckout() {
    if (!this._sessionId) {
      console.log("No session ID found for completed checkout cleanup");
      return;
    }
    try {
      await this.supabaseService.deleteCartSession(
        this._sessionId
      ) ? console.log(
        "Successfully deleted completed checkout session:",
        this._sessionId
      ) : console.warn(
        "Failed to delete completed checkout session from database"
      );
    } catch (e) {
      console.error("Error deleting completed checkout session:", e);
    } finally {
      this.clearSessionIdFromStorage(), this._sessionId = void 0, go(), console.log("Completed checkout cleanup finished");
    }
  }
  /**
   * Fetch basket data from BookVisit API
   */
  async fetchBookVisitBasket() {
    var t, s;
    if (!this.campaign || this.campaign.type !== "bookvisit")
      return null;
    const e = (s = (t = this.campaign.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.channel_id;
    if (!e)
      return console.error("BookVisit channel_id not found in campaign config"), null;
    try {
      const r = await new De(e).getBasket();
      if (!r)
        return null;
      const n = this.getBookVisitSessionIds(r);
      return n && (this._bookvisitSessionIds = n), this.extractBookVisitProductsAndTotal(r);
    } catch (r) {
      return console.error("Error fetching BookVisit basket:", r), null;
    }
  }
  /**
   * Identifiers of a BookVisit basket: the basket/booking id from the API
   * response (field names differ between API versions, so several are
   * tried), plus `sbe_rc`/`basketId` from the page URL when present.
   * Never throws; null when nothing was found.
   */
  getBookVisitSessionIds(e) {
    var t, s, r, n;
    try {
      const o = (g) => typeof g == "string" && g.trim() ? g.trim() : typeof g == "number" && isFinite(g) ? String(g) : null, a = (e == null ? void 0 : e.booking) ?? {}, l = (a == null ? void 0 : a.bookingData) ?? {}, c = o(a == null ? void 0 : a.basketId) ?? o(a == null ? void 0 : a.id) ?? o(l == null ? void 0 : l.basketId) ?? o(e == null ? void 0 : e.basketId) ?? o(e == null ? void 0 : e.id), u = o(l == null ? void 0 : l.bookingNumber) ?? o(l == null ? void 0 : l.bookingCode) ?? o(l == null ? void 0 : l.reservationNumber) ?? o(a == null ? void 0 : a.bookingNumber) ?? o(a == null ? void 0 : a.bookingCode), d = o((t = l == null ? void 0 : l.customer) == null ? void 0 : t.countryCode) ?? o((s = l == null ? void 0 : l.customer) == null ? void 0 : s.country) ?? o((r = l == null ? void 0 : l.guest) == null ? void 0 : r.countryCode) ?? o((n = a == null ? void 0 : a.customer) == null ? void 0 : n.countryCode);
      let h = null, f = null;
      if (typeof window < "u") {
        const g = new URLSearchParams(window.location.search);
        if (h = g.get("sbe_rc") ?? g.get("sbeRc"), h)
          try {
            f = atob(h);
          } catch {
            f = null;
          }
      }
      return !c && !u && !h ? null : {
        shoppingCartId: c,
        sbeRc: h,
        sbeRcDecoded: f,
        bookingReference: u,
        guestCountry: d
      };
    } catch {
      return null;
    }
  }
  /**
   * Extract products and total from BookVisit API response
   */
  extractBookVisitProductsAndTotal(e) {
    var r, n, o;
    const t = [];
    let s = 0;
    try {
      const a = (r = e == null ? void 0 : e.booking) == null ? void 0 : r.bookingData;
      if (!a)
        return { products: t, total: s };
      s = a.totalPrice || 0;
      const l = typeof ((n = a.customer) == null ? void 0 : n.countryCode) == "string" ? a.customer.countryCode : typeof ((o = a.customer) == null ? void 0 : o.country) == "string" ? a.customer.country : void 0, c = a.rooms || [], u = a.roomDescriptions || [], d = a.addOnDescriptions || [];
      c.forEach((f) => {
        var w, P, k, C;
        const g = u.find(
          (R) => R.id === f.roomId
        ), v = f.totalPrice || 0, m = (P = (w = g == null ? void 0 : g.images) == null ? void 0 : w[0]) == null ? void 0 : P.uri, b = (k = g == null ? void 0 : g.images) == null ? void 0 : k.map(
          (R) => R.uri
        ), E = {
          id: f.roomId,
          name: (g == null ? void 0 : g.name) || "Room",
          price: v,
          quantity: 1,
          type: "room",
          startDate: f.startDate,
          endDate: f.endDate,
          roomConfig: f.roomConfig,
          image: m,
          images: b,
          ...l ? { guestCountry: l } : {}
        };
        if (f.priceInfo && f.priceInfo.length > 0) {
          const R = f.priceInfo[0].ratePlanId;
          R && (E.ratePlanId = R);
          const Q = (C = a.ratePlanDescriptions) == null ? void 0 : C.find(
            (K) => K.id === R
          );
          Q && (E.ratePlan = Q.name);
        }
        t.push(E), (f.mandatoryAddOns || []).forEach((R) => {
          const Q = R.totalPrice || 0;
          if (Q > 0) {
            const K = d.find(
              (Z) => Z.id === R.addOnId
            );
            t.push({
              id: R.addOnId,
              name: (K == null ? void 0 : K.name) || "Add-on",
              price: Q,
              quantity: R.numberOfUnits || 1,
              type: "addon",
              roomId: f.roomId,
              date: R.date
            });
          }
        });
      }), (a.optionalAddOns || []).forEach((f) => {
        const g = f.totalPrice || 0;
        if (g > 0) {
          const v = d.find(
            (m) => m.id === f.addOnId
          );
          t.push({
            id: f.addOnId,
            name: (v == null ? void 0 : v.name) || "Add-on",
            price: g,
            quantity: f.numberOfUnits || 1,
            type: "addon",
            roomId: f.roomId,
            date: f.date
          });
        }
      });
    } catch (a) {
      console.error(
        "Error extracting BookVisit products and total:",
        a
      );
    }
    return { products: t, total: s };
  }
  /**
   * Inject autofields for BookVisit campaigns
   */
  injectBookVisitAutofields(e) {
    if (typeof document > "u")
      return;
    const t = this.getFieldsToInclude(e);
    if (t.length === 0) {
      console.log(
        "No relevant fields found in input_mapping for autofields"
      );
      return;
    }
    const s = document.createElement("template");
    s.innerHTML = this.createBookVisitFormSection(t), this.autofieldSection = s.content.querySelector(
      "[data-ei-autofields]"
    ), this.autofieldWrappers = Array.from(
      this.autofieldSection.querySelectorAll(
        "[data-ei-autofield]"
      )
    ), typeof MutationObserver < "u" && (this.autofieldObserver = new MutationObserver(
      () => this.syncAutofields()
    ), this.autofieldObserver.observe(document.body, {
      childList: !0,
      subtree: !0
    })), this.syncAutofields();
  }
  /**
   * Stop keeping our autofields in sync with the page
   */
  stopSyncingAutofields() {
    var e;
    (e = this.autofieldObserver) == null || e.disconnect(), this.autofieldObserver = void 0;
  }
  /**
   * Put each of our autofields on the page when BookVisit does not render
   * its own version of it, and take it off when BookVisit does
   */
  syncAutofields() {
    const e = this.autofieldSection;
    if (!e)
      return;
    if (window.location.pathname !== "/checkout") {
      this.stopSyncingAutofields(), e.remove();
      return;
    }
    const t = document.getElementById("main_content_container");
    if (!t)
      return;
    let s = !1;
    const r = e.querySelector(
      "[data-ei-autofield-grid]"
    );
    let n = null;
    for (const o of this.autofieldWrappers) {
      const a = !this.nativeAutofieldExists(
        o.dataset.eiAutofield ?? ""
      );
      a && o.parentElement !== r ? (r.insertBefore(
        o,
        n ? n.nextSibling : r.firstChild
      ), s = !0) : !a && o.parentElement === r && (o.remove(), s = !0), a && (n = o);
    }
    n && e.parentElement !== t ? (t.insertAdjacentElement("afterbegin", e), s = !0) : !n && e.parentElement && (e.remove(), s = !0), s && this.setupAutofieldListenersWithRetry();
  }
  /**
   * Check whether BookVisit itself renders an input for the given autofield,
   * ignoring the ones we injected
   */
  nativeAutofieldExists(e) {
    const t = H.AUTOFIELD_SELECTORS[e];
    return !t || typeof document > "u" ? !1 : Array.from(document.querySelectorAll(t)).some(
      (s) => !s.closest("[data-ei-autofields]")
    );
  }
  /**
   * Determine which fields to include based on input_mapping
   */
  getFieldsToInclude(e) {
    const t = [], s = (e == null ? void 0 : e.field_mappings) || {}, r = (e == null ? void 0 : e.inputs) || [];
    return (this.hasFieldMapping(s, ["first_name"]) || this.hasInputSelector(r, [
      "firstName",
      "firstname",
      "first_name",
      "given-name"
    ])) && t.push("firstName"), (this.hasFieldMapping(s, ["last_name"]) || this.hasInputSelector(r, [
      "lastName",
      "lastname",
      "last_name",
      "family-name"
    ])) && t.push("lastName"), (this.hasFieldMapping(s, ["email"]) || this.hasInputSelector(r, [
      "email",
      "emailAddress",
      "email_address",
      "e-mail"
    ])) && t.push("email"), (this.hasFieldMapping(s, ["phone_number"]) || this.hasInputSelector(r, [
      "phoneNumber",
      "phonenumber",
      "phone_number",
      "phone",
      "tel",
      "telephone"
    ])) && t.push("phoneNumber"), t.length === 0 ? ["firstName", "lastName", "email", "phoneNumber"] : t;
  }
  /**
   * Check if any of the target field names exist in the field mappings
   * The values (not keys) represent the system mappings (first_name, last_name, phone_number, email)
   */
  hasFieldMapping(e, t) {
    for (const s of Object.values(e)) {
      const r = s.toLowerCase();
      for (const n of t) {
        const o = n.toLowerCase();
        if (r === o)
          return !0;
      }
    }
    return !1;
  }
  /**
   * Check if any of the target field names exist in the input selectors
   */
  hasInputSelector(e, t) {
    for (const s of e) {
      const r = s.toLowerCase();
      for (const n of t) {
        const o = n.toLowerCase();
        if (r.includes(o))
          return !0;
      }
    }
    return !1;
  }
  /**
   * Get localized text for email and phone number fields
   */
  getLocalizedText(e) {
    const t = qt.getUserLocale(), s = {
      email: {
        en: "Email",
        nb: "E-post",
        // Norwegian Bokmål
        nn: "E-post",
        // Norwegian Nynorsk
        no: "E-post",
        // Norwegian (generic)
        sv: "E-post",
        // Swedish
        da: "E-mail",
        // Danish
        de: "E-Mail",
        // German
        fr: "E-mail",
        // French
        es: "Correo electrónico",
        // Spanish
        it: "E-mail",
        // Italian
        nl: "E-mail",
        // Dutch
        pl: "E-mail"
        // Polish
      },
      phoneNumber: {
        en: "Phone number",
        nb: "Telefonnummer",
        // Norwegian Bokmål
        nn: "Telefonnummer",
        // Norwegian Nynorsk
        no: "Telefonnummer",
        // Norwegian (generic)
        sv: "Telefonnummer",
        // Swedish
        da: "Telefonnummer",
        // Danish
        de: "Telefonnummer",
        // German
        fr: "Numéro de téléphone",
        // French
        es: "Número de teléfono",
        // Spanish
        it: "Numero di telefono",
        // Italian
        nl: "Telefoonnummer",
        // Dutch
        pl: "Numer telefonu"
        // Polish
      }
    }, r = s[e][t];
    return r || s[e].en || e;
  }
  /**
   * Create the BookVisit form section HTML
   */
  createBookVisitFormSection(e) {
    const t = e.includes("firstName"), s = e.includes("lastName"), r = e.includes("email"), n = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber"), l = "bv:box-border bv:flex bv:h-[40px] bv:w-full bv:pl-[14px] bv:rounded-bv_inputRoundedCorners bv:border-solid bv:bv_inputBorder bv:disabled:cursor-not-allowed bv:disabled:opacity-50 bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:placeholder:text-bv_inputColor/70 bv:focus:outline-hidden! bv:focus:ring-2 bv:bg-bv_inputBackground bv:text-bv_inputColor";
    let c = '<div data-ei-autofield-grid class="bv:m-0 bv:grid bv:gap-[10px] bv:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bv:mt-[20px] bv:bv_small:grid-cols-1">';
    return t && (c += `
                <div data-ei-autofield="firstName" style="display: contents;">
                <label for="customer-firstName" class="bv:sr-only">Fornavn</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-firstName" autocomplete="given-name" class="${l}" data-testid="customer_info_form_firstname" placeholder="Fornavn *" name="firstName">
                </div>
                </div>
            `), s && (c += `
                <div data-ei-autofield="lastName" style="display: contents;">
                <label for="customer-lastName" class="bv:sr-only">Etternavn</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-lastName" autocomplete="family-name" class="${l}" data-testid="customer_info_form_lastname" placeholder="Etternavn *" name="lastName">
                </div>
                </div>
            `), r && (c += `
                <div data-ei-autofield="email" style="display: contents;">
                <label for="customer-emailAddress" class="bv:sr-only">${o}</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-emailAddress" autocomplete="email" class="${l}" data-testid="customer_info_form_email" placeholder="${o} *" type="email" name="emailAddress">
                </div>
                </div>
            `), n && (c += `
                <div data-ei-autofield="phoneNumber" style="display: contents;">
                <div class="bv:relative" data-testid="customer_info_form_phone_number">
                    <div class="bv:flex bv:flex-col bv:justify-start">
                        <div class="bv:flex bv:flex-row bv:flex-nowrap bv:items-center bv:justify-start bv:gap-[8px]">
                            <div class="bv:relative bv:m-0 bv:min-w-[80px] bv:max-w-[80px] bv:p-0">
                                <label for="customer-phoneCountryCode" class="bv:sr-only">${a}</label>
                                <span class="bv:absolute bv:left-[6px] bv:top-1/2 bv:z-2 bv:block bv:w-auto bv:-translate-y-1/2 bv:border-2 bv:border-solid bv:border-transparent bv:text-bv_inputColor bv:opacity-70 bv:shadow-none">
                                    <svg data-prefix="far" data-icon="plus" class="svg-inline--fa fa-plus " role="img" viewBox="0 0 448 512" aria-hidden="true">
                                        <path fill="currentColor" d="M248 56c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176-176 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l176 0 0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176 176 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-176 0 0-176z"></path>
                                    </svg>
                                </span>
                                <div class="bv:relative bv:w-full">
                                    <input id="customer-phoneCountryCode" inputmode="numeric" aria-label="${a} - country code" pattern="[0-9]*" autocomplete="tel-country-code" class="bv:box-border bv:flex bv:h-[40px] bv:w-full bv:rounded-bv_inputRoundedCorners bv:border-solid bv:bv_inputBorder bv:disabled:cursor-not-allowed bv:disabled:opacity-50 bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:placeholder:text-bv_inputColor/70 bv:focus:outline-hidden! bv:focus:ring-2 bv:bg-bv_inputBackground bv:text-bv_inputColor bv:min-w-[80px] bv:max-w-[80px] bv:pl-[26px]" data-testid="checkout_phonecountrycode" placeholder="" type="tel" name="phoneCountryCode">
                                </div>
                            </div>
                            <label for="customer-phoneNumber" class="bv:sr-only">${a}</label>
                            <div class="bv:relative bv:w-full">
                                <input id="customer-phoneNumber" inputmode="tel" pattern="[0-9]*" autocomplete="tel-national" class="${l}" data-testid="checkout_phonenumber" placeholder="${a} *" type="tel" name="phoneNumber">
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            `), c += "</div>", `
            <div data-ei-autofields data-testid="checkout_responsible_for_booking_section" class="bv:mx-0 bv:px-0 bv:pt-0 bv:pb-[40px] bv:w-full" aria-label="Ansvarlig for bestilling" role="group" style="scroll-margin-top: 20px;">
                <div class="bv:mb-[15px] bv:flex bv:items-center bv:justify-between bv:gap-[15px]">
                    <div data-orientation="horizontal" role="none" class="bv:bg-bv_dividerBorderColor bv:h-bv_dividerBorderWidth bv:w-full bv:flex-1"></div>
                    <p class="bv:bv_text bv:font-bv_bodyBoldFontWeight bv:opacity-bv_bodyMutedOpacity bv:text-bv_bodyFontSize bv:font-bv_bodyFontFamily" role="group" tabindex="-1">Ansvarlig for bestilling</p>
                    <div data-orientation="horizontal" role="none" class="bv:bg-bv_dividerBorderColor bv:h-bv_dividerBorderWidth bv:w-full bv:flex-1"></div>
                </div>
                <div class="bv:rounded-bv_cardBorderRadius bv:border-bv_cardBorderWidth bv:border-bv_cardBorderColor bv:bg-bv_cardBackground bv:text-bv_cardColor bv:shadow-bv_cardBoxShadow bv_card bv:relative bv:border-solid bv:select-none [&_.bv_card]:bv:shadow-none [&_.bv_card]:bv:bg-bv_cardInnerBackground bv:p-[25px] bv:bv_small:p-[20px]" data-testid="customer_info_section">
                    ${c}
                </div>
            </div>
        `;
  }
  /**
   * Fetch basket data from SynXis cart API with dataLayer fallback
   */
  async fetchSynxisBasket() {
    if (!this.campaign || this.campaign.type !== "synxis")
      return null;
    const e = this.getSynxisSessionIds();
    e && (this._synxisSessionIds = e);
    const t = await this.fetchSynxisCartApi();
    if (t)
      return t;
    try {
      const s = this.getSynxisDataLayer();
      if (s && s.length > 0)
        return console.log(
          "SynXis: Cart API unavailable, using dataLayer fallback"
        ), this.extractSynxisProductsFromDataLayer(s);
    } catch (s) {
      console.error("SynXis: dataLayer fallback failed:", s);
    }
    return null;
  }
  /**
   * Fetch basket data from SynXis cart REST API
   */
  async fetchSynxisCartApi() {
    const e = this.getCookie("shoppingCartId");
    if (!e)
      return console.warn("SynXis: No shoppingCartId cookie found"), null;
    try {
      const t = await fetch(
        `/gw/v1/cart/${e}?businesscontext=BE`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          }
        }
      );
      if (!t.ok)
        return console.error(
          `SynXis cart API error: ${t.status} ${t.statusText}`
        ), null;
      const s = await t.json();
      return this.extractSynxisCartApiData(s);
    } catch (t) {
      return console.error("SynXis: Error fetching cart API:", t), null;
    }
  }
  /**
   * Extract products and total from SynXis cart API response
   *
   * The /gw/v1/cart/ endpoint can return multiple pending reservations under
   * the same shoppingCartId cookie (accumulated from prior incomplete bookings).
   * We filter down to the reservation the user is actually checking out, matched
   * via the sbe_rc URL param (base64 UUID = reservation.id). Fallback: the
   * reservation with the highest itineraryNumber (most recently created).
   *
   * The API's Total.Amount is the list price, which doesn't reflect promo
   * discounts that the SBE applies client-side at reservation time. We override
   * the root `total` with the DOM-visible price (post-discount) and also expose
   * it per-product as `actualTotal` for reference.
   */
  extractSynxisCartApiData(e) {
    var o, a, l, c, u, d, h, f, g, v, m, b, E, y, w, P, k, C, R, Q;
    const t = [];
    let s = 0;
    const r = this.getSynxisActualTotal(), n = this._synxisSessionIds;
    try {
      const K = (e == null ? void 0 : e.ShoppingCart) || [], Z = [];
      for (const x of K) {
        const O = ((a = (o = x == null ? void 0 : x.UpdatedData) == null ? void 0 : o.itinerary) == null ? void 0 : a.reservations) || [];
        for (const me of O)
          Z.push({
            resv: me,
            itineraryNumber: (x == null ? void 0 : x.Itemid) || ""
          });
      }
      let Be = Z;
      if (n != null && n.sbeRcDecoded) {
        const x = Z.filter(
          ({ resv: O }) => O.id === n.sbeRcDecoded
        );
        x.length > 0 && (Be = x);
      }
      Be === Z && Z.length > 1 && (Be = [...Z].sort(
        (x, O) => O.itineraryNumber.localeCompare(x.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: x } of Be) {
        const O = x.extrasFromShopping || {}, me = x.stayCriteria || {}, Ht = x.guestCriteria || {}, L = O.prices || {}, Kt = ((u = (c = (l = L == null ? void 0 : L.Total) == null ? void 0 : l.Price) == null ? void 0 : c.Total) == null ? void 0 : u.AmountWithTaxesFees) || ((f = (h = (d = L == null ? void 0 : L.Total) == null ? void 0 : d.Price) == null ? void 0 : h.Total) == null ? void 0 : f.Amount) || ((v = (g = L == null ? void 0 : L.Total) == null ? void 0 : g.Price) == null ? void 0 : v.Amount) || 0, Wt = ((L == null ? void 0 : L.Daily) || []).map((ee) => {
          var Vt, Gt, Jt, Yt, Xt, Qt, Zt, es, ts, ss;
          return {
            date: ee.Date,
            amount: ((Gt = (Vt = ee.Price) == null ? void 0 : Vt.Total) == null ? void 0 : Gt.Amount) || ((Jt = ee.Price) == null ? void 0 : Jt.Amount) || 0,
            amountWithTax: ((Xt = (Yt = ee.Price) == null ? void 0 : Yt.Total) == null ? void 0 : Xt.AmountWithTaxesFees) || 0,
            tax: ((Zt = (Qt = ee.Price) == null ? void 0 : Qt.Tax) == null ? void 0 : Zt.Amount) || 0,
            fees: ((ts = (es = ee.Price) == null ? void 0 : es.Fees) == null ? void 0 : ts.Amount) || 0,
            currency: (ss = ee.Price) == null ? void 0 : ss.CurrencyCode,
            inventory: ee.AvailableInventory
          };
        }), fr = {
          id: x.id,
          confirmationNumber: x.confirmationNumber,
          itineraryNumber: x.itineraryNumber,
          name: O.displayname || "Room",
          roomCode: me.roomCode,
          rateCode: me.rateCode,
          price: Kt,
          actualTotal: r,
          dailyRate: O.amount || O.amountWithTaxesFees,
          currency: O.currencyCode,
          dailyPrices: Wt,
          taxes: ((E = (b = (m = L == null ? void 0 : L.Total) == null ? void 0 : m.Price) == null ? void 0 : b.Tax) == null ? void 0 : E.Amount) || 0,
          fees: ((P = (w = (y = L == null ? void 0 : L.Total) == null ? void 0 : y.Price) == null ? void 0 : w.Fees) == null ? void 0 : P.Amount) || 0,
          startDate: (k = me.startDate) == null ? void 0 : k.split("T")[0],
          endDate: (C = me.endDate) == null ? void 0 : C.split("T")[0],
          nights: Wt.length || null,
          adults: Ht.numAdults || 1,
          children: Ht.numChildren || 0,
          hotelId: String(x.hotelId),
          chainId: String(x.chainId),
          bedDescription: O.bedDescription,
          bedType: O.bedType,
          bedQuantity: O.bedQuantity,
          maxRoomSize: O.maxRoomSize,
          minRoomSize: O.minRoomSize,
          guestLimit: O.guestLimit,
          inventory: O.inventory,
          bookingPolicyCode: O.bookingPolicyCode,
          cancelPolicyCode: O.cancelPolicyCode,
          status: x.status,
          type: "room",
          quantity: 1,
          addons: x.addOns || [],
          image: O.coverImage || ((Q = (R = O.imageUrls) == null ? void 0 : R[0]) == null ? void 0 : Q.Path) || null
        };
        t.push(fr), s += Kt;
      }
    } catch (K) {
      console.error("SynXis: Error extracting cart API data:", K);
    }
    return r !== null && r > 0 ? s = r : s === 0 && (s = this.totalAverage || 0), { products: t, total: s };
  }
  /**
   * Read the cart total as rendered on the SynXis checkout page.
   * Accounts for promo/discount adjustments applied client-side that
   * aren't reflected in the /gw/v1/cart/ API response.
   */
  getSynxisActualTotal() {
    if (typeof document > "u")
      return null;
    const e = document.querySelector(".price-summary_price span");
    return e != null && e.textContent ? this.parseSynxisPrice(e.textContent) : null;
  }
  /**
   * Parse a locale-formatted price string like "12 980,50 kr" or "12,980.50 kr".
   * Handles both Norwegian (space/comma) and English (comma/dot) formats.
   */
  parseSynxisPrice(e) {
    const t = e.replace(/[^\d,\.-]/g, "");
    if (!t)
      return null;
    const s = t.lastIndexOf("."), r = t.lastIndexOf(",");
    let n;
    s === -1 && r === -1 ? n = t : s > r ? n = t.replace(/,/g, "") : n = t.replace(/\./g, "").replace(",", ".");
    const o = parseFloat(n);
    return isNaN(o) ? null : o;
  }
  /**
   * Get SynXis session identifiers from cookies and URL parameters
   */
  getSynxisSessionIds() {
    const e = this.getCookie("sbeSessionID"), t = this.getCookie("shoppingCartId");
    let s = null, r = null;
    if (typeof window < "u" && (s = new URLSearchParams(window.location.search).get("sbe_rc"), s))
      try {
        r = atob(s);
      } catch {
      }
    return !e && !t && !s ? null : { sbeSessionId: e, shoppingCartId: t, sbeRc: s, sbeRcDecoded: r };
  }
  /**
   * Get SynXis-related entries from window.dataLayer (fallback)
   */
  getSynxisDataLayer() {
    if (typeof window > "u")
      return null;
    const e = window.dataLayer;
    return Array.isArray(e) ? e.filter((t) => {
      var s, r;
      return t.Cart || ((s = t.ecommerce) == null ? void 0 : s.checkout) || ((r = t.ecommerce) == null ? void 0 : r.items) || t.HName || t.HOTEL_ID || t.event === "checkout" || t.event === "checkoutLoad" || t.event === "app" || t.event === "purchase" || t.event === "confirmation" || t.event === "rooms.add" || t.TotalCost != null;
    }) : null;
  }
  /**
   * Extract products and total from SynXis dataLayer entries (fallback)
   */
  extractSynxisProductsFromDataLayer(e) {
    const t = [];
    let s = 0;
    try {
      const r = e.find((o) => o.event === "checkout") || e.find((o) => o.event === "purchase") || e.find((o) => o.event === "app" && o.Cart) || e.find((o) => o.Cart) || e.find((o) => o.event === "app") || {};
      s = r.TotalCostWithTax || r.TotalCost || r.ItineraryPrice || this.totalAverage || 0;
      const n = r.Cart || [];
      n.length > 0 ? n.forEach((o) => {
        t.push({
          id: o.RoomCode || o.HOTEL_ID,
          name: o.RoomName || "Room",
          price: o.TotalCostWithTax || o.TotalCost || 0,
          quantity: 1,
          type: "room",
          startDate: o.ArrivalDt,
          endDate: o.DepartDt,
          roomCode: o.RoomCode,
          rateCode: o.RateCode,
          rateName: o.RateName,
          hotelName: o.HName,
          hotelId: o.HOTEL_ID,
          chainName: o.ChainNm,
          chainId: o.CHAIN_ID,
          nights: o.NightsQty,
          adults: o.AdultQty,
          children: o.ChildQty,
          dailyRate: o.DailyRateWithTax || o.DailyRate,
          currency: o.CurrCode,
          taxes: o.Taxes || 0,
          status: o.DetailedResvStatus || o.ResvStatus
        });
      }) : (r.RoomCode || r.RoomName) && t.push({
        id: r.RoomCode || r.HOTEL_ID,
        name: r.RoomName || "Room",
        price: s,
        quantity: 1,
        type: "room",
        startDate: r.ArrivalDt,
        endDate: r.DepartDt,
        roomCode: r.RoomCode,
        rateCode: r.RateCode,
        rateName: r.RateName,
        hotelName: r.HName,
        hotelId: r.HOTEL_ID,
        nights: r.NightsQty,
        adults: r.AdultQty,
        children: r.ChildQty,
        dailyRate: r.ItineraryDailyRate,
        currency: r.CurrCode,
        taxes: r.Taxes || 0
      });
    } catch (r) {
      console.error("SynXis: Error extracting dataLayer data:", r);
    }
    return { products: t, total: s };
  }
  /**
   * Read basket data from an Elina PMS booking page (e.g. /Confirm/SignUpOnBooking).
   * Elina exposes everything we need directly in the DOM — no API call required.
   * Returns null if cart elements aren't on the page, so totalAverage is used instead.
   */
  async fetchElinapmsBasket() {
    if (!this.campaign || this.campaign.type !== "elinapms" || typeof document > "u")
      return null;
    try {
      const e = document.querySelectorAll(
        ".shoppingCartItem.align-centre"
      );
      if (e.length === 0)
        return null;
      const t = this.getElinapmsSessionIds();
      t && (this._elinapmsSessionIds = t);
      const s = this.readElinapmsStay(document), r = Array.from(e).map((o) => {
        const a = o, l = this.readElinapmsStay(a) ?? s;
        return {
          id: a.dataset.id,
          name: a.dataset.tagname,
          price: this.parseElinapmsNumber(a.dataset.tagprice),
          quantity: 1,
          type: "accommodation",
          category: a.dataset.tagcategory,
          locationId: a.dataset.accid,
          ratePlanId: a.dataset.rateruleId,
          ...l ?? {}
        };
      }), n = this.extractElinapmsTotal();
      return { products: r, total: n };
    } catch (e) {
      return console.error("Error extracting Elina PMS basket:", e), null;
    }
  }
  /**
   * Stay dates from an Elina element (or the document): the element's own
   * data-startdate/enddate, else the first descendant that carries them.
   * Only ISO dates are accepted; nights is computed when absent.
   */
  readElinapmsStay(e) {
    try {
      const t = e.dataset, s = t && t.startdate && t.enddate ? e : e.querySelector("[data-startdate][data-enddate]");
      if (!s) return null;
      const r = /^(\d{4})-(\d{2})-(\d{2})/, n = r.exec(s.dataset.startdate ?? ""), o = r.exec(s.dataset.enddate ?? "");
      if (!n || !o) return null;
      const a = n[0], l = o[0], c = Math.round(
        (Date.UTC(+o[1], +o[2] - 1, +o[3]) - Date.UTC(+n[1], +n[2] - 1, +n[3])) / 864e5
      );
      if (c < 1 || c > 60) return null;
      const u = Number(s.dataset.nights), d = Number.isInteger(u) && u > 0 ? u : c;
      return { startDate: a, endDate: l, nights: d };
    } catch {
      return null;
    }
  }
  /**
   * Resolve the booking total from the Elina PMS booking page.
   * Prefers the hidden #Total form input (the value posted on submit).
   * Falls back to summing accommodation base + fees + addons, mirroring the
   * Elina dataLayer script used for begin_checkout tracking.
   */
  extractElinapmsTotal() {
    const e = document.getElementById(
      "Total"
    );
    if (e && e.value) {
      const c = this.parseElinapmsNumber(e.value);
      if (c > 0) return c;
    }
    const t = document.getElementById("accommodationTotal");
    if (!t)
      return this.totalAverage;
    const s = t.querySelector(".formattedCurrency"), r = s ? this.parseElinapmsNumber(s.textContent) : 0, n = t.querySelector(".plusFees"), o = n ? this.parseElinapmsNumber(n.dataset.att) : 0;
    let a = 0;
    const l = document.getElementById("addonsTotal");
    if (l) {
      const c = l.querySelector(".formattedCurrency");
      a = c ? this.parseElinapmsNumber(c.textContent) : 0;
    }
    return r + o + a;
  }
  /**
   * Read Elina PMS / Norgesbooking session identifiers from cookies.
   * bookingShoppingCart_0 is a server-side cart GUID; the browser sending
   * this cookie to /Confirm/SignUpOnBooking re-renders the original cart.
   */
  getElinapmsSessionIds() {
    const e = this.getCookie("bookingShoppingCart_0");
    return e ? { bookingShoppingCart: e } : null;
  }
  /**
   * Parse a number string from the Elina PMS DOM. Handles both European
   * ("2 840,00" or "2&nbsp;840,00") and US ("2,840.00") formats by detecting
   * which of `.` and `,` is the rightmost separator and treating that as the
   * decimal mark.
   */
  parseElinapmsNumber(e) {
    if (e == null) return 0;
    let t = String(e).replace(/[\s ]/g, "");
    if (!t) return 0;
    const s = t.lastIndexOf(","), r = t.lastIndexOf(".");
    s > r ? t = t.replace(/\./g, "").replace(",", ".") : r > s ? t = t.replace(/,/g, "") : s >= 0 && (t = t.replace(",", "."));
    const n = parseFloat(t);
    return isNaN(n) ? 0 : n;
  }
  /**
   * Get cookie value by name
   */
  getCookie(e) {
    var r;
    if (typeof document > "u")
      return null;
    const s = `; ${document.cookie}`.split(`; ${e}=`);
    return s.length === 2 && ((r = s.pop()) == null ? void 0 : r.split(";").shift()) || null;
  }
  /**
   * Set up autofield listeners with retry logic
   * This ensures both InputDetector listeners and sessionStorage listeners are attached
   */
  setupAutofieldListenersWithRetry() {
    let e = 0;
    const t = 5, s = 100, r = () => {
      const n = document.querySelector(
        'input[name="emailAddress"]'
      ), o = document.querySelector(
        'input[name="phoneCountryCode"]'
      ), a = document.querySelector(
        'input[name="phoneNumber"]'
      ), l = document.querySelector(
        'input[name="firstName"]'
      ), c = document.querySelector(
        'input[name="lastName"]'
      );
      n || o || a || l || c ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(r, s)) : console.warn(
        "Autofield inputs not found after retries, listeners may not be attached"
      );
    };
    r();
  }
  /**
   * Add direct listeners to autofields to ensure they're detected by InputDetector
   * This is necessary because InputDetector might use specific selectors that don't match autofields
   */
  addDirectAutofieldListeners() {
    if (typeof document > "u" || !this.inputDetector)
      return;
    [
      document.querySelector('input[name="firstName"]'),
      document.querySelector('input[name="lastName"]'),
      document.querySelector(
        'input[name="emailAddress"]'
      ),
      document.querySelector(
        'input[name="phoneCountryCode"]'
      ),
      document.querySelector(
        'input[name="phoneNumber"]'
      )
    ].filter((t) => t !== null).forEach((t) => {
      t.addEventListener("blur", this.boundHandleAutofieldBlur);
    });
  }
  /**
   * Handle blur event on autofield inputs
   * Manually triggers the content update callback to ensure autofields are detected
   */
  handleAutofieldBlur(e) {
    var u;
    if (!this.inputDetector)
      return;
    const t = e.target, s = t.value.trim();
    if (!s)
      return;
    const r = this.inputDetector.getContent();
    let n = t.name;
    const o = this.inputDetector.inputMapping;
    (u = o == null ? void 0 : o.field_mappings) != null && u[n] ? n = o.field_mappings[n] : n === "emailAddress" ? n = "email" : n === "phoneNumber" ? n = "phone_number" : n === "firstName" ? n = "first_name" : n === "lastName" && (n = "last_name");
    const a = { ...r, [n]: s }, l = n === "email" || n.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), c = n === "phone_number" || n.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
    if (l || c || this.inputDetector.hasEmailOrPhoneNumber()) {
      const d = this.inputDetector.sessionId;
      this.debouncedHandleContentUpdate(a, d);
    }
  }
  /**
   * Set up event listeners on autofield inputs to store values in sessionStorage
   */
  setupAutofieldStorageListeners() {
    typeof document > "u" || Object.keys(H.AUTOFIELD_STORAGE_KEYS).forEach(
      (e) => {
        const t = document.querySelector(
          `input[name="${e}"]`
        );
        t == null || t.addEventListener(
          "input",
          this.boundSaveAutofieldToStorage
        ), t == null || t.addEventListener(
          "blur",
          this.boundSaveAutofieldToStorage
        );
      }
    );
  }
  /**
   * Check if we're on the payment page and fill in fields from sessionStorage
   */
  checkAndFillPaymentPageFields() {
    typeof window > "u" || !window.location.pathname.includes("payment/netseasy") || this.fillPaymentPageFields();
  }
  /**
   * Fill in payment page fields from sessionStorage
   * Handles both main document and iframe scenarios
   */
  fillPaymentPageFields() {
    if (typeof document > "u")
      return;
    let e = 0;
    const t = 30, s = 300, r = (o) => {
      let a = !0;
      const l = this.getFromSessionStorage("autofield_email");
      if (l) {
        const d = o.getElementById(
          "registrationManualEmail"
        );
        d && !d.value ? (d.value = l, d.dispatchEvent(
          new Event("input", { bubbles: !0 })
        ), d.dispatchEvent(
          new Event("change", { bubbles: !0 })
        ), console.log("Filled email from sessionStorage:", l)) : d || (a = !1);
      }
      const c = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), u = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (c || u) {
        const d = o.querySelector(
          'input[name="country-code"]'
        );
        if (d && c) {
          d.value = c, d.dispatchEvent(
            new Event("change", { bubbles: !0 })
          );
          const f = o.querySelector(
            '#registrationManualPhonePrefix input[type="text"]'
          );
          f && (f.value = c, f.dispatchEvent(
            new Event("input", { bubbles: !0 })
          ), f.dispatchEvent(
            new Event("change", { bubbles: !0 })
          ));
          const g = o.getElementById(
            "registrationManualPhonePrefix"
          );
          if (g) {
            const v = g.querySelector(
              ".css-1yh68ch-singleValue"
            );
            v && (v.textContent = c);
          }
          console.log(
            "Filled phone country code from sessionStorage:",
            c
          );
        } else c && !d && (a = !1);
        const h = o.getElementById(
          "registrationManualPhoneNumber"
        );
        h && u && !h.value ? (h.value = u, h.dispatchEvent(
          new Event("input", { bubbles: !0 })
        ), h.dispatchEvent(
          new Event("change", { bubbles: !0 })
        ), console.log(
          "Filled phone number from sessionStorage:",
          u
        )) : u && !h && (a = !1);
      }
      return a;
    }, n = () => {
      let o = !0;
      const a = r(document);
      a || (o = !1);
      const l = document.querySelectorAll("iframe");
      let c = !1;
      l.forEach((u) => {
        var d;
        try {
          const h = u.contentDocument || ((d = u.contentWindow) == null ? void 0 : d.document);
          h && (r(h) ? c = !0 : o = !1);
        } catch {
          this.tryPostMessageToIframe(u);
        }
      }), (a || c) && (o = !0), !o && e < t ? (e++, setTimeout(n, s)) : e >= t && !o && console.warn(
        "Payment page fields not found after maximum retries. Fields may be in a cross-origin iframe or not yet loaded."
      );
    };
    n(), this.setupIframeWatcher();
  }
  /**
   * Try to send data to cross-origin iframe using postMessage
   * Attempts multiple message formats in case the iframe uses different conventions
   */
  tryPostMessageToIframe(e) {
    var t, s, r, n, o, a, l, c, u, d;
    try {
      const h = this.getFromSessionStorage("autofield_email"), f = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), g = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (!h && !f && !g)
        return;
      let v = "*";
      if (e.src)
        try {
          v = new URL(e.src).origin;
        } catch {
        }
      const m = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((r = e.name) == null ? void 0 : r.toLowerCase().includes("dibs")), b = ((n = e.src) == null ? void 0 : n.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((l = e.src) == null ? void 0 : l.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((c = e.name) == null ? void 0 : c.toLowerCase().includes("nets")) || ((u = e.name) == null ? void 0 : u.toLowerCase().includes("easy"));
      if (!e.contentWindow)
        return;
      const E = [
        // Format 1: Our standard format
        {
          type: "ekteintelligens-autofill",
          email: h || null,
          phoneCountryCode: f || null,
          phoneNumber: g || null
        },
        // Format 2: Dibs/Nets Easy-specific formats
        ...m || b ? [
          {
            type: "dibs-autofill",
            email: h || null,
            phoneCountryCode: f || null,
            phoneNumber: g || null
          },
          {
            type: "nets-easy-autofill",
            email: h || null,
            phoneCountryCode: f || null,
            phoneNumber: g || null
          },
          {
            action: "autofill",
            data: {
              email: h || null,
              phoneCountryCode: f || null,
              phoneNumber: g || null
            }
          },
          {
            event: "customer-data",
            customer: {
              email: h || null,
              phone: g ? `${f || ""}${g}` : null,
              phoneCountryCode: f || null
            }
          }
        ] : [],
        // Format 3: Generic autofill format
        {
          action: "autofill-fields",
          email: h || null,
          phoneCountryCode: f || null,
          phoneNumber: g || null
        }
      ];
      E.forEach((w) => {
        try {
          e.contentWindow.postMessage(w, v);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${b ? "Nets Easy/Nexi" : m ? "Dibs" : "cross-origin"} iframe via postMessage (${E.length} formats):`,
        {
          iframeSrc: ((d = e.src) == null ? void 0 : d.substring(0, 100)) || "unknown",
          email: h ? "***" : null,
          phoneCountryCode: f,
          phoneNumber: g ? "***" : null,
          targetOrigin: v
        }
      ), this.tryIframeUrlParameters(
        e,
        h,
        f,
        g
      );
    } catch (h) {
      console.warn("Failed to send postMessage to iframe:", h);
    }
  }
  /**
   * Try to pass data via URL parameters if the iframe src can be modified
   * This only works if the iframe hasn't loaded yet or can be reloaded
   */
  tryIframeUrlParameters(e, t, s, r) {
    if (e.src)
      try {
        const n = new URL(e.src), o = n.hostname.includes("dibspayment.eu") || n.hostname.includes("dibs."), a = n.hostname.includes("netseasy") || n.hostname.includes("nets.eu") || n.hostname.includes("nexigroup.com") || n.hostname.includes("dibspayment.eu");
        if (!o && !a)
          return;
        const l = n.searchParams.toString().length > 0;
        (t || s || r) && console.log(`${a ? "Nets Easy/Nexi" : o ? "Dibs" : "Payment"} iframe URL analysis:`, {
          currentUrl: e.src,
          hasParams: l,
          suggestedParams: {
            ...t ? { email: t } : {},
            ...s ? { phoneCountryCode: s } : {},
            ...r ? { phoneNumber: "***" } : {}
          },
          note: l ? "Iframe URL has parameters - might support additional ones" : `Iframe URL has no parameters - check ${a ? "Nets Easy/Nexi" : "Dibs"} documentation for supported params`,
          provider: a ? "Nets Easy/Nexi Group" : "Dibs"
        });
      } catch {
      }
  }
  /**
   * Set up a MutationObserver to watch for dynamically added iframes
   */
  setupIframeWatcher() {
    if (typeof document > "u" || this._iframeObserver)
      return;
    const e = new MutationObserver((t) => {
      t.forEach((s) => {
        s.addedNodes.forEach((r) => {
          if (r.nodeType === Node.ELEMENT_NODE) {
            const n = r;
            n.tagName === "IFRAME" && n.addEventListener("load", () => {
              setTimeout(() => {
                this.fillPaymentPageFields();
              }, 500);
            }), n.querySelectorAll("iframe").forEach((a) => {
              a.addEventListener("load", () => {
                setTimeout(() => {
                  this.fillPaymentPageFields();
                }, 500);
              });
            });
          }
        });
      });
    });
    document.body ? e.observe(document.body, {
      childList: !0,
      subtree: !0
    }) : document.addEventListener("DOMContentLoaded", () => {
      document.body && e.observe(document.body, {
        childList: !0,
        subtree: !0
      });
    }), this._iframeObserver = e;
  }
  /**
   * Save value to sessionStorage
   */
  saveToSessionStorage(e, t) {
    if (typeof window < "u" && window.sessionStorage)
      try {
        sessionStorage.setItem(e, t), console.log(`Saved to sessionStorage: ${e} = ${t}`);
      } catch (s) {
        console.warn(
          `Failed to save to sessionStorage (${e}):`,
          s
        );
      }
  }
  /**
   * Get value from sessionStorage
   */
  getFromSessionStorage(e) {
    if (typeof window < "u" && window.sessionStorage)
      try {
        return sessionStorage.getItem(e);
      } catch (t) {
        return console.warn(
          `Failed to get from sessionStorage (${e}):`,
          t
        ), null;
      }
    return null;
  }
  /**
   * Set up listener for URL changes (for SPA navigation)
   */
  setupUrlChangeListener() {
    if (typeof window > "u")
      return;
    this.checkAndFillPaymentPageFields(), window.addEventListener("popstate", () => {
      setTimeout(() => {
        this.checkAndFillPaymentPageFields();
      }, 100);
    });
    let e = window.location.href;
    const t = setInterval(() => {
      const s = window.location.href;
      s !== e && (e = s, this.checkAndFillPaymentPageFields());
    }, 500);
    this._urlCheckInterval = t;
  }
};
p(H, "BASKET_FETCH_TIMEOUT_MS", 8e3), /**
 * Selectors that identify each autofield, whether rendered by BookVisit
 * itself or injected by us.
 */
p(H, "AUTOFIELD_SELECTORS", {
  firstName: '#customer-firstName, input[name="firstName"]',
  lastName: '#customer-lastName, input[name="lastName"]',
  email: '#customer-emailAddress, input[name="emailAddress"]',
  phoneNumber: '#customer-phoneNumber, input[name="phoneNumber"]'
}), /**
 * sessionStorage key for each autofield input name
 */
p(H, "AUTOFIELD_STORAGE_KEYS", {
  emailAddress: "autofield_email",
  phoneCountryCode: "autofield_phoneCountryCode",
  phoneNumber: "autofield_phoneNumber"
});
let Qe = H;
class vo {
  constructor(e) {
    p(this, "options");
    p(this, "supabaseService");
    p(this, "campaign");
    p(this, "formData", {});
    p(this, "inputListeners", []);
    p(this, "buttonListeners", []);
    p(this, "submitListener");
    p(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new Me(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    if (this.isInitialized)
      return !0;
    if (!this.options.pipelineCampaignId)
      return console.error(
        "pipelineCampaignId is required for organization pipeline"
      ), !1;
    try {
      const e = await this.supabaseService.getPipelineCampaign(
        this.options.pipelineCampaignId
      );
      return e ? (this.campaign = e, this.initializeFormData(), this.setupInputListeners(), this.setupButtonListeners(), this.setupSubmitListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch pipeline campaign data"), !1);
    } catch (e) {
      return console.error(
        "Failed to initialize organization pipeline tool:",
        e
      ), !1;
    }
  }
  initializeFormData() {
    if (!this.campaign) return;
    const { input_mapping: e } = this.campaign;
    Object.keys(e).forEach((t) => {
      const s = e[t];
      if (s.type === "checkbox") {
        const r = this.getElementBySelector(
          s.selector_type,
          s.selector_value
        );
        if (r) {
          const n = s.true_value || "on", o = this.isCheckboxChecked(r), a = this.getCheckboxValue(r);
          o && a === n ? this.formData[t] = !0 : this.formData[t] = !1;
        } else
          this.formData[t] = s.default_value !== void 0 ? s.default_value : !1;
      } else s.default_value !== void 0 && (this.formData[t] = s.default_value);
    });
  }
  setupInputListeners() {
    if (!this.campaign) return;
    const { input_mapping: e } = this.campaign;
    Object.keys(e).forEach((t) => {
      const s = e[t];
      if (s.type !== "input" && s.type !== "checkbox") return;
      const r = this.getElementBySelector(
        s.selector_type,
        s.selector_value
      );
      if (!r) {
        console.warn(
          `Could not find element for field "${t}" with selector type "${s.selector_type}" and value "${s.selector_value}"`
        );
        return;
      }
      const n = (o) => {
        this.handleInputChange(
          t,
          o.target,
          s
        );
      };
      if (s.type === "checkbox") {
        if (r instanceof HTMLButtonElement || r.getAttribute("role") === "checkbox") {
          r.addEventListener("click", () => {
            setTimeout(() => {
              this.handleInputChange(t, r, s);
            }, 0);
          });
          const o = new MutationObserver(() => {
            this.handleInputChange(t, r, s);
          });
          o.observe(r, {
            attributes: !0,
            attributeFilter: ["aria-checked", "data-state"]
          }), r._eiObserver = o;
        } else
          r.addEventListener("change", n);
        this.handleInputChange(t, r, s);
      } else
        r.addEventListener("blur", n), r.addEventListener("change", n);
      this.inputListeners.push({ element: r, fieldName: t, handler: n });
    });
  }
  setupButtonListeners() {
    if (!this.campaign) return;
    const { input_mapping: e } = this.campaign;
    Object.keys(e).forEach((t) => {
      const s = e[t];
      if (s.type !== "button" || s.mode !== "toggle") return;
      const r = this.getElementBySelector(
        s.selector_type,
        s.selector_value
      );
      if (!r) {
        console.warn(
          `Could not find button element for field "${t}" with selector type "${s.selector_type}" and value "${s.selector_value}"`
        );
        return;
      }
      const n = (o) => {
        o.preventDefault(), this.handleButtonToggle(t, s.default_value);
      };
      r.addEventListener("click", n), this.buttonListeners.push({ element: r, fieldName: t, handler: n });
    });
  }
  setupSubmitListener() {
    if (!this.campaign) return;
    const { button_mapping: e } = this.campaign, t = this.getElementBySelector(
      e.selector_type,
      e.selector_value
    );
    if (!t) {
      console.warn(
        `Could not find submit button with selector type "${e.selector_type}" and value "${e.selector_value}"`
      );
      return;
    }
    const s = (r) => {
      this.handleSubmit(r);
    };
    t.addEventListener("click", s), this.submitListener = { element: t, handler: s };
  }
  getElementBySelector(e, t) {
    const s = t.replace(/\\\\/g, "\\");
    switch (e) {
      case "name":
        return document.querySelector(
          `[name="${s}"]`
        );
      case "id":
        return document.getElementById(s);
      case "querySelector":
        try {
          return document.querySelector(s);
        } catch (r) {
          return console.warn(
            `Invalid querySelector: ${s}`,
            r
          ), null;
        }
      case "class":
        return document.querySelector(
          `.${s}`
        );
      default:
        return e.startsWith("data-") ? document.querySelector(
          `[${e}="${s}"]`
        ) : document.querySelector(
          `[${e}="${s}"]`
        );
    }
  }
  isCheckboxChecked(e) {
    if (e instanceof HTMLInputElement && e.type === "checkbox")
      return e.checked;
    if (e.getAttribute("role") === "checkbox") {
      const t = e.getAttribute("aria-checked"), s = e.getAttribute("data-state");
      if (t === "true")
        return !0;
      if (t === "false")
        return !1;
      if (s === "checked")
        return !0;
      if (s === "unchecked")
        return !1;
    }
    return !1;
  }
  getCheckboxValue(e) {
    return e instanceof HTMLInputElement && e.type === "checkbox" ? e.value || "on" : e.getAttribute("value") || "on";
  }
  handleInputChange(e, t, s) {
    var r;
    if ((s == null ? void 0 : s.type) === "checkbox") {
      const n = s.true_value || "on", o = this.isCheckboxChecked(t), a = this.getCheckboxValue(t);
      o && a === n ? this.formData[e] = !0 : this.formData[e] = !1;
      return;
    }
    t instanceof HTMLInputElement ? this.formData[e] = t.value : t instanceof HTMLSelectElement ? this.formData[e] = t.value : t instanceof HTMLTextAreaElement ? this.formData[e] = t.value : this.formData[e] = t.getAttribute("value") || ((r = t.textContent) == null ? void 0 : r.trim()) || "";
  }
  handleButtonToggle(e, t) {
    const s = this.formData[e] ?? t ?? !1;
    this.formData[e] = !s;
  }
  collectFormData() {
    var t;
    const e = {
      ...((t = this.campaign) == null ? void 0 : t.additional_properties) || {}
    };
    return Object.assign(e, this.formData), this.campaign && (e.ainternal_pipeline_campaign_id = this.campaign.id), e;
  }
  async handleSubmit(e) {
    e.cancelable && e.preventDefault();
    try {
      const t = this.collectFormData();
      t.ainternal_run_pipeline === !0 && (await this.supabaseService.runOrganizationPipeline(
        t
      ) || console.error("Failed to execute organization pipeline"));
    } catch (t) {
      console.error("Error handling submit:", t);
    }
  }
  destroy() {
    this.inputListeners.forEach(({ element: e, handler: t }) => {
      e.removeEventListener("blur", t), e.removeEventListener("change", t), e.removeEventListener("click", t), e._eiObserver && (e._eiObserver.disconnect(), delete e._eiObserver);
    }), this.inputListeners = [], this.buttonListeners.forEach(({ element: e, handler: t }) => {
      e.removeEventListener("click", t);
    }), this.buttonListeners = [], this.submitListener && (this.submitListener.element.removeEventListener(
      "click",
      this.submitListener.handler
    ), this.submitListener = void 0), this.isInitialized = !1, this.formData = {}, this.campaign = void 0;
  }
  getFormData() {
    return { ...this.formData };
  }
}
class yo {
  constructor(e) {
    // @ts-ignore
    p(this, "options");
    p(this, "isInitialized", !1);
    p(this, "currentPage", "");
    p(this, "currentVisitStartTime", 0);
    /** Start of the current foreground segment; 0 while paused. */
    p(this, "segmentStart", 0);
    p(this, "data", { visits: [] });
    p(this, "storageKey", "ei_enhanced_insights");
    p(this, "popstateHandler");
    // private pushstateHandler?: () => void;
    // private replacestateHandler?: () => void;
    p(this, "beforeunloadHandler");
    p(this, "visibilityChangeHandler");
    p(this, "originalPushState");
    p(this, "originalReplaceState");
    this.options = e;
  }
  async initialize() {
    if (this.isInitialized)
      return !0;
    try {
      return this.loadDataFromStorage(), this.trackPageEntry(), this.setupNavigationListeners(), this.setupExitTracking(), this.isInitialized = !0, !0;
    } catch (e) {
      return console.error(
        "Failed to initialize enhanced insights tool:",
        e
      ), !1;
    }
  }
  /**
   * The visit currently being recorded. Looked up by identity rather than
   * held as a reference because getData()/getVisits() reload `this.data`
   * from storage and would orphan a stored reference. Deliberately does NOT
   * filter on `!leftAt`: a paused visit has one, and skipping it was what
   * dropped every second after the first tab switch.
   */
  currentVisitRef() {
    if (!(!this.currentPage || this.currentVisitStartTime === 0))
      return this.data.visits.find(
        (e) => e.page === this.currentPage && e.enteredAt === this.currentVisitStartTime
      );
  }
  trackPageEntry() {
    if (typeof window > "u")
      return;
    const e = window.location.pathname;
    this.currentPage && this.currentVisitStartTime > 0 && this.trackPageExit(), this.currentPage = e, this.currentVisitStartTime = Date.now(), this.segmentStart = this.currentVisitStartTime;
    const t = {
      page: e,
      enteredAt: this.currentVisitStartTime,
      activeMs: 0
    };
    this.data.visits.push(t), this.saveDataToStorage();
  }
  /** Bank the foreground segment so far; the visit can still be resumed. */
  pauseCurrentVisit() {
    if (this.segmentStart === 0) return;
    const e = this.currentVisitRef(), t = Date.now();
    e && (e.activeMs = (e.activeMs ?? 0) + Math.max(0, t - this.segmentStart), e.leftAt = t, this.saveDataToStorage()), this.segmentStart = 0;
  }
  /** Start a new foreground segment after the tab became visible again. */
  resumeCurrentVisit() {
    this.segmentStart !== 0 || this.currentVisitStartTime === 0 || (this.segmentStart = Date.now());
  }
  trackPageExit() {
    this.pauseCurrentVisit(), this.currentPage = "", this.currentVisitStartTime = 0;
  }
  setupNavigationListeners() {
    if (typeof window > "u")
      return;
    this.popstateHandler = () => {
      this.trackPageEntry();
    }, window.addEventListener("popstate", this.popstateHandler), this.originalPushState = history.pushState, this.originalReplaceState = history.replaceState;
    const e = this;
    history.pushState = function(...t) {
      e.trackPageExit();
      const s = e.originalPushState.apply(history, t);
      return setTimeout(() => {
        e.trackPageEntry();
      }, 0), s;
    }, history.replaceState = function(...t) {
      e.trackPageExit();
      const s = e.originalReplaceState.apply(history, t);
      return setTimeout(() => {
        e.trackPageEntry();
      }, 0), s;
    };
  }
  setupExitTracking() {
    typeof window > "u" || (this.beforeunloadHandler = () => {
      this.trackPageExit();
    }, window.addEventListener("beforeunload", this.beforeunloadHandler), this.visibilityChangeHandler = () => {
      document.visibilityState === "hidden" ? this.pauseCurrentVisit() : document.visibilityState === "visible" && (window.location.pathname !== this.currentPage ? this.trackPageEntry() : this.resumeCurrentVisit());
    }, document.addEventListener(
      "visibilitychange",
      this.visibilityChangeHandler
    ));
  }
  loadDataFromStorage() {
    if (!(typeof window > "u" || !window.localStorage))
      try {
        const e = localStorage.getItem(this.storageKey);
        e ? (this.data = JSON.parse(e), Array.isArray(this.data.visits) || (this.data.visits = [])) : this.data = { visits: [] };
      } catch (e) {
        console.warn(
          "Failed to load enhanced insights data from localStorage:",
          e
        ), this.data = { visits: [] };
      }
  }
  saveDataToStorage() {
    if (!(typeof window > "u" || !window.localStorage)) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (e) {
        console.warn(
          "Failed to save enhanced insights data to localStorage:",
          e
        );
      }
      Gi();
    }
  }
  getData() {
    return this.loadDataFromStorage(), { ...this.data };
  }
  getVisits() {
    return this.loadDataFromStorage(), [...this.data.visits];
  }
  clearData() {
    this.data = { visits: [] }, this.saveDataToStorage();
  }
  destroy() {
    this.trackPageExit(), typeof window < "u" && (this.popstateHandler && window.removeEventListener("popstate", this.popstateHandler), this.beforeunloadHandler && window.removeEventListener(
      "beforeunload",
      this.beforeunloadHandler
    ), this.visibilityChangeHandler && document.removeEventListener(
      "visibilitychange",
      this.visibilityChangeHandler
    ), this.originalPushState && (history.pushState = this.originalPushState), this.originalReplaceState && (history.replaceState = this.originalReplaceState)), this.isInitialized = !1, this.currentPage = "", this.currentVisitStartTime = 0;
  }
}
const fe = class fe {
  constructor(e) {
    p(this, "supabaseService");
    p(this, "isInitialized", !1);
    this.supabaseService = new Me(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    return this.isInitialized || (this.isInitialized = !0, this.trackShortlinkOpen()), !0;
  }
  /**
   * Read the `?s=` parameter and, if it is present and not already tracked
   * in this browser session, record an `opened_link` event for it.
   */
  async trackShortlinkOpen() {
    if (typeof window > "u")
      return;
    const e = this.getSubscriberShortId();
    if (e && !this.getTrackedShortIds().includes(e))
      try {
        await this.supabaseService.createAssistantEvent({
          id_short_encoded: e,
          type: "funnel_subscriber"
        }) && this.markShortIdTracked(e);
      } catch (t) {
        console.error("Failed to track shortlink open:", t);
      }
  }
  /** Get the encoded funnel-subscriber id from the current URL, if any. */
  getSubscriberShortId() {
    try {
      const e = new URLSearchParams(window.location.search).get(
        fe.URL_PARAM
      );
      return e && e.trim() ? e.trim() : null;
    } catch {
      return null;
    }
  }
  /** Read the list of short ids already tracked this session. */
  getTrackedShortIds() {
    if (typeof window > "u" || !window.sessionStorage)
      return [];
    try {
      const e = sessionStorage.getItem(
        fe.STORAGE_KEY
      );
      if (!e)
        return [];
      const t = JSON.parse(e);
      return Array.isArray(t) ? t : [];
    } catch {
      return [];
    }
  }
  /** Append a short id to the set of ids tracked this session. */
  markShortIdTracked(e) {
    if (!(typeof window > "u" || !window.sessionStorage))
      try {
        const t = this.getTrackedShortIds();
        if (t.includes(e))
          return;
        sessionStorage.setItem(
          fe.STORAGE_KEY,
          JSON.stringify([...t, e])
        );
      } catch (t) {
        console.warn("Failed to persist tracked shortlink id:", t);
      }
  }
  destroy() {
    this.isInitialized = !1;
  }
};
/** URL query parameter carrying the encoded funnel-subscriber id. */
p(fe, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
p(fe, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let Lt = fe;
const ne = class ne {
  constructor() {
    p(this, "overlay");
    p(this, "banners", []);
  }
  showLoading(e, t, s) {
    if (typeof document > "u" || this.overlay)
      return;
    this.ensureStyle();
    const r = document.createElement("div");
    r.setAttribute("data-ei-restore-overlay", ""), r.setAttribute("role", "dialog"), r.setAttribute("aria-modal", "true"), r.setAttribute("aria-busy", "true"), r.style.cssText = [
      "position:fixed",
      "inset:0",
      `z-index:${ne.Z_INDEX}`,
      "display:flex",
      "flex-direction:column",
      "align-items:center",
      "justify-content:center",
      "gap:16px",
      "padding:24px",
      "box-sizing:border-box",
      "background:rgba(255,255,255,0.94)",
      "font-family:inherit",
      "color:#1a1a1a",
      "text-align:center"
    ].join(";");
    const n = document.createElement("div");
    n.setAttribute("aria-hidden", "true"), n.style.cssText = "width:40px;height:40px;border-radius:50%;border:4px solid rgba(0,0,0,0.12);border-top-color:currentColor;animation:ei-restore-spin 0.9s linear infinite";
    const o = document.createElement("p");
    o.setAttribute("data-ei-restore-text", ""), o.setAttribute("role", "status"), o.style.cssText = "margin:0;font-size:16px;line-height:1.4;max-width:420px", o.textContent = e;
    const a = this.closeButton(t, s);
    a.style.position = "absolute", a.style.top = "8px", a.style.right = "8px", r.append(n, o, a), document.body.appendChild(r), this.overlay = r;
  }
  hideLoading() {
    var e;
    (e = this.overlay) == null || e.remove(), this.overlay = void 0;
  }
  isLoadingVisible() {
    var e;
    return !!((e = this.overlay) != null && e.isConnected);
  }
  showBanner(e, t) {
    if (typeof document > "u")
      return;
    const s = document.createElement("div");
    s.setAttribute("data-ei-restore-banner", ""), s.setAttribute("role", "alert"), s.style.cssText = [
      "position:fixed",
      `top:${12 + this.banners.length * 8}px`,
      "left:50%",
      "transform:translateX(-50%)",
      `z-index:${ne.Z_INDEX}`,
      "width:calc(100% - 24px)",
      "max-width:560px",
      "box-sizing:border-box",
      "display:flex",
      "align-items:flex-start",
      "gap:12px",
      "padding:14px 16px",
      "border-radius:8px",
      "background:#ffffff",
      "color:#1a1a1a",
      "box-shadow:0 4px 18px rgba(0,0,0,0.18)",
      "font-family:inherit",
      "font-size:15px",
      "line-height:1.4"
    ].join(";");
    const r = document.createElement("p");
    r.style.cssText = "margin:0;flex:1", r.textContent = e;
    const n = this.closeButton(t, () => {
      s.remove(), this.banners = this.banners.filter((o) => o !== s);
    });
    s.append(r, n), document.body.appendChild(s), this.banners.push(s);
  }
  destroy() {
    this.hideLoading(), this.banners.forEach((e) => e.remove()), this.banners = [];
  }
  closeButton(e, t) {
    const s = document.createElement("button");
    return s.type = "button", s.setAttribute("data-ei-restore-close", ""), s.setAttribute("aria-label", e), s.textContent = "×", s.style.cssText = "min-width:44px;min-height:44px;border:0;background:transparent;color:inherit;font-size:24px;line-height:1;cursor:pointer", s.addEventListener("click", t), s;
  }
  ensureStyle() {
    if (document.getElementById(ne.STYLE_ID))
      return;
    const e = document.createElement("style");
    e.id = ne.STYLE_ID, e.textContent = "@keyframes ei-restore-spin{to{transform:rotate(360deg)}}", document.head.appendChild(e);
  }
};
p(ne, "STYLE_ID", "ei-restore-style"), p(ne, "Z_INDEX", "2147483646");
let jt = ne;
const q = class q {
  static get(e) {
    const t = q.locale();
    return q.TEXT[t][e];
  }
  static forNotice(e) {
    const t = (r) => q.formatMoney(r ?? 0, e.currency), s = {
      oldPrice: t(e.oldPrice),
      newPrice: t(e.newPrice),
      savings: t(e.savings),
      promoCode: e.promoCode ?? ""
    };
    return q.get(e.kind).replace(
      /\{(\w+)\}/g,
      (r, n) => s[n] ?? r
    );
  }
  static locale() {
    const e = qt.getUserLocale(), t = q.LOCALE_ALIASES[e] ?? e;
    return q.TEXT[t] ? t : "en";
  }
  static formatMoney(e, t) {
    const s = q.locale();
    if (t)
      try {
        return new Intl.NumberFormat(s, {
          style: "currency",
          currency: t,
          maximumFractionDigits: 0
        }).format(e);
      } catch {
      }
    const r = new Intl.NumberFormat(s, {
      maximumFractionDigits: 0
    }).format(e);
    return t ? `${r} ${t}` : r;
  }
};
p(q, "TEXT", {
  en: {
    restoring: "Restoring your booking…",
    close: "Close",
    priceChanged: "We restored your booking. The price has changed from {oldPrice} to {newPrice} since you last visited.",
    promoApplied: "Your code {promoCode} has been applied. You save {savings}.",
    unavailable: "Unfortunately, the room you selected is no longer available for your dates. Please choose another room or other dates.",
    failed: "We could not restore your booking. Please search again to continue."
  },
  nb: {
    restoring: "Gjenoppretter bestillingen din…",
    close: "Lukk",
    priceChanged: "Vi har gjenopprettet bestillingen din. Prisen er endret fra {oldPrice} til {newPrice} siden sist.",
    promoApplied: "Koden {promoCode} er lagt til. Du sparer {savings}.",
    unavailable: "Dessverre er rommet du valgte ikke lenger tilgjengelig for datoene dine. Velg et annet rom eller andre datoer.",
    failed: "Vi klarte ikke å gjenopprette bestillingen din. Søk på nytt for å fortsette."
  },
  sv: {
    restoring: "Återställer din bokning…",
    close: "Stäng",
    priceChanged: "Vi har återställt din bokning. Priset har ändrats från {oldPrice} till {newPrice} sedan sist.",
    promoApplied: "Koden {promoCode} har lagts till. Du sparar {savings}.",
    unavailable: "Tyvärr är rummet du valde inte längre tillgängligt för dina datum. Välj ett annat rum eller andra datum.",
    failed: "Vi kunde inte återställa din bokning. Sök igen för att fortsätta."
  },
  da: {
    restoring: "Gendanner din booking…",
    close: "Luk",
    priceChanged: "Vi har gendannet din booking. Prisen er ændret fra {oldPrice} til {newPrice} siden sidst.",
    promoApplied: "Koden {promoCode} er tilføjet. Du sparer {savings}.",
    unavailable: "Desværre er det valgte værelse ikke længere ledigt på dine datoer. Vælg et andet værelse eller andre datoer.",
    failed: "Vi kunne ikke gendanne din booking. Søg igen for at fortsætte."
  },
  de: {
    restoring: "Ihre Buchung wird wiederhergestellt…",
    close: "Schließen",
    priceChanged: "Wir haben Ihre Buchung wiederhergestellt. Der Preis hat sich seit Ihrem letzten Besuch von {oldPrice} auf {newPrice} geändert.",
    promoApplied: "Ihr Code {promoCode} wurde angewendet. Sie sparen {savings}.",
    unavailable: "Leider ist das gewählte Zimmer für Ihre Daten nicht mehr verfügbar. Bitte wählen Sie ein anderes Zimmer oder andere Daten.",
    failed: "Ihre Buchung konnte nicht wiederhergestellt werden. Bitte suchen Sie erneut."
  }
}), p(q, "LOCALE_ALIASES", {
  no: "nb",
  nn: "nb"
});
let re = q;
const N = class N {
  constructor() {
    p(this, "stopWaiting");
    /** Fields the visitor interacted with, or that held a value of theirs. */
    p(this, "visitorFields", /* @__PURE__ */ new WeakSet());
    p(this, "filledFields", /* @__PURE__ */ new WeakSet());
  }
  /** The usable parts of a stored contact, or null when there are none. */
  static clean(e, t, s) {
    const r = {}, n = e == null ? void 0 : e.trim();
    n && N.EMAIL_PATTERN.test(n) && (r.email = n);
    const o = t == null ? void 0 : t.replace(/[^\d+]/g, "");
    if (o && o.replace(/\D/g, "").length >= 4) {
      r.phone = o;
      const a = s == null ? void 0 : s.replace(/\D/g, "");
      a && (r.phoneCountryCode = a);
    }
    return r.email || r.phone ? r : null;
  }
  fill(e) {
    var l;
    (l = this.stopWaiting) == null || l.call(this);
    const t = this.targets(e), s = (c) => {
      c.target && this.visitorFields.add(c.target);
    };
    document.addEventListener("pointerdown", s, !0), document.addEventListener("keydown", s, !0);
    const r = () => t.forEach((c) => this.fillTarget(c, e));
    r();
    const n = setInterval(r, N.CHECK_EVERY_MS), o = setTimeout(() => a(), N.WAIT_MS), a = () => {
      clearInterval(n), clearTimeout(o), document.removeEventListener("pointerdown", s, !0), document.removeEventListener("keydown", s, !0), this.stopWaiting = void 0;
    };
    this.stopWaiting = a;
  }
  destroy() {
    var e;
    (e = this.stopWaiting) == null || e.call(this);
  }
  targets(e) {
    const t = [];
    return e.email && t.push("email"), e.phone && t.push("phone"), t;
  }
  fillTarget(e, t) {
    if (e === "email") {
      const a = this.find(N.EMAIL_FIELD);
      a && this.setIfEmpty(a, t.email);
      return;
    }
    const { countryCode: s, number: r } = this.splitPhone(t), n = this.find(N.NATIONAL_FIELD);
    if (n) {
      const a = this.find(N.COUNTRY_CODE_FIELD);
      a && s && this.setIfEmpty(a, s), this.setIfEmpty(n, r);
      return;
    }
    const o = this.find(N.PHONE_FIELD);
    o && this.setIfEmpty(o, s ? `+${s}${r}` : r);
  }
  /** "+4712345678" with no separate code is kept whole as the number. */
  splitPhone(e) {
    const t = e.phone;
    if (!e.phoneCountryCode)
      return { countryCode: null, number: t };
    const s = e.phoneCountryCode, r = t.replace(/\D/g, ""), n = t.startsWith("+") && r.startsWith(s) ? r.slice(s.length) : r;
    return { countryCode: s, number: n };
  }
  find(e) {
    return document.querySelector(e);
  }
  /**
   * Set a value the way typing does, so frameworks that track input
   * state (React's value tracker) see the change.
   */
  setIfEmpty(e, t) {
    var r;
    if (this.visitorFields.has(e))
      return;
    if (e.value) {
      this.filledFields.has(e) || this.visitorFields.add(e);
      return;
    }
    this.filledFields.add(e);
    const s = (r = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )) == null ? void 0 : r.set;
    s ? s.call(e, t) : e.value = t, e.dispatchEvent(new Event("input", { bubbles: !0 })), e.dispatchEvent(new Event("change", { bubbles: !0 }));
  }
};
p(N, "WAIT_MS", 2e4), p(N, "CHECK_EVERY_MS", 250), p(N, "EMAIL_PATTERN", /^[^\s@]+@[^\s@]+\.[^\s@]+$/), p(N, "EMAIL_FIELD", 'input[type="email"]'), p(N, "COUNTRY_CODE_FIELD", 'input[autocomplete="tel-country-code"]'), p(N, "NATIONAL_FIELD", 'input[autocomplete="tel-national"]'), p(N, "PHONE_FIELD", 'input[type="tel"]');
let X = N;
const I = class I {
  constructor(e) {
    p(this, "options");
    p(this, "supabaseService");
    p(this, "overlay", new jt());
    p(this, "controller");
    p(this, "isInitialized", !1);
    p(this, "lastOutcome");
    p(this, "prefill", new X());
    this.options = e, this.supabaseService = new Me(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    if (this.isInitialized || (this.isInitialized = !0, typeof window > "u"))
      return !0;
    this.showPendingNotices(), this.fillPendingContact();
    const e = this.getShortId();
    if (!e || this.getAttemptedIds().includes(e))
      return !0;
    const t = await this.getRestoreChannelId();
    if (!t)
      return !0;
    this.markAttempted(e);
    const s = await this.run(e, t);
    return this.lastOutcome = s, this.supabaseService.createAssistantEvent({
      id_short_encoded: e,
      type: "cart_restore",
      outcome: s
    }), !0;
  }
  getLastOutcome() {
    return this.lastOutcome;
  }
  destroy() {
    var e;
    (e = this.controller) == null || e.abort(), this.controller = void 0, this.prefill.destroy(), this.overlay.destroy(), this.isInitialized = !1;
  }
  /** Full navigation, so BookVisit's app boots with the new basket. */
  navigate(e) {
    window.location.assign(e);
  }
  async getRestoreChannelId() {
    var s, r;
    if (((s = this.options.features) == null ? void 0 : s.cartRestore) !== !0)
      return null;
    const e = await this.supabaseService.getCheckoutCampaign(
      this.options.checkoutCampaignId
    ), t = (r = e == null ? void 0 : e.config) == null ? void 0 : r.bookvisit;
    return (e == null ? void 0 : e.type) !== "bookvisit" || (t == null ? void 0 : t.restore) !== !0 ? null : t.channel_id || null;
  }
  /**
   * Run the restore under one master timer. On expiry, or when the visitor
   * closes the overlay, every request is aborted and the overlay removed.
   */
  async run(e, t) {
    const s = new AbortController();
    this.controller = s;
    const r = { current: "spec" };
    let n = !1, o = !1;
    this.overlay.showLoading(
      re.get("restoring"),
      re.get("close"),
      () => s.abort()
    );
    const a = setTimeout(() => {
      n = !0, s.abort(), this.overlay.hideLoading();
    }, I.TIMEOUT_MS);
    let l = [];
    try {
      const c = await this.restore(
        e,
        t,
        s.signal,
        r
      );
      return l = c.notices, c.continueTo && (this.storePendingNotices(l), this.storePendingContact(c.contact), l = [], o = !0, this.navigate(c.continueTo)), c.outcome;
    } catch (c) {
      return s.signal.aborted ? n ? (l = [{ kind: "failed" }], r.current === "token" ? "no_token" : "timeout") : "cancelled" : (console.error("Cart restore failed:", c), l = [{ kind: "failed" }], "failed");
    } finally {
      o || (clearTimeout(a), this.overlay.hideLoading()), l.forEach(
        (c) => this.overlay.showBanner(
          re.forNotice(c),
          re.get("close")
        )
      ), this.controller === s && (this.controller = void 0);
    }
  }
  async restore(e, t, s, r) {
    var g;
    const n = {
      outcome: "failed",
      notices: [{ kind: "failed" }]
    };
    r.current = "spec";
    const o = await this.abortable(
      this.supabaseService.getCartRestore(
        e,
        this.getRestoreToken(),
        this.options.organizationId,
        this.options.checkoutCampaignId
      ),
      s
    ), a = o ? this.getRestorableRooms(o) : null;
    if (!o || !a)
      return { ...n, outcome: "invalid_link" };
    if (a.some((v) => v.startDate < this.today()))
      return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
    const l = new De(t);
    if (r.current = "token", !await this.abortable(l.waitForToken(s), s))
      return { ...n, outcome: "no_token" };
    r.current = "basket";
    const u = await this.abortable(l.getBasket(s), s);
    if (!u)
      return n;
    if (De.basketHasRooms(u))
      return { outcome: "basket_exists", notices: [] };
    o.session_id && Qe.saveSessionIdToStorage(o.session_id), r.current = "search";
    const d = ((g = o.promo_code) == null ? void 0 : g.trim()) || void 0, h = [];
    for (const v of this.groupByStay(a)) {
      const m = {
        startDate: v[0].startDate,
        endDate: v[0].endDate,
        roomConfigs: v.map((w) => this.toRoomConfig(w))
      }, [b, E] = await this.abortable(
        Promise.all([
          l.search(m, s),
          d ? l.search({ ...m, promoCode: d }, s) : Promise.resolve(null)
        ]),
        s
      );
      if (!b)
        return n;
      const y = this.matchRooms(v, b, E);
      if (!y)
        return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
      h.push(...y);
    }
    r.current = "add";
    for (const [v, m] of h.entries())
      if (!await this.abortable(
        l.addRoom(m.hitKey, m.resultId, v > 0, s),
        s
      ))
        return n;
    const f = this.buildNotices(h, d);
    return {
      outcome: f.some((v) => v.kind === "priceChanged") ? "restored_price_changed" : "restored",
      notices: f,
      continueTo: this.continueUrl(),
      contact: X.clean(o.email, o.phone, o.phone_country_code) ?? void 0
    };
  }
  /**
   * The rooms of a stored cart, or null when any of them cannot be
   * searched again. Add-ons are not restored.
   */
  getRestorableRooms(e) {
    const t = e.products.filter((r) => (r == null ? void 0 : r.type) === "room");
    return t.length === 0 ? null : t.every(
      (r) => {
        var n;
        return typeof r.id == "string" && r.id.length > 0 && I.DATE_PATTERN.test(r.startDate ?? "") && I.DATE_PATTERN.test(r.endDate ?? "") && r.endDate > r.startDate && Number.isInteger((n = r.roomConfig) == null ? void 0 : n.adults) && r.roomConfig.adults > 0;
      }
    ) ? t : null;
  }
  groupByStay(e) {
    const t = /* @__PURE__ */ new Map();
    for (const s of e) {
      const r = `${s.startDate}|${s.endDate}`;
      t.set(r, [...t.get(r) ?? [], s]);
    }
    return Array.from(t.values());
  }
  /** search-v1 takes `childAges: []`, never null, and no other fields. */
  toRoomConfig(e) {
    var s, r;
    const t = (s = e.roomConfig) == null ? void 0 : s.childAges;
    return {
      adults: ((r = e.roomConfig) == null ? void 0 : r.adults) ?? 1,
      childAges: Array.isArray(t) ? t.filter((n) => Number.isInteger(n)) : []
    };
  }
  /**
   * Find each room's rate in the search results: same room and rate plan
   * (by id, or by name for carts saved before rate plan ids were stored).
   * Null when any room has no match; a different rate is never picked.
   */
  matchRooms(e, t, s) {
    const r = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), o = [];
    for (const a of e) {
      const l = this.findHit(t.hits, a, r);
      if (!l)
        return null;
      r.add(l.hitKey);
      const c = s ? this.findHit(s.hits, a, n) : null;
      c && n.add(c.hitKey), o.push({
        room: a,
        hitKey: (c == null ? void 0 : c.hitKey) ?? l.hitKey,
        resultId: c && s ? s.resultId : t.resultId,
        plainPrice: l.price,
        promoPrice: (c == null ? void 0 : c.price) ?? null,
        currency: l.currency ?? (c == null ? void 0 : c.currency) ?? null
      });
    }
    return o;
  }
  /**
   * Each searched room config gets its own hitKey per rate, in no
   * particular order, so hits are matched to rooms on their guests.
   */
  findHit(e, t, s) {
    var o;
    const r = (o = t.ratePlan) == null ? void 0 : o.trim().toLowerCase(), n = this.toRoomConfig(t);
    return e.find((a) => {
      var l;
      return s.has(a.hitKey) || a.roomId !== t.id || a.roomConfig && !this.sameGuests(a.roomConfig, n) ? !1 : t.ratePlanId ? a.ratePlanId === t.ratePlanId : !!r && ((l = a.ratePlanName) == null ? void 0 : l.trim().toLowerCase()) === r;
    }) ?? null;
  }
  sameGuests(e, t) {
    const s = (r) => [...r.childAges].sort((n, o) => n - o).join(",");
    return e.adults === t.adults && s(e) === s(t);
  }
  buildNotices(e, t) {
    var n;
    const s = [], r = ((n = e.find((o) => o.currency)) == null ? void 0 : n.currency) ?? null;
    if (e.every((o) => o.plainPrice !== null)) {
      const o = e.reduce(
        (l, c) => l + Math.round(c.room.price),
        0
      ), a = e.reduce(
        (l, c) => l + c.plainPrice,
        0
      );
      o !== a && s.push({ kind: "priceChanged", oldPrice: o, newPrice: a, currency: r });
    }
    if (t) {
      const o = e.reduce(
        (a, l) => l.plainPrice !== null && l.promoPrice !== null && l.promoPrice < l.plainPrice ? a + (l.plainPrice - l.promoPrice) : a,
        0
      );
      o > 0 && s.push({ kind: "promoApplied", promoCode: t, savings: o, currency: r });
    }
    return s;
  }
  /**
   * Checkout page on this site, keeping the language prefix (`/no/…`) and
   * every query param except `s` and `rt`.
   */
  continueUrl() {
    var r;
    const e = new URLSearchParams(window.location.search);
    e.delete(I.URL_PARAM), e.delete(I.TOKEN_PARAM);
    const t = e.toString();
    return `${((r = I.LANGUAGE_PREFIX.exec(window.location.pathname)) == null ? void 0 : r[0]) ?? ""}${I.CONTINUE_PATH}${t ? `?${t}` : ""}`;
  }
  abortable(e, t) {
    return new Promise((s, r) => {
      if (t.aborted) {
        r(new Error("Cart restore aborted"));
        return;
      }
      const n = () => r(new Error("Cart restore aborted"));
      t.addEventListener("abort", n, { once: !0 }), e.then(s, r).finally(
        () => t.removeEventListener("abort", n)
      );
    });
  }
  today() {
    const e = /* @__PURE__ */ new Date(), t = (s) => String(s).padStart(2, "0");
    return `${e.getFullYear()}-${t(e.getMonth() + 1)}-${t(e.getDate())}`;
  }
  getShortId() {
    try {
      const e = new URLSearchParams(window.location.search).get(
        I.URL_PARAM
      );
      return e && e.trim() ? e.trim() : null;
    } catch {
      return null;
    }
  }
  getRestoreToken() {
    var e;
    try {
      const t = (e = new URLSearchParams(window.location.search).get(I.TOKEN_PARAM)) == null ? void 0 : e.trim();
      return t && I.TOKEN_PATTERN.test(t) ? t : null;
    } catch {
      return null;
    }
  }
  getAttemptedIds() {
    try {
      const e = JSON.parse(
        sessionStorage.getItem(I.ATTEMPTED_KEY) ?? "[]"
      );
      return Array.isArray(e) ? e : [];
    } catch {
      return [];
    }
  }
  markAttempted(e) {
    try {
      sessionStorage.setItem(
        I.ATTEMPTED_KEY,
        JSON.stringify([...this.getAttemptedIds(), e])
      );
    } catch (t) {
      console.warn("Failed to persist cart restore attempt:", t);
    }
  }
  /** Notices for the page we navigate to, shown once it loads. */
  storePendingNotices(e) {
    if (e.length !== 0)
      try {
        sessionStorage.setItem(
          I.NOTICES_KEY,
          JSON.stringify(e)
        );
      } catch (t) {
        console.warn("Failed to persist cart restore notices:", t);
      }
  }
  storePendingContact(e) {
    if (e)
      try {
        sessionStorage.setItem(I.CONTACT_KEY, JSON.stringify(e));
      } catch (t) {
        console.warn("Failed to persist cart restore contact:", t);
      }
  }
  /** Fill the contact saved by a restore into the checkout form. */
  fillPendingContact() {
    let e = null;
    try {
      e = sessionStorage.getItem(I.CONTACT_KEY), sessionStorage.removeItem(I.CONTACT_KEY);
    } catch {
      return;
    }
    let t = null;
    try {
      t = e ? JSON.parse(e) : null;
    } catch {
      return;
    }
    const s = t ? X.clean(t.email, t.phone, t.phoneCountryCode) : null;
    s && this.prefill.fill(s);
  }
  showPendingNotices() {
    let e = [];
    try {
      const t = sessionStorage.getItem(I.NOTICES_KEY);
      sessionStorage.removeItem(I.NOTICES_KEY);
      const s = t ? JSON.parse(t) : [];
      e = Array.isArray(s) ? s : [];
    } catch {
      return;
    }
    e.forEach(
      (t) => this.overlay.showBanner(
        re.forNotice(t),
        re.get("close")
      )
    );
  }
};
p(I, "URL_PARAM", "s"), /** Secret per-link token; without it only the rooms come back. */
p(I, "TOKEN_PARAM", "rt"), p(I, "TOKEN_PATTERN", /^[0-9a-f-]{36}$/i), p(I, "ATTEMPTED_KEY", "ei_cart_restore_attempted_ids"), p(I, "NOTICES_KEY", "ei_cart_restore_notices"), p(I, "CONTACT_KEY", "ei_cart_restore_contact"), p(I, "TIMEOUT_MS", 8e3), p(I, "CONTINUE_PATH", "/checkout"), p(I, "DATE_PATTERN", /^\d{4}-\d{2}-\d{2}$/), p(I, "LANGUAGE_PREFIX", /^\/[a-z]{2}(?=\/)/);
let Rt = I;
const ie = class ie {
  static get(e) {
    return ie.TEXT[ie.locale()][e];
  }
  static locale() {
    const e = typeof document < "u" ? document.documentElement.lang.split("-")[0].toLowerCase() : "";
    for (const t of [e, qt.getUserLocale()]) {
      const s = ie.LOCALE_ALIASES[t] ?? t;
      if (ie.TEXT[s])
        return s;
    }
    return "en";
  }
};
p(ie, "TEXT", {
  en: { email: "Email" },
  nb: { email: "E-post" },
  sv: { email: "E-post" },
  da: { email: "E-mail" },
  de: { email: "E-Mail" }
}), p(ie, "LOCALE_ALIASES", {
  no: "nb",
  nn: "nb"
});
let $t = ie;
const A = class A {
  constructor(e) {
    p(this, "options");
    p(this, "supabaseService");
    p(this, "prefill", new X());
    /** Kept while off the page, so a typed value survives a re-render. */
    p(this, "field");
    p(this, "observer");
    p(this, "filledCheckoutField");
    p(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new Me(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    return this.isInitialized || (this.isInitialized = !0, typeof window > "u" || typeof MutationObserver > "u") || !await this.isEnabled() || !this.isInitialized || (this.field = this.createField(), this.observer = new MutationObserver(() => this.sync()), this.observer.observe(document.body, { childList: !0, subtree: !0 }), this.sync()), !0;
  }
  destroy() {
    var e, t;
    (e = this.observer) == null || e.disconnect(), this.observer = void 0, (t = this.field) == null || t.remove(), this.field = void 0, this.filledCheckoutField = void 0, this.prefill.destroy(), this.isInitialized = !1;
  }
  async isEnabled() {
    var t, s, r;
    if (((t = this.options.features) == null ? void 0 : t.searchEmail) !== !0)
      return !1;
    const e = await this.supabaseService.getCheckoutCampaign(
      this.options.checkoutCampaignId
    );
    return (e == null ? void 0 : e.type) === "bookvisit" && ((r = (s = e.config) == null ? void 0 : s.bookvisit) == null ? void 0 : r.search_email) === !0;
  }
  sync() {
    this.placeField(), this.fillCheckout();
  }
  /** Right above the row holding the search button. */
  placeField() {
    const e = this.field, t = document.getElementById(A.SEARCH_BOX_ID), s = t == null ? void 0 : t.querySelector(A.SEARCH_BUTTON);
    if (!e || !t || !s)
      return;
    let r = s;
    for (; r.parentElement && r.parentElement !== t; )
      r = r.parentElement;
    (e.parentElement !== t || e.nextElementSibling !== r) && t.insertBefore(e, r);
  }
  /** Each checkout email field BookVisit renders is filled once. */
  fillCheckout() {
    if (!A.CHECKOUT_PATH.test(window.location.pathname))
      return;
    const e = document.querySelector(
      X.EMAIL_FIELD
    );
    if (!e || e === this.filledCheckoutField)
      return;
    const t = this.storedEmail();
    t && (this.filledCheckoutField = e, this.prefill.fill({ email: t }));
  }
  /**
   * Not `type="email"`, so neither our checkout prefill nor BookVisit's
   * form code mistakes it for the checkout email field.
   */
  createField() {
    this.ensureStyle();
    const e = $t.get("email"), t = document.createElement("label");
    t.setAttribute(A.FIELD_ATTRIBUTE, ""), t.setAttribute(We.NO_CAPTURE_ATTRIBUTE, ""), t.className = A.FIELD_CLASS, t.innerHTML = A.ICON;
    const s = document.createElement("input");
    return s.type = "text", s.name = "ei-search-email", s.inputMode = "email", s.autocomplete = "email", s.spellcheck = !1, s.setAttribute("autocapitalize", "off"), s.setAttribute("aria-label", e), s.placeholder = e, s.style.cssText = A.INPUT_STYLE, s.value = this.storedEmail() ?? "", s.addEventListener("input", () => this.storeEmail(s.value)), t.appendChild(s), t;
  }
  storedEmail() {
    var e;
    try {
      const t = sessionStorage.getItem(A.STORAGE_KEY);
      return ((e = X.clean(t, null, null)) == null ? void 0 : e.email) ?? null;
    } catch {
      return null;
    }
  }
  /** Only a complete address is kept; clearing the field forgets it. */
  storeEmail(e) {
    var s;
    const t = (s = X.clean(e, null, null)) == null ? void 0 : s.email;
    try {
      t ? sessionStorage.setItem(A.STORAGE_KEY, t) : sessionStorage.removeItem(A.STORAGE_KEY);
    } catch (r) {
      console.warn("Failed to persist search email:", r);
    }
  }
  ensureStyle() {
    if (document.getElementById(A.STYLE_ID))
      return;
    const e = document.createElement("style");
    e.id = A.STYLE_ID, e.textContent = A.CSS, document.head.appendChild(e);
  }
};
p(A, "FIELD_ATTRIBUTE", "data-ei-search-email"), p(A, "STORAGE_KEY", "ei_search_email"), p(A, "STYLE_ID", "ei-search-email-style"), p(A, "SEARCH_BOX_ID", "calendarInnerWrapper"), p(A, "SEARCH_BUTTON", '[data-testid="search_button"]'), p(A, "CHECKOUT_PATH", /\/checkout(\/|$)/), /** The guest picker's classes, which BookVisit's stylesheet already has. */
p(A, "FIELD_CLASS", "sm:w-full bv:flex bv:min-h-[40px] bv:w-full bv:grid-cols-[max-content_1fr] bv:content-center bv:items-center bv:whitespace-nowrap bv:rounded-bv_inputRoundedCorners bv:border-bv_inputBorderWidth bv:border-solid bv:border-bv_formBorderColor bv:bg-bv_formBackground bv:px-[10px] bv:py-[5px] bv:text-left bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:leading-bv_bodyLineHeight bv:text-bv_formColor bv:shadow-bv_inputTextBoxShadow bv:transition-[filter,background] bv:duration-200 bv:bv_small:w-full bv:hover:border-bv_inputBorderWidth! bv:hover:border-bv_inputBorderColor! bv:hover:bg-bv_formBackground! bv:hover:text-bv_formColor! bv:bv_large:mt-[20px]"), p(A, "INPUT_STYLE", [
  "flex:1 1 auto",
  "min-width:0",
  "width:100%",
  "height:auto",
  "margin:0",
  "padding:0 0 0 8px",
  "border:0",
  "border-radius:0",
  "background:transparent",
  "box-shadow:none",
  "outline:none",
  "color:inherit",
  "font:inherit"
].join(";")), p(A, "CSS", `[${A.FIELD_ATTRIBUTE}]{cursor:text}[${A.FIELD_ATTRIBUTE}]:focus-within{outline:2px solid currentColor;outline-offset:-2px}[${A.FIELD_ATTRIBUTE}] input::placeholder{color:inherit;opacity:0.7}`), /** Font Awesome's regular envelope, like the guest picker's user icon. */
p(A, "ICON", '<svg data-prefix="far" data-icon="envelope" class="svg-inline--fa fa-envelope bv:text-[18px] bv:opacity-60" role="img" viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M64 112c-8.8 0-16 7.2-16 16l0 22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1l0-22.1c0-8.8-7.2-16-16-16L64 112zM48 212.2L48 384c0 8.8 7.2 16 16 16l384 0c8.8 0 16-7.2 16-16l0-171.8L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64l384 0c35.3 0 64 28.7 64 64l0 256c0 35.3-28.7 64-64 64L64 448c-35.3 0-64-28.7-64-64L0 128z"></path></svg>');
let Dt = A;
class bo {
  constructor(e) {
    p(this, "options");
    p(this, "tools", /* @__PURE__ */ new Map());
    p(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s, r, n, o, a;
    if (this._isInitialized)
      return !0;
    try {
      so({
        cookieDomain: this.options.cookieDomain,
        requireConsent: this.options.requireConsent,
        shareInsightsAcrossSubdomains: this.options.shareInsightsAcrossSubdomains
      }), fo({
        enabled: !!((e = this.options.features) != null && e.abandonedCart) && ((t = this.options.features) == null ? void 0 : t.stayCapture) !== !1
      });
      const l = new Lt(this.options);
      if (await l.initialize(), this.tools.set("linkTracking", l), (s = this.options.features) != null && s.cartRestore) {
        const c = new Rt(this.options);
        await c.initialize(), this.tools.set("cartRestore", c);
      }
      if ((r = this.options.features) != null && r.abandonedCart) {
        const c = new Qe(this.options);
        await c.initialize(), this.tools.set("abandonedCart", c);
      }
      if ((n = this.options.features) != null && n.searchEmail) {
        const c = new Dt(this.options);
        await c.initialize(), this.tools.set("searchEmail", c);
      }
      if ((o = this.options.features) != null && o.organizationPipeline) {
        const c = new vo(
          this.options
        );
        await c.initialize(), this.tools.set(
          "organizationPipeline",
          c
        );
      }
      if ((a = this.options.features) != null && a.enhancedInsights) {
        const c = async () => {
          if (this.tools.has("enhancedInsights")) return;
          const u = new yo(
            this.options
          );
          await u.initialize(), this.tools.set("enhancedInsights", u);
        };
        at() && await c(), this.options.requireConsent && nr((u) => {
          if (u)
            c();
          else {
            const d = this.tools.get("enhancedInsights");
            d && (d.destroy(), d.clearData(), this.tools.delete("enhancedInsights"));
          }
        });
      }
      return this._isInitialized = !0, !0;
    } catch {
      return !1;
    }
  }
  // Public API methods
  getAbandonedCartTool() {
    return this.tools.get("abandonedCart");
  }
  getOrganizationPipelineTool() {
    return this.tools.get("organizationPipeline");
  }
  getEnhancedInsightsTool() {
    return this.tools.get("enhancedInsights");
  }
  getLinkTrackingTool() {
    return this.tools.get("linkTracking");
  }
  getCartRestoreTool() {
    return this.tools.get("cartRestore");
  }
  getSearchEmailTool() {
    return this.tools.get("searchEmail");
  }
  /**
   * Grant or revoke analytics-persistence consent. Wire this to the CMP's
   * consent callback when the SDK is configured with `requireConsent: true`
   * (Cookiebot, OneTrust and TCF-compliant CMPs are also auto-detected).
   * Revoking clears the persisted payload and cookie.
   */
  setConsent(e) {
    Re(e);
  }
  destroy() {
    this.tools.forEach((e) => {
      e.destroy && e.destroy();
    }), this.tools.clear(), this._isInitialized = !1;
  }
  isInitialized() {
    return this._isInitialized;
  }
}
typeof window < "u" && (window.EkteIntelligensSDK = bo);
export {
  bo as EkteIntelligensSDK
};
