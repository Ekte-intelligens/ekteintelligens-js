var Us = Object.defineProperty;
var Ns = (i, e, t) => e in i ? Us(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var v = (i, e, t) => Ns(i, typeof e != "symbol" ? e + "" : e, t);
const X = class X {
  constructor(e) {
    v(this, "inputMapping");
    v(this, "content", {});
    v(this, "sessionId");
    v(this, "hasEmailOrPhone", !1);
    v(this, "onContentUpdate");
    // One stable reference: `.bind(this)` returns a new function on every
    // call, so removeEventListener(this.handleInputBlur.bind(this)) never
    // removed anything and a stop/start cycle stacked duplicate listeners.
    // Adding the same reference twice is a no-op, so restarts are safe too.
    v(this, "boundHandleInputBlur", (e) => this.handleInputBlur(e));
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
    if (X.IGNORED_INPUT_TYPES.has(t)) return !0;
    const s = (e.getAttribute("autocomplete") || "").toLowerCase();
    return /(^|\s)(cc-[a-z-]+|current-password|new-password|one-time-code)(\s|$)/.test(
      s
    ) ? !0 : X.SENSITIVE_NAME.test(e.name || "") || X.SENSITIVE_NAME.test(e.id || "");
  }
  getTargetInputs() {
    const e = (t) => t.filter(
      (s) => !this.isInputExcluded(s) && !this.isSensitiveInput(s)
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
// Input types that never hold contact details worth recovering a cart
// with. `password` is the one that matters: checkouts with a login or
// create-account form had the password uploaded as session content.
v(X, "IGNORED_INPUT_TYPES", /* @__PURE__ */ new Set([
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
v(X, "SENSITIVE_NAME", /passw|passord|pwd|cvc|cvv|card[-_ ]?(number|(num|no)([^a-z]|$))|security[-_ ]?code|kontonummer|account[-_ ]?number|personnummer|f[oø]dselsnummer|(^|[^a-z])(ssn|iban)([^a-z]|$)|(^|[^a-z])cc[-_]?(number|num|csc|exp)/i);
let Ge = X;
class Fs {
  constructor(e) {
    v(this, "productMapping");
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
            const u = e.querySelector(l);
            if (u)
              return ((r = u.textContent) == null ? void 0 : r.trim()) || null;
          } catch (u) {
            console.warn(
              `Invalid selector in comma list: ${l}`,
              u
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
class Bs {
  constructor(e) {
    v(this, "totalSelector");
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
        const l = r.lastIndexOf(","), u = r.lastIndexOf(".");
        l > u ? r.substring(l + 1).length === 2 ? (r = r.replace(/\./g, ""), r = r.replace(",", ".")) : r = r.replace(/,/g, "") : r = r.replace(/,/g, "");
      } else if (n && !o) {
        const l = r.match(/,/g);
        if ((l ? l.length : 0) > 1)
          r = r.replace(/,/g, "");
        else {
          const c = r.match(/,(\d+)$/);
          c && c[1].length === 3 ? r = r.replace(",", "") : r = r.replace(",", ".");
        }
      } else if (!n && o) {
        const l = r.match(/\./g);
        if ((l ? l.length : 0) > 1)
          r = r.replace(/\./g, "");
        else {
          const c = r.match(/\.(\d+)$/);
          c && c[1].length === 3 && (r = r.replace(".", ""));
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
const Ms = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => de).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class dt extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class qs extends dt {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Lt extends dt {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Dt extends dt {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var Qe;
(function(i) {
  i.Any = "any", i.ApNortheast1 = "ap-northeast-1", i.ApNortheast2 = "ap-northeast-2", i.ApSouth1 = "ap-south-1", i.ApSoutheast1 = "ap-southeast-1", i.ApSoutheast2 = "ap-southeast-2", i.CaCentral1 = "ca-central-1", i.EuCentral1 = "eu-central-1", i.EuWest1 = "eu-west-1", i.EuWest2 = "eu-west-2", i.EuWest3 = "eu-west-3", i.SaEast1 = "sa-east-1", i.UsEast1 = "us-east-1", i.UsWest1 = "us-west-1", i.UsWest2 = "us-west-2";
})(Qe || (Qe = {}));
var zs = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
class Hs {
  constructor(e, { headers: t = {}, customFetch: s, region: r = Qe.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = Ms(s);
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
    return zs(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: n, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region);
        const u = new URL(`${this.url}/${e}`);
        l && l !== "any" && (a["x-region"] = l, u.searchParams.set("forceFunctionRegion", l));
        let c;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", c = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", c = o) : typeof FormData < "u" && o instanceof FormData ? c = o : (a["Content-Type"] = "application/json", c = JSON.stringify(o)));
        const h = yield this.fetch(u.toString(), {
          method: n || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: c
        }).catch((y) => {
          throw new qs(y);
        }), d = h.headers.get("x-relay-error");
        if (d && d === "true")
          throw new Lt(h);
        if (!h.ok)
          throw new Dt(h);
        let f = ((s = h.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield h.json() : f === "application/octet-stream" ? p = yield h.blob() : f === "text/event-stream" ? p = h : f === "multipart/form-data" ? p = yield h.formData() : p = yield h.text(), { data: p, error: null, response: h };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof Dt || r instanceof Lt ? r.context : void 0
        };
      }
    });
  }
}
var L = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Vs(i) {
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
var R = {}, ft = {}, $e = {}, ke = {}, Re = {}, Le = {}, Ws = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, he = Ws();
const Ks = he.fetch, ss = he.fetch.bind(he), rs = he.Headers, Js = he.Request, Gs = he.Response, de = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: rs,
  Request: Js,
  Response: Gs,
  default: ss,
  fetch: Ks
}, Symbol.toStringTag, { value: "Module" })), Qs = /* @__PURE__ */ Vs(de);
var De = {};
Object.defineProperty(De, "__esModule", { value: !0 });
let Xs = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
De.default = Xs;
var ns = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Le, "__esModule", { value: !0 });
const Ys = ns(Qs), Zs = ns(De);
let er = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = Ys.default : this.fetch = fetch;
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
      let u = null, c = null, h = null, d = n.status, f = n.statusText;
      if (n.ok) {
        if (this.method !== "HEAD") {
          const w = await n.text();
          w === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? c = w : c = JSON.parse(w));
        }
        const y = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), g = (a = n.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        y && g && g.length > 1 && (h = parseInt(g[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(c) && (c.length > 1 ? (u = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${c.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, c = null, h = null, d = 406, f = "Not Acceptable") : c.length === 1 ? c = c[0] : c = null);
      } else {
        const y = await n.text();
        try {
          u = JSON.parse(y), Array.isArray(u) && n.status === 404 && (c = [], u = null, d = 200, f = "OK");
        } catch {
          n.status === 404 && y === "" ? (d = 204, f = "No Content") : u = {
            message: y
          };
        }
        if (u && this.isMaybeSingle && (!((l = u == null ? void 0 : u.details) === null || l === void 0) && l.includes("0 rows")) && (u = null, d = 200, f = "OK"), u && this.shouldThrowOnError)
          throw new Zs.default(u);
      }
      return {
        error: u,
        data: c,
        count: h,
        status: d,
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
Le.default = er;
var tr = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Re, "__esModule", { value: !0 });
const sr = tr(Le);
let rr = class extends sr.default {
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
    ].filter(Boolean).join("|"), u = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${o}; for="${u}"; options=${l};`, o === "json" ? this : this;
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
Re.default = rr;
var nr = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(ke, "__esModule", { value: !0 });
const ir = nr(Re);
let or = class extends ir.default {
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
ke.default = or;
var ar = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty($e, "__esModule", { value: !0 });
const pe = ar(ke);
let lr = class {
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
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new pe.default({
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
    return new pe.default({
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
      const l = e.reduce((u, c) => u.concat(Object.keys(c)), []);
      if (l.length > 0) {
        const u = [...new Set(l)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", u.join(","));
      }
    }
    return new pe.default({
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
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new pe.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new pe.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
$e.default = lr;
var Ue = {}, Ne = {};
Object.defineProperty(Ne, "__esModule", { value: !0 });
Ne.version = void 0;
Ne.version = "0.0.0-automated";
Object.defineProperty(Ue, "__esModule", { value: !0 });
Ue.DEFAULT_HEADERS = void 0;
const cr = Ne;
Ue.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${cr.version}` };
var is = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(ft, "__esModule", { value: !0 });
const ur = is($e), hr = is(ke), dr = Ue;
let fr = class os {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, dr.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new ur.default(t, {
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
    return new os(this.url, {
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
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([c, h]) => h !== void 0).map(([c, h]) => [c, Array.isArray(h) ? `{${h.join(",")}}` : `${h}`]).forEach(([c, h]) => {
      a.searchParams.append(c, h);
    })) : (o = "POST", l = t);
    const u = Object.assign({}, this.headers);
    return n && (u.Prefer = `count=${n}`), new hr.default({
      method: o,
      url: a,
      headers: u,
      schema: this.schemaName,
      body: l,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
ft.default = fr;
var fe = L && L.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(R, "__esModule", { value: !0 });
R.PostgrestError = R.PostgrestBuilder = R.PostgrestTransformBuilder = R.PostgrestFilterBuilder = R.PostgrestQueryBuilder = R.PostgrestClient = void 0;
const as = fe(ft);
R.PostgrestClient = as.default;
const ls = fe($e);
R.PostgrestQueryBuilder = ls.default;
const cs = fe(ke);
R.PostgrestFilterBuilder = cs.default;
const us = fe(Re);
R.PostgrestTransformBuilder = us.default;
const hs = fe(Le);
R.PostgrestBuilder = hs.default;
const ds = fe(De);
R.PostgrestError = ds.default;
var pr = R.default = {
  PostgrestClient: as.default,
  PostgrestQueryBuilder: ls.default,
  PostgrestFilterBuilder: cs.default,
  PostgrestTransformBuilder: us.default,
  PostgrestBuilder: hs.default,
  PostgrestError: ds.default
};
const {
  PostgrestClient: gr,
  PostgrestQueryBuilder: Li,
  PostgrestFilterBuilder: Di,
  PostgrestTransformBuilder: Ui,
  PostgrestBuilder: Ni,
  PostgrestError: Fi
} = pr;
function mr() {
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
const vr = mr(), yr = "2.11.15", br = `realtime-js/${yr}`, _r = "1.0.0", fs = 1e4, wr = 1e3;
var me;
(function(i) {
  i[i.connecting = 0] = "connecting", i[i.open = 1] = "open", i[i.closing = 2] = "closing", i[i.closed = 3] = "closed";
})(me || (me = {}));
var j;
(function(i) {
  i.closed = "closed", i.errored = "errored", i.joined = "joined", i.joining = "joining", i.leaving = "leaving";
})(j || (j = {}));
var U;
(function(i) {
  i.close = "phx_close", i.error = "phx_error", i.join = "phx_join", i.reply = "phx_reply", i.leave = "phx_leave", i.access_token = "access_token";
})(U || (U = {}));
var Xe;
(function(i) {
  i.websocket = "websocket";
})(Xe || (Xe = {}));
var Q;
(function(i) {
  i.Connecting = "connecting", i.Open = "open", i.Closing = "closing", i.Closed = "closed";
})(Q || (Q = {}));
class Sr {
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
    const u = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: l, payload: u };
  }
}
class ps {
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
var E;
(function(i) {
  i.abstime = "abstime", i.bool = "bool", i.date = "date", i.daterange = "daterange", i.float4 = "float4", i.float8 = "float8", i.int2 = "int2", i.int4 = "int4", i.int4range = "int4range", i.int8 = "int8", i.int8range = "int8range", i.json = "json", i.jsonb = "jsonb", i.money = "money", i.numeric = "numeric", i.oid = "oid", i.reltime = "reltime", i.text = "text", i.time = "time", i.timestamp = "timestamp", i.timestamptz = "timestamptz", i.timetz = "timetz", i.tsrange = "tsrange", i.tstzrange = "tstzrange";
})(E || (E = {}));
const Ut = (i, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((n, o) => (n[o] = kr(o, i, e, r), n), {});
}, kr = (i, e, t, s) => {
  const r = e.find((a) => a.name === i), n = r == null ? void 0 : r.type, o = t[i];
  return n && !s.includes(n) ? gs(n, o) : Ye(o);
}, gs = (i, e) => {
  if (i.charAt(0) === "_") {
    const t = i.slice(1, i.length);
    return Tr(e, t);
  }
  switch (i) {
    case E.bool:
      return Er(e);
    case E.float4:
    case E.float8:
    case E.int2:
    case E.int4:
    case E.int8:
    case E.numeric:
    case E.oid:
      return Cr(e);
    case E.json:
    case E.jsonb:
      return Ir(e);
    case E.timestamp:
      return xr(e);
    case E.abstime:
    case E.date:
    case E.daterange:
    case E.int4range:
    case E.int8range:
    case E.money:
    case E.reltime:
    case E.text:
    case E.time:
    case E.timestamptz:
    case E.timetz:
    case E.tsrange:
    case E.tstzrange:
      return Ye(e);
    default:
      return Ye(e);
  }
}, Ye = (i) => i, Er = (i) => {
  switch (i) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return i;
  }
}, Cr = (i) => {
  if (typeof i == "string") {
    const e = parseFloat(i);
    if (!Number.isNaN(e))
      return e;
  }
  return i;
}, Ir = (i) => {
  if (typeof i == "string")
    try {
      return JSON.parse(i);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), i;
    }
  return i;
}, Tr = (i, e) => {
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
    return n.map((a) => gs(e, a));
  }
  return i;
}, xr = (i) => typeof i == "string" ? i.replace(" ", "T") : i, ms = (i) => {
  let e = i;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class qe {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = fs) {
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
var Nt;
(function(i) {
  i.SYNC = "sync", i.JOIN = "join", i.LEAVE = "leave";
})(Nt || (Nt = {}));
class ve {
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
      this.joinRef = this.channel._joinRef(), this.state = ve.syncState(this.state, r, n, o), this.pendingDiffs.forEach((l) => {
        this.state = ve.syncDiff(this.state, l, n, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = ve.syncDiff(this.state, r, n, o), a());
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
    return this.map(n, (u, c) => {
      o[u] || (l[u] = c);
    }), this.map(o, (u, c) => {
      const h = n[u];
      if (h) {
        const d = c.map((g) => g.presence_ref), f = h.map((g) => g.presence_ref), p = c.filter((g) => f.indexOf(g.presence_ref) < 0), y = h.filter((g) => d.indexOf(g.presence_ref) < 0);
        p.length > 0 && (a[u] = p), y.length > 0 && (l[u] = y);
      } else
        a[u] = c;
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
      var u;
      const c = (u = e[a]) !== null && u !== void 0 ? u : [];
      if (e[a] = this.cloneDeep(l), c.length > 0) {
        const h = e[a].map((f) => f.presence_ref), d = c.filter((f) => h.indexOf(f.presence_ref) < 0);
        e[a].unshift(...d);
      }
      s(a, c, l);
    }), this.map(o, (a, l) => {
      let u = e[a];
      if (!u)
        return;
      const c = l.map((h) => h.presence_ref);
      u = u.filter((h) => c.indexOf(h.presence_ref) < 0), e[a] = u, r(a, u, l), u.length === 0 && delete e[a];
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
var Ft;
(function(i) {
  i.ALL = "*", i.INSERT = "INSERT", i.UPDATE = "UPDATE", i.DELETE = "DELETE";
})(Ft || (Ft = {}));
var Bt;
(function(i) {
  i.BROADCAST = "broadcast", i.PRESENCE = "presence", i.POSTGRES_CHANGES = "postgres_changes", i.SYSTEM = "system";
})(Bt || (Bt = {}));
var B;
(function(i) {
  i.SUBSCRIBED = "SUBSCRIBED", i.TIMED_OUT = "TIMED_OUT", i.CLOSED = "CLOSED", i.CHANNEL_ERROR = "CHANNEL_ERROR";
})(B || (B = {}));
class pt {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = j.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new qe(this, U.join, this.params, this.timeout), this.rejoinTimer = new ps(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = j.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = j.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(U.reply, {}, (r, n) => {
      this._trigger(this._replyEventName(n), r);
    }), this.presence = new ve(this), this.broadcastEndpointURL = ms(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == j.closed) {
      const { config: { broadcast: n, presence: o, private: a } } = this.params;
      this._onError((c) => e == null ? void 0 : e(B.CHANNEL_ERROR, c)), this._onClose(() => e == null ? void 0 : e(B.CLOSED));
      const l = {}, u = {
        broadcast: n,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((c) => c.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: u }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: c }) => {
        var h;
        if (this.socket.setAuth(), c === void 0) {
          e == null || e(B.SUBSCRIBED);
          return;
        } else {
          const d = this.bindings.postgres_changes, f = (h = d == null ? void 0 : d.length) !== null && h !== void 0 ? h : 0, p = [];
          for (let y = 0; y < f; y++) {
            const g = d[y], { filter: { event: w, schema: k, table: m, filter: b } } = g, x = c && c[y];
            if (x && x.event === w && x.schema === k && x.table === m && x.filter === b)
              p.push(Object.assign(Object.assign({}, g), { id: x.id }));
            else {
              this.unsubscribe(), this.state = j.errored, e == null || e(B.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(B.SUBSCRIBED);
          return;
        }
      }).receive("error", (c) => {
        this.state = j.errored, e == null || e(B.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(c).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(B.TIMED_OUT);
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
        const u = await this._fetchWithTimeout(this.broadcastEndpointURL, l, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((r = u.body) === null || r === void 0 ? void 0 : r.cancel()), u.ok ? "ok" : "error";
      } catch (u) {
        return u.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((n) => {
        var o, a, l;
        const u = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((l = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || l === void 0) && l.ack) && n("ok"), u.receive("ok", () => n("ok")), u.receive("error", () => n("error")), u.receive("timeout", () => n("timed out"));
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
    this.state = j.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(U.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let s = null;
    return new Promise((r) => {
      s = new qe(this, U.leave, {}, e), s.receive("ok", () => {
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
    let r = new qe(this, e, t, s);
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
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: u, join: c } = U;
    if (s && [a, l, u, c].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let d = this._onMessage(o, t, s);
    if (t && !d)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var p, y, g;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((g = (y = f.filter) === null || y === void 0 ? void 0 : y.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(d, s)) : (n = this.bindings[o]) === null || n === void 0 || n.filter((f) => {
      var p, y, g, w, k, m;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const b = f.id, x = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return b && ((y = t.ids) === null || y === void 0 ? void 0 : y.includes(b)) && (x === "*" || (x == null ? void 0 : x.toLocaleLowerCase()) === ((g = t.data) === null || g === void 0 ? void 0 : g.type.toLocaleLowerCase()));
        } else {
          const b = (k = (w = f == null ? void 0 : f.filter) === null || w === void 0 ? void 0 : w.event) === null || k === void 0 ? void 0 : k.toLocaleLowerCase();
          return b === "*" || b === ((m = t == null ? void 0 : t.event) === null || m === void 0 ? void 0 : m.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof d == "object" && "ids" in d) {
        const p = d.data, { schema: y, table: g, commit_timestamp: w, type: k, errors: m } = p;
        d = Object.assign(Object.assign({}, {
          schema: y,
          table: g,
          commit_timestamp: w,
          eventType: k,
          new: {},
          old: {},
          errors: m
        }), this._getPayloadRecords(p));
      }
      f.callback(d, s);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === j.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === j.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === j.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === j.leaving;
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
      return !(((n = r.type) === null || n === void 0 ? void 0 : n.toLocaleLowerCase()) === s && pt.isEqual(r.filter, t));
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
    this._on(U.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(U.error, {}, (t) => e(t));
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
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = j.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Ut(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Ut(e.columns, e.old_record)), t;
  }
}
const Mt = () => {
}, Pr = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Ar {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = fs, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Mt, this.ref = 0, this.logger = Mt, this.conn = null, this.sendBuffer = [], this.serializer = new Sr(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (n) => {
      let o;
      return n ? o = n : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => de).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${Xe.websocket}`, this.httpEndpoint = ms(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (n) => [1e3, 2e3, 5e3, 1e4][n - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (n, o) => o(JSON.stringify(n)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new ps(async () => {
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
      if (this.transport || (this.transport = vr), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: _r }));
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
      case me.connecting:
        return Q.Connecting;
      case me.open:
        return Q.Open;
      case me.closing:
        return Q.Closing;
      default:
        return Q.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === Q.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((n) => n.topic === s);
    if (r)
      return r;
    {
      const n = new pt(`realtime:${e}`, t, this);
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
        version: br
      };
      t && s.updateJoinPayload(r), s.joinedOnce && s._isJoined() && s._push(U.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(wr, "hearbeat timeout");
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
    this.channels.forEach((e) => e._trigger(U.error));
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
      const s = new Blob([Pr], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class gt extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function A(i) {
  return typeof i == "object" && i !== null && "__isStorageError" in i;
}
class Or extends gt {
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
class Ze extends gt {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var jr = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
const vs = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => de).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, $r = () => jr(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => de)).Response : Response;
}), et = (i) => {
  if (Array.isArray(i))
    return i.map((t) => et(t));
  if (typeof i == "function" || i !== Object(i))
    return i;
  const e = {};
  return Object.entries(i).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (n) => n.toUpperCase().replace(/[-_]/g, ""));
    e[r] = et(s);
  }), e;
}, Rr = (i) => {
  if (typeof i != "object" || i === null)
    return !1;
  const e = Object.getPrototypeOf(i);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in i) && !(Symbol.iterator in i);
};
var ee = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
const ze = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), Lr = (i, e, t) => ee(void 0, void 0, void 0, function* () {
  const s = yield $r();
  i instanceof s && !(t != null && t.noResolveJson) ? i.json().then((r) => {
    const n = i.status || 500, o = (r == null ? void 0 : r.statusCode) || n + "";
    e(new Or(ze(r), n, o));
  }).catch((r) => {
    e(new Ze(ze(r), r));
  }) : e(new Ze(ze(i), i));
}), Dr = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" || !s ? r : (Rr(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function Ee(i, e, t, s, r, n) {
  return ee(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      i(t, Dr(e, s, r, n)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => Lr(l, a, s));
    });
  });
}
function Pe(i, e, t, s) {
  return ee(this, void 0, void 0, function* () {
    return Ee(i, "GET", e, t, s);
  });
}
function M(i, e, t, s, r) {
  return ee(this, void 0, void 0, function* () {
    return Ee(i, "POST", e, s, r, t);
  });
}
function tt(i, e, t, s, r) {
  return ee(this, void 0, void 0, function* () {
    return Ee(i, "PUT", e, s, r, t);
  });
}
function Ur(i, e, t, s) {
  return ee(this, void 0, void 0, function* () {
    return Ee(i, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function ys(i, e, t, s, r) {
  return ee(this, void 0, void 0, function* () {
    return Ee(i, "DELETE", e, s, r, t);
  });
}
var $ = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
const Nr = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, qt = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class Fr {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = vs(r);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, r) {
    return $(this, void 0, void 0, function* () {
      try {
        let n;
        const o = Object.assign(Object.assign({}, qt), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (n = new FormData(), n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l)), n.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (n = s, n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l))) : (n = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const u = this._removeEmptyFolders(t), c = this._getFinalPath(u), h = yield (e == "PUT" ? tt : M)(this.fetch, `${this.url}/object/${c}`, n, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: u, id: h.Id, fullPath: h.Key },
          error: null
        };
      } catch (n) {
        if (A(n))
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
    return $(this, void 0, void 0, function* () {
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
    return $(this, void 0, void 0, function* () {
      const n = this._removeEmptyFolders(e), o = this._getFinalPath(n), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const u = Object.assign({ upsert: qt.upsert }, r), c = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(u.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", u.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", u.cacheControl)) : (l = s, c["cache-control"] = `max-age=${u.cacheControl}`, c["content-type"] = u.contentType);
        const h = yield tt(this.fetch, a.toString(), l, { headers: c });
        return {
          data: { path: n, fullPath: h.Key },
          error: null
        };
      } catch (l) {
        if (A(l))
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
    return $(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const r = Object.assign({}, this.headers);
        t != null && t.upsert && (r["x-upsert"] = "true");
        const n = yield M(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + n.url), a = o.searchParams.get("token");
        if (!a)
          throw new gt("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (s) {
        if (A(s))
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
    return $(this, void 0, void 0, function* () {
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
    return $(this, void 0, void 0, function* () {
      try {
        return { data: yield M(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (A(r))
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
    return $(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield M(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (r) {
        if (A(r))
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
    return $(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e), n = yield M(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return n = { signedUrl: encodeURI(`${this.url}${n.signedURL}${o}`) }, { data: n, error: null };
      } catch (r) {
        if (A(r))
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
    return $(this, void 0, void 0, function* () {
      try {
        const r = yield M(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), n = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: r.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${n}`) : null })),
          error: null
        };
      } catch (r) {
        if (A(r))
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
    return $(this, void 0, void 0, function* () {
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = n ? `?${n}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield Pe(this.fetch, `${this.url}/${r}/${a}${o}`, {
          headers: this.headers,
          noResolveJson: !0
        })).blob(), error: null };
      } catch (a) {
        if (A(a))
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
    return $(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield Pe(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: et(s), error: null };
      } catch (s) {
        if (A(s))
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
    return $(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield Ur(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (A(s) && s instanceof Ze) {
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
    let u = r.join("&");
    return u !== "" && (u = `?${u}`), {
      data: { publicUrl: encodeURI(`${this.url}/${a}/public/${s}${u}`) }
    };
  }
  /**
   * Deletes files within the same bucket
   *
   * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
   */
  remove(e) {
    return $(this, void 0, void 0, function* () {
      try {
        return { data: yield ys(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
      } catch (t) {
        if (A(t))
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
    return $(this, void 0, void 0, function* () {
      try {
        const r = Object.assign(Object.assign(Object.assign({}, Nr), t), { prefix: e || "" });
        return { data: yield M(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
      } catch (r) {
        if (A(r))
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
const Br = "2.10.4", Mr = { "X-Client-Info": `storage-js/${Br}` };
var re = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
class qr {
  constructor(e, t = {}, s, r) {
    const n = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase.")), this.url = n.href, this.headers = Object.assign(Object.assign({}, Mr), t), this.fetch = vs(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield Pe(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
      } catch (e) {
        if (A(e))
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
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield Pe(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
      } catch (t) {
        if (A(t))
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
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield M(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          type: t.type,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (A(s))
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
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield tt(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (A(s))
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
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield M(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (A(t))
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
    return re(this, void 0, void 0, function* () {
      try {
        return { data: yield ys(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (A(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class zr extends qr {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new Fr(this.url, this.headers, e, this.fetch);
  }
}
const Hr = "2.53.0";
let ge = "";
typeof Deno < "u" ? ge = "deno" : typeof document < "u" ? ge = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? ge = "react-native" : ge = "node";
const Vr = { "X-Client-Info": `supabase-js-${ge}/${Hr}` }, Wr = {
  headers: Vr
}, Kr = {
  schema: "public"
}, Jr = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, Gr = {};
var Qr = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
const Xr = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = ss : e = fetch, (...t) => e(...t);
}, Yr = () => typeof Headers > "u" ? rs : Headers, Zr = (i, e, t) => {
  const s = Xr(t), r = Yr();
  return (n, o) => Qr(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : i;
    let u = new r(o == null ? void 0 : o.headers);
    return u.has("apikey") || u.set("apikey", i), u.has("Authorization") || u.set("Authorization", `Bearer ${l}`), s(n, Object.assign(Object.assign({}, o), { headers: u }));
  });
};
var en = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
function tn(i) {
  return i.endsWith("/") ? i : i + "/";
}
function sn(i, e) {
  var t, s;
  const { db: r, auth: n, realtime: o, global: a } = i, { db: l, auth: u, realtime: c, global: h } = e, d = {
    db: Object.assign(Object.assign({}, l), r),
    auth: Object.assign(Object.assign({}, u), n),
    realtime: Object.assign(Object.assign({}, c), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, h), a), { headers: Object.assign(Object.assign({}, (t = h == null ? void 0 : h.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => en(this, void 0, void 0, function* () {
      return "";
    })
  };
  return i.accessToken ? d.accessToken = i.accessToken : delete d.accessToken, d;
}
const bs = "2.71.1", le = 30 * 1e3, st = 3, He = st * le, rn = "http://localhost:9999", nn = "supabase.auth.token", on = { "X-Client-Info": `gotrue-js/${bs}` }, rt = "X-Supabase-Api-Version", _s = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, an = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, ln = 10 * 60 * 1e3;
class mt extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function _(i) {
  return typeof i == "object" && i !== null && "__isAuthError" in i;
}
class cn extends mt {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function un(i) {
  return _(i) && i.name === "AuthApiError";
}
class ws extends mt {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class W extends mt {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class H extends W {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function hn(i) {
  return _(i) && i.name === "AuthSessionMissingError";
}
class Ie extends W {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Te extends W {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class xe extends W {
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
function dn(i) {
  return _(i) && i.name === "AuthImplicitGrantRedirectError";
}
class zt extends W {
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
class nt extends W {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function Ve(i) {
  return _(i) && i.name === "AuthRetryableFetchError";
}
class Ht extends W {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class it extends W {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Ae = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Vt = ` 	
\r=`.split(""), fn = (() => {
  const i = new Array(128);
  for (let e = 0; e < i.length; e += 1)
    i[e] = -1;
  for (let e = 0; e < Vt.length; e += 1)
    i[Vt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Ae.length; e += 1)
    i[Ae[e].charCodeAt(0)] = e;
  return i;
})();
function Wt(i, e, t) {
  if (i !== null)
    for (e.queue = e.queue << 8 | i, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Ae[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Ae[s]), e.queuedBits -= 6;
    }
}
function Ss(i, e, t) {
  const s = fn[i];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(i)}"`);
  }
}
function Kt(i) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, n = (o) => {
    mn(o, s, t);
  };
  for (let o = 0; o < i.length; o += 1)
    Ss(i.charCodeAt(o), r, n);
  return e.join("");
}
function pn(i, e) {
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
function gn(i, e) {
  for (let t = 0; t < i.length; t += 1) {
    let s = i.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (i.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    pn(s, e);
  }
}
function mn(i, e, t) {
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
function vn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < i.length; r += 1)
    Ss(i.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function yn(i) {
  const e = [];
  return gn(i, (t) => e.push(t)), new Uint8Array(e);
}
function bn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return i.forEach((r) => Wt(r, t, s)), Wt(null, t, s), e.join("");
}
function _n(i) {
  return Math.round(Date.now() / 1e3) + i;
}
function wn() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(i) {
    const e = Math.random() * 16 | 0;
    return (i == "x" ? e : e & 3 | 8).toString(16);
  });
}
const D = () => typeof window < "u" && typeof document < "u", K = {
  tested: !1,
  writable: !1
}, ks = () => {
  if (!D())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (K.tested)
    return K.writable;
  const i = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(i, i), globalThis.localStorage.removeItem(i), K.tested = !0, K.writable = !0;
  } catch {
    K.tested = !0, K.writable = !1;
  }
  return K.writable;
};
function Sn(i) {
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
const Es = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => de).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, kn = (i) => typeof i == "object" && i !== null && "status" in i && "ok" in i && "json" in i && typeof i.json == "function", ce = async (i, e, t) => {
  await i.setItem(e, JSON.stringify(t));
}, J = async (i, e) => {
  const t = await i.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, z = async (i, e) => {
  await i.removeItem(e);
};
class Fe {
  constructor() {
    this.promise = new Fe.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
Fe.promiseConstructor = Promise;
function We(i) {
  const e = i.split(".");
  if (e.length !== 3)
    throw new it("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!an.test(e[s]))
      throw new it("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(Kt(e[0])),
    payload: JSON.parse(Kt(e[1])),
    signature: vn(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function En(i) {
  return await new Promise((e) => {
    setTimeout(() => e(null), i);
  });
}
function Cn(i, e) {
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
function In(i) {
  return ("0" + i.toString(16)).substr(-2);
}
function Tn() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let n = 0; n < 56; n++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, In).join("");
}
async function xn(i) {
  const t = new TextEncoder().encode(i), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((n) => String.fromCharCode(n)).join("");
}
async function Pn(i) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), i;
  const t = await xn(i);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ne(i, e, t = !1) {
  const s = Tn();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await ce(i, `${e}-code-verifier`, r);
  const n = await Pn(s);
  return [n, s === n ? "plain" : "s256"];
}
const An = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function On(i) {
  const e = i.headers.get(rt);
  if (!e || !e.match(An))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function jn(i) {
  if (!i)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (i <= e)
    throw new Error("JWT has expired");
}
function $n(i) {
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
const Rn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function ie(i) {
  if (!Rn.test(i))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function Ke() {
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
function Jt(i) {
  return JSON.parse(JSON.stringify(i));
}
var Ln = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
const G = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), Dn = [502, 503, 504];
async function Gt(i) {
  var e;
  if (!kn(i))
    throw new nt(G(i), 0);
  if (Dn.includes(i.status))
    throw new nt(G(i), i.status);
  let t;
  try {
    t = await i.json();
  } catch (n) {
    throw new ws(G(n), n);
  }
  let s;
  const r = On(i);
  if (r && r.getTime() >= _s["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new Ht(G(t), i.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new H();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n, o) => n && typeof o == "string", !0))
    throw new Ht(G(t), i.status, t.weak_password.reasons);
  throw new cn(G(t), i.status || 500, s);
}
const Un = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function S(i, e, t, s) {
  var r;
  const n = Object.assign({}, s == null ? void 0 : s.headers);
  n[rt] || (n[rt] = _s["2024-01-01"].name), s != null && s.jwt && (n.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await Nn(i, e, t + a, {
    headers: n,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function Nn(i, e, t, s, r, n) {
  const o = Un(e, s, r, n);
  let a;
  try {
    a = await i(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new nt(G(l), 0);
  }
  if (a.ok || await Gt(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await Gt(l);
  }
}
function N(i) {
  var e;
  let t = null;
  qn(i) && (t = Object.assign({}, i), i.expires_at || (t.expires_at = _n(i.expires_in)));
  const s = (e = i.user) !== null && e !== void 0 ? e : i;
  return { data: { session: t, user: s }, error: null };
}
function Qt(i) {
  const e = N(i);
  return !e.error && i.weak_password && typeof i.weak_password == "object" && Array.isArray(i.weak_password.reasons) && i.weak_password.reasons.length && i.weak_password.message && typeof i.weak_password.message == "string" && i.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = i.weak_password), e;
}
function V(i) {
  var e;
  return { data: { user: (e = i.user) !== null && e !== void 0 ? e : i }, error: null };
}
function Fn(i) {
  return { data: i, error: null };
}
function Bn(i) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: n } = i, o = Ln(i, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
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
function Mn(i) {
  return i;
}
function qn(i) {
  return i.access_token && i.refresh_token && i.expires_in;
}
const Je = ["global", "local", "others"];
var zn = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
class Hn {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = Es(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = Je[0]) {
    if (Je.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Je.join(", ")}`);
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
        xform: V
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
      const { options: t } = e, s = zn(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: Bn,
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
        xform: V
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
      const u = { nextPage: null, lastPage: 0, total: 0 }, c = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (n = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && n !== void 0 ? n : ""
        },
        xform: Mn
      });
      if (c.error)
        throw c.error;
      const h = await c.json(), d = (o = c.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = c.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((p) => {
        const y = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        u[`${g}Page`] = y;
      }), u.total = parseInt(d)), { data: Object.assign(Object.assign({}, h), u), error: null };
    } catch (u) {
      if (_(u))
        return { data: { users: [] }, error: u };
      throw u;
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
    ie(e);
    try {
      return await S(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: V
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
    ie(e);
    try {
      return await S(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: V
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
    ie(e);
    try {
      return await S(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: V
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    ie(e.userId);
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
    ie(e.userId), ie(e.id);
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
function Xt(i = {}) {
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
function Vn() {
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
const oe = {
  /**
   * @experimental
   */
  debug: !!(globalThis && ks() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Cs extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class Wn extends Cs {
}
async function Kn(i, e, t) {
  oe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", i, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), oe.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", i);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(i, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      oe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", i, r.name);
      try {
        return await t();
      } finally {
        oe.debug && console.log("@supabase/gotrue-js: navigatorLock: released", i, r.name);
      }
    } else {
      if (e === 0)
        throw oe.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", i), new Wn(`Acquiring an exclusive Navigator LockManager lock "${i}" immediately failed`);
      if (oe.debug)
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
Vn();
const Jn = {
  url: rn,
  storageKey: nn,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: on,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function Yt(i, e, t) {
  return await t();
}
const ae = {};
class we {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = we.nextInstanceID, we.nextInstanceID += 1, this.instanceID > 0 && D() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, Jn), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new Hn({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = Es(r.fetch), this.lock = r.lock || Yt, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : D() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = Kn : this.lock = Yt, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : ks() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = Xt(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = Xt(this.memoryStorage)), D() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
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
    return (t = (e = ae[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    ae[this.storageKey] = Object.assign(Object.assign({}, ae[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = ae[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    ae[this.storageKey] = Object.assign(Object.assign({}, ae[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${bs}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = Sn(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), D() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: n } = await this._getSessionFromURL(t, s);
        if (n) {
          if (this._debug("#_initialize()", "error detecting session from URL", n), dn(n)) {
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
        error: new ws("Unexpected error during initialization", t)
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
        xform: N
      }), { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, u = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: u, session: l }, error: null };
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
        const { email: c, password: h, options: d } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await ne(this.storage, this.storageKey)), n = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: d == null ? void 0 : d.emailRedirectTo,
          body: {
            email: c,
            password: h,
            data: (t = d == null ? void 0 : d.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken },
            code_challenge: f,
            code_challenge_method: p
          },
          xform: N
        });
      } else if ("phone" in e) {
        const { phone: c, password: h, options: d } = e;
        n = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: c,
            password: h,
            data: (s = d == null ? void 0 : d.data) !== null && s !== void 0 ? s : {},
            channel: (r = d == null ? void 0 : d.channel) !== null && r !== void 0 ? r : "sms",
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken }
          },
          xform: N
        });
      } else
        throw new Te("You must provide either an email or phone number and a password");
      const { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, u = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: u, session: l }, error: null };
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
          xform: Qt
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
          xform: Qt
        });
      } else
        throw new Te("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new Ie() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
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
    var t, s, r, n, o, a, l, u, c, h, d, f;
    let p, y;
    if ("message" in e)
      p = e.message, y = e.signature;
    else {
      const { chain: g, wallet: w, statement: k, options: m } = e;
      let b;
      if (D())
        if (typeof w == "object")
          b = w;
        else {
          const C = window;
          if ("solana" in C && typeof C.solana == "object" && ("signIn" in C.solana && typeof C.solana.signIn == "function" || "signMessage" in C.solana && typeof C.solana.signMessage == "function"))
            b = C.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof w != "object" || !(m != null && m.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        b = w;
      }
      const x = new URL((t = m == null ? void 0 : m.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in b && b.signIn) {
        const C = await b.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, m == null ? void 0 : m.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: x.host,
          uri: x.href
        }), k ? { statement: k } : null));
        let O;
        if (Array.isArray(C) && C[0] && typeof C[0] == "object")
          O = C[0];
        else if (C && typeof C == "object" && "signedMessage" in C && "signature" in C)
          O = C;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in O && "signature" in O && (typeof O.signedMessage == "string" || O.signedMessage instanceof Uint8Array) && O.signature instanceof Uint8Array)
          p = typeof O.signedMessage == "string" ? O.signedMessage : new TextDecoder().decode(O.signedMessage), y = O.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in b) || typeof b.signMessage != "function" || !("publicKey" in b) || typeof b != "object" || !b.publicKey || !("toBase58" in b.publicKey) || typeof b.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${x.host} wants you to sign in with your Solana account:`,
          b.publicKey.toBase58(),
          ...k ? ["", k, ""] : [""],
          "Version: 1",
          `URI: ${x.href}`,
          `Issued At: ${(r = (s = m == null ? void 0 : m.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n = m == null ? void 0 : m.signInWithSolana) === null || n === void 0) && n.notBefore ? [`Not Before: ${m.signInWithSolana.notBefore}`] : [],
          ...!((o = m == null ? void 0 : m.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${m.signInWithSolana.expirationTime}`] : [],
          ...!((a = m == null ? void 0 : m.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${m.signInWithSolana.chainId}`] : [],
          ...!((l = m == null ? void 0 : m.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${m.signInWithSolana.nonce}`] : [],
          ...!((u = m == null ? void 0 : m.signInWithSolana) === null || u === void 0) && u.requestId ? [`Request ID: ${m.signInWithSolana.requestId}`] : [],
          ...!((h = (c = m == null ? void 0 : m.signInWithSolana) === null || c === void 0 ? void 0 : c.resources) === null || h === void 0) && h.length ? [
            "Resources",
            ...m.signInWithSolana.resources.map((O) => `- ${O}`)
          ] : []
        ].join(`
`);
        const C = await b.signMessage(new TextEncoder().encode(p), "utf8");
        if (!C || !(C instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        y = C;
      }
    }
    try {
      const { data: g, error: w } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: bn(y) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: N
      });
      if (w)
        throw w;
      return !g || !g.session || !g.user ? {
        data: { user: null, session: null },
        error: new Ie()
      } : (g.session && (await this._saveSession(g.session), await this._notifyAllSubscribers("SIGNED_IN", g.session)), { data: Object.assign({}, g), error: w });
    } catch (g) {
      if (_(g))
        return { data: { user: null, session: null }, error: g };
      throw g;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await J(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: n, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: N
      });
      if (await z(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !n || !n.session || !n.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new Ie()
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
        xform: N
      }), { data: l, error: u } = a;
      return u ? { data: { user: null, session: null }, error: u } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new Ie()
      } : (l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), { data: l, error: u });
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
        let u = null, c = null;
        this.flowType === "pkce" && ([u, c] = await ne(this.storage, this.storageKey));
        const { error: h } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = l == null ? void 0 : l.data) !== null && t !== void 0 ? t : {},
            create_user: (s = l == null ? void 0 : l.shouldCreateUser) !== null && s !== void 0 ? s : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            code_challenge: u,
            code_challenge_method: c
          },
          redirectTo: l == null ? void 0 : l.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: h };
      }
      if ("phone" in e) {
        const { phone: a, options: l } = e, { data: u, error: c } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (r = l == null ? void 0 : l.data) !== null && r !== void 0 ? r : {},
            create_user: (n = l == null ? void 0 : l.shouldCreateUser) !== null && n !== void 0 ? n : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            channel: (o = l == null ? void 0 : l.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: u == null ? void 0 : u.message_id }, error: c };
      }
      throw new Te("You must provide either an email or phone number.");
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
        xform: N
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const l = o.session, u = o.user;
      return l != null && l.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), { data: { user: u, session: l }, error: null };
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
      return this.flowType === "pkce" && ([n, o] = await ne(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: n, code_challenge_method: o }),
        headers: this.headers,
        xform: Fn
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
          throw new H();
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
      throw new Te("You must provide either an email or phone number and a type");
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
      const t = await J(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < He : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await J(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = Ke();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (l, u, c) => (!o && u === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(l, u, c))
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
        xform: V
      }) : await this._useSession(async (t) => {
        var s, r, n;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new H() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0,
          xform: V
        });
      });
    } catch (t) {
      if (_(t))
        return hn(t) && (await this._removeSession(), await z(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
          throw new H();
        const o = r.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await ne(this.storage, this.storageKey));
        const { data: u, error: c } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: V
        });
        if (c)
          throw c;
        return o.user = u.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
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
        throw new H();
      const t = Date.now() / 1e3;
      let s = t, r = !0, n = null;
      const { payload: o } = We(e.access_token);
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
          throw new H();
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
      if (!D())
        throw new xe("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new xe(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new zt("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new xe("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new zt("No code detected.");
        const { data: k, error: m } = await this._exchangeCodeForSession(e.code);
        if (m)
          throw m;
        const b = new URL(window.location.href);
        return b.searchParams.delete("code"), window.history.replaceState(window.history.state, "", b.toString()), { data: { session: k.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: n, refresh_token: o, expires_in: a, expires_at: l, token_type: u } = e;
      if (!n || !a || !o || !u)
        throw new xe("No session defined in URL");
      const c = Math.round(Date.now() / 1e3), h = parseInt(a);
      let d = c + h;
      l && (d = parseInt(l));
      const f = d - c;
      f * 1e3 <= le && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${h}s`);
      const p = d - h;
      c - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, d, c) : c - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, d, c);
      const { data: y, error: g } = await this._getUser(n);
      if (g)
        throw g;
      const w = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: n,
        expires_in: h,
        expires_at: d,
        refresh_token: o,
        token_type: u,
        user: y.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: w, redirectType: e.type }, error: null };
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
    const t = await J(this.storage, `${this.storageKey}-code-verifier`);
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
        if (a && !(un(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await z(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = wn(), s = {
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
    this.flowType === "pkce" && ([s, r] = await ne(
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
        var o, a, l, u, c;
        const { data: h, error: d } = n;
        if (d)
          throw d;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (l = e.options) === null || l === void 0 ? void 0 : l.queryParams,
          skipBrowserRedirect: !0
        });
        return await S(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (c = (u = h.session) === null || u === void 0 ? void 0 : u.access_token) !== null && c !== void 0 ? c : void 0
        });
      });
      if (r)
        throw r;
      return D() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
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
      return await Cn(async (r) => (r > 0 && await En(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: N
      })), (r, n) => {
        const o = 200 * Math.pow(2, r);
        return n && Ve(n) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < le;
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), D() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
      const r = await J(this.storage, this.storageKey);
      if (r && this.userStorage) {
        let o = await J(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await ce(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : Ke();
      } else if (r && !r.user && !r.user) {
        const o = await J(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await z(this.storage, this.storageKey + "-user"), await ce(this.storage, this.storageKey, r)) : r.user = Ke();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const n = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < He;
      if (this._debug(s, `session has${n ? "" : " not"} expired with margin of ${He}s`), n) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), Ve(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
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
      throw new H();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new Fe();
      const { data: n, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!n.session)
        throw new H();
      await this._saveSession(n.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", n.session);
      const a = { session: n.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (n) {
      if (this._debug(r, "error", n), _(n)) {
        const o = { session: null, error: n };
        return Ve(n) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
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
      !s && t.user && await ce(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const n = Jt(r);
      await ce(this.storage, this.storageKey, n);
    } else {
      const r = Jt(t);
      await ce(this.storage, this.storageKey, r);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await z(this.storage, this.storageKey), await z(this.storage, this.storageKey + "-code-verifier"), await z(this.storage, this.storageKey + "-user"), this.userStorage && await z(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && D() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), le);
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
              const r = Math.floor((s.expires_at * 1e3 - e) / le);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${le}ms, refresh threshold is ${st} ticks`), r <= st && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Cs)
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
    if (this._debug("#_handleVisibilityChange()"), !D() || !(window != null && window.addEventListener))
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
      const [n, o] = await ne(this.storage, this.storageKey), a = new URLSearchParams({
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
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: u } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return u ? { data: null, error: u } : (e.factorType === "totp" && (!((r = l == null ? void 0 : l.totp) === null || r === void 0) && r.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), { data: l, error: null });
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
      const { payload: o } = We(r.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let l = a;
      ((s = (t = r.user.factors) === null || t === void 0 ? void 0 : t.filter((h) => h.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (l = "aal2");
      const c = o.amr || [];
      return { data: { currentLevel: a, nextLevel: l, currentAuthenticationMethods: c }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((a) => a.kid === e);
    if (s)
      return s;
    const r = Date.now();
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + ln > r)
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
        const { data: f, error: p } = await this.getSession();
        if (p || !f.session)
          return { data: null, error: p };
        s = f.session.access_token;
      }
      const { header: r, payload: n, signature: o, raw: { header: a, payload: l } } = We(s);
      t != null && t.allowExpired || jn(n.exp);
      const u = !r.alg || r.alg.startsWith("HS") || !r.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(r.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!u) {
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
      const c = $n(r.alg), h = await crypto.subtle.importKey("jwk", u, c, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(c, h, o, yn(`${a}.${l}`)))
        throw new it("Invalid JWT signature");
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
we.nextInstanceID = 0;
const Gn = we;
class Qn extends Gn {
  constructor(e) {
    super(e);
  }
}
var Xn = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(c) {
      try {
        u(s.next(c));
      } catch (h) {
        o(h);
      }
    }
    function l(c) {
      try {
        u(s.throw(c));
      } catch (h) {
        o(h);
      }
    }
    function u(c) {
      c.done ? n(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(i, e || [])).next());
  });
};
class Yn {
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
    const a = tn(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const u = `sb-${l.hostname.split(".")[0]}-auth-token`, c = {
      db: Kr,
      realtime: Gr,
      auth: Object.assign(Object.assign({}, Jr), { storageKey: u }),
      global: Wr
    }, h = sn(s ?? {}, c);
    this.storageKey = (r = h.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (n = h.global.headers) !== null && n !== void 0 ? n : {}, h.accessToken ? (this.accessToken = h.accessToken, this.auth = new Proxy({}, {
      get: (d, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = h.auth) !== null && o !== void 0 ? o : {}, this.headers, h.global.fetch), this.fetch = Zr(t, this._getAccessToken.bind(this), h.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, h.realtime)), this.rest = new gr(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: h.db.schema,
      fetch: this.fetch
    }), this.storage = new zr(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), h.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new Hs(this.functionsUrl.href, {
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
    return Xn(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: n, flowType: o, lock: a, debug: l }, u, c) {
    const h = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Qn({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, h), u),
      storageKey: n,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: s,
      storage: r,
      flowType: o,
      lock: a,
      debug: l,
      fetch: c,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new Ar(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const Zn = (i, e, t) => new Yn(i, e, t);
function ei() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const i = process.version.match(/^v(\d+)\./);
  return i ? parseInt(i[1], 10) <= 18 : !1;
}
ei() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class vt {
  constructor(e, t) {
    v(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = Zn(s, r);
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
const Be = "assistantAnalyticsPayload", ti = "ei_enhanced_insights", ye = "ei_analytics", yt = "ei_insights", ot = "ei_analytics_consent", si = 3500, ri = 10, ni = 3, ii = 50, oi = 100, ai = 8, li = [
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
], ci = [
  "attribution_history",
  "touch_count",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_landing_page",
  "first_referrer",
  "first_date_visited",
  "enhanced_insights"
];
function Zt(i) {
  return typeof i.activeMs == "number" && i.activeMs > 0 ? i.activeMs : typeof i.leftAt == "number" && i.leftAt > i.enteredAt ? i.leftAt - i.enteredAt : 0;
}
let Z = {}, ue = null, Se = !0, es = !1, F;
const Is = [];
function Ts(i) {
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
function xs() {
  if (F !== void 0) return F;
  F = null;
  try {
    if (Z.cookieDomain)
      return F = Z.cookieDomain.replace(/^\./, ""), F;
    const i = window.location.hostname;
    if (!i || /^[\d.]+$/.test(i) || i === "localhost")
      return null;
    const e = i.split("."), t = "ei_domain_probe";
    for (let s = e.length - 2; s >= 0; s--) {
      const r = e.slice(s).join(".");
      if (document.cookie = `${t}=1; domain=.${r}; path=/; SameSite=Lax`, document.cookie.indexOf(`${t}=1`) !== -1)
        return document.cookie = `${t}=; domain=.${r}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`, F = r, F;
    }
  } catch {
  }
  return F;
}
function be(i, e) {
  try {
    const t = encodeURIComponent(JSON.stringify(e));
    if (t.length > si) return !1;
    const s = xs(), r = window.location.protocol === "https:" ? "; Secure" : "";
    return document.cookie = `${i}=${t}` + (s ? `; domain=.${s}` : "") + `; path=/; SameSite=Lax${r}`, !0;
  } catch {
    return !1;
  }
}
function at(i) {
  try {
    const e = xs();
    document.cookie = `${i}=` + (e ? `; domain=.${e}` : "") + "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
  }
}
function Ps(i) {
  const e = [];
  for (const t of Ts(i))
    try {
      const s = JSON.parse(t);
      s && typeof s == "object" && !Array.isArray(s) && e.push(s);
    } catch {
    }
  return e;
}
function As() {
  const i = {};
  for (const e of Ps(yt))
    for (const [t, s] of Object.entries(e)) {
      if (!s || typeof s != "object" || Array.isArray(s))
        continue;
      const r = i[t];
      r && String(s.last_visit_at ?? "") <= String(r.last_visit_at ?? "") || (i[t] = s);
    }
  return i;
}
function ui(i) {
  if (be(ye, i)) return;
  const e = Oe(i);
  for (let t = e.length - 1; t >= 2; t--) {
    const s = [e[0], ...e.slice(-(t - 1))];
    if (be(ye, ct(s)))
      return;
  }
  e.length > 1 && be(
    ye,
    ct([e[0], e[e.length - 1]])
  );
}
function hi() {
  at(ye);
}
function di() {
  const i = Ps(ye);
  if (i.length === 0) return null;
  const e = (r) => {
    const n = Oe(r), o = n[0], a = o && typeof o.date_visited == "string" ? o.date_visited : "";
    return { touches: n.length, at: a };
  };
  let t = i[0], s = e(t);
  for (const r of i.slice(1)) {
    const n = e(r);
    (n.touches > s.touches || n.touches === s.touches && !!n.at && (!s.at || n.at < s.at)) && (t = r, s = n);
  }
  return t;
}
function fi() {
  const i = Ls();
  if (!i) return null;
  const { visits: e, time_per_page: t, ...s } = i, r = {};
  return Object.entries(t ?? {}).sort((n, o) => o[1] - n[1]).slice(0, ri).forEach(([n, o]) => {
    r[n] = o;
  }), { ...s, time_per_page: r };
}
function pi() {
  try {
    if (typeof window > "u" || Z.shareInsightsAcrossSubdomains === !1 || !bt())
      return;
    const i = fi();
    if (!i) return;
    const e = window.location.hostname, t = As();
    let s = Object.entries(t).filter(([n, o]) => n !== e && o && typeof o == "object").sort(
      (n, o) => {
        var a, l;
        return String(((a = n[1]) == null ? void 0 : a.last_visit_at) ?? "").localeCompare(
          String(((l = o[1]) == null ? void 0 : l.last_visit_at) ?? "")
        );
      }
    );
    s = s.slice(
      Math.max(0, s.length - (ni - 1))
    );
    let r = i;
    for (; ; ) {
      const n = {};
      for (const [a, l] of s) n[a] = l;
      if (n[e] = r, be(yt, n)) return;
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
function gi() {
  if (typeof window > "u") return [];
  const i = As(), e = window.location.hostname;
  return Object.entries(i).filter(
    ([t, s]) => t !== e && s && typeof s == "object" && !Array.isArray(s)
  ).map(([, t]) => t);
}
function mi(i, e) {
  if (e.length === 0) return i;
  const t = i ? [i, ...e] : e, s = (h) => typeof h == "number" && isFinite(h) ? h : 0;
  let r = 0, n = 0;
  const o = [], a = {};
  let l = null, u = null;
  for (const h of t) {
    r += s(h.visit_count), n += s(h.total_time_seconds), typeof h.pages == "string" && h.pages.split(",").forEach((y) => {
      y && o.indexOf(y) === -1 && o.push(y);
    });
    const d = h.time_per_page;
    if (d && typeof d == "object" && !Array.isArray(d))
      for (const [y, g] of Object.entries(
        d
      ))
        a[y] = (a[y] ?? 0) + s(g);
    const f = typeof h.first_visit_at == "string" ? h.first_visit_at : null, p = typeof h.last_visit_at == "string" ? h.last_visit_at : null;
    f && (!l || f < l) && (l = f), p && (!u || p > u) && (u = p);
  }
  const c = {
    time_per_page: a,
    visit_count: r,
    unique_pages: o.length,
    total_time_seconds: n,
    pages: o.join(",")
  };
  return l && (c.first_visit_at = l), u && (c.last_visit_at = u), i && Array.isArray(i.visits) && (c.visits = i.visits), c;
}
function Os() {
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
function vi() {
  if (es || typeof window > "u") return;
  es = !0;
  const i = () => {
    const e = Os();
    e === !0 ? _e(!0) : e === !1 && _e(!1);
  };
  try {
    window.addEventListener("CookiebotOnConsentReady", i), window.addEventListener("CookiebotOnAccept", i), window.addEventListener("CookiebotOnDecline", i), window.addEventListener("OneTrustGroupsUpdated", i);
    const e = window.__tcfapi;
    typeof e == "function" && e("addEventListener", 2, (t, s) => {
      var r, n;
      !s || !t || (t.eventStatus === "tcloaded" || t.eventStatus === "useractioncomplete") && _e(!!((n = (r = t.purpose) == null ? void 0 : r.consents) != null && n[1]));
    });
  } catch {
  }
}
function bt() {
  return js() ? !1 : !Z.requireConsent || Se;
}
function js() {
  return Ts(ot).indexOf("0") !== -1;
}
function yi(i) {
  Is.push(i);
}
function _e(i) {
  const e = i !== Se;
  if (Se = i, i)
    at(ot), $s();
  else {
    be(ot, 0), hi(), at(yt);
    try {
      sessionStorage.removeItem(Be);
    } catch {
    }
  }
  if (e)
    for (const t of Is)
      try {
        t(i);
      } catch {
      }
}
function bi() {
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
function lt(i) {
  return li.filter((e) => i[e] !== void 0).map((e) => e + "=" + String(i[e])).join("&");
}
function Oe(i) {
  if (!i) return [];
  const e = i.attribution_history;
  if (Array.isArray(e))
    return e.filter(
      (s) => !!s && typeof s == "object" && !Array.isArray(s)
    );
  const t = {};
  for (const [s, r] of Object.entries(i))
    ci.indexOf(s) === -1 && (t[s] = r);
  return Object.keys(t).length > 0 ? [t] : [];
}
function _i(...i) {
  const e = /* @__PURE__ */ new Set(), t = [];
  for (const s of i)
    for (const r of s) {
      const n = String(r.date_visited ?? "") + "|" + lt(r);
      e.has(n) || (e.add(n), t.push(r));
    }
  return t.sort(
    (s, r) => String(s.date_visited ?? "").localeCompare(String(r.date_visited ?? ""))
  );
}
function wi(i) {
  return i.length <= ai ? i : [i[0], ...i.slice(-7)];
}
function Si(i, e) {
  if (i.length === 0) return [e];
  const t = lt(e);
  return !t || t === lt(i[i.length - 1]) ? i : wi([...i, e]);
}
function ct(i) {
  if (i.length === 0) return {};
  const e = i[0], s = { ...i[i.length - 1] }, r = (n, o) => {
    e[o] !== void 0 && (s[n] = e[o]);
  };
  return r("first_utm_source", "utm_source"), r("first_utm_medium", "utm_medium"), r("first_utm_campaign", "utm_campaign"), r("first_landing_page", "landing_page"), r("first_referrer", "referrer"), r("first_date_visited", "date_visited"), s.touch_count = i.length, s.attribution_history = i, s;
}
function $s() {
  if (!(typeof window > "u" || !ue) && !js())
    try {
      window.sessionStorage && sessionStorage.setItem(
        Be,
        JSON.stringify(ue)
      ), ui(ue);
    } catch {
    }
}
function ki(i) {
  if (!(typeof window > "u")) {
    Z = i ?? {}, F = void 0;
    try {
      const e = window.sessionStorage ? sessionStorage.getItem(Be) : null;
      let t = null;
      if (e) {
        const r = JSON.parse(e);
        r && typeof r == "object" && !Array.isArray(r) && (t = r);
      }
      const s = Si(
        _i(
          Oe(t),
          Oe(di())
        ),
        bi()
      );
      if (ue = ct(s), Z.requireConsent) {
        vi();
        const r = Os();
        r === null ? Se = !1 : _e(r);
      } else
        Se = !0, $s();
    } catch {
    }
  }
}
function Rs(i) {
  let e = i.trim();
  if (!e) return "";
  const t = e.search(/[?#]/);
  return t >= 0 && (e = e.slice(0, t)), e.startsWith("/") || (e = "/" + e), e.length > 1 && e.endsWith("/") && (e = e.slice(0, -1)), e;
}
function Ei(i) {
  return Rs(i).replace(/\./g, "_");
}
function Ls() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const i = window.localStorage.getItem(ti);
    if (!i) return null;
    const e = JSON.parse(i), t = Array.isArray(e == null ? void 0 : e.visits) ? e.visits.filter(
      (u) => u && typeof u.page == "string" && typeof u.enteredAt == "number"
    ) : [], s = t[0], r = t[t.length - 1];
    if (!s || !r) return null;
    const n = [];
    for (const u of t) {
      const c = Rs(u.page);
      c && n.indexOf(c) === -1 && n.push(c);
    }
    const o = t.reduce((u, c) => u + Zt(c), 0), a = {};
    for (const u of t) {
      const c = Ei(u.page);
      c && (a[c] = (a[c] ?? 0) + Zt(u));
    }
    const l = {};
    return Object.entries(a).slice(0, oi).forEach(([u, c]) => {
      l[u] = Math.round(c / 1e3);
    }), {
      time_per_page: l,
      visits: t.slice(-ii),
      visit_count: t.length,
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
function Ci() {
  try {
    if (!bt()) return null;
    let i = {};
    if (typeof window < "u" && window.sessionStorage) {
      const t = sessionStorage.getItem(Be);
      if (t) {
        const s = JSON.parse(t);
        s && typeof s == "object" && (i = s);
      }
    }
    Object.keys(i).length === 0 && ue && (i = { ...ue });
    let e = Ls();
    return Z.shareInsightsAcrossSubdomains !== !1 && (e = mi(
      e,
      gi()
    )), e && (i.enhanced_insights = e), Object.keys(i).length > 0 ? JSON.stringify(i) : null;
  } catch {
    return null;
  }
}
let ts = !1;
const je = class je {
  // Flag to prevent duplicate storage listeners
  constructor(e) {
    v(this, "options");
    v(this, "supabaseService");
    v(this, "inputDetector");
    v(this, "productDetector");
    v(this, "totalExtractor");
    v(this, "campaign");
    v(this, "totalAverage", 0);
    v(this, "_sessionId");
    v(this, "isInitialized", !1);
    v(this, "previousContent", {});
    v(this, "previousProducts", []);
    v(this, "previousTotal", 0);
    v(this, "debounceTimer");
    v(this, "pendingContentUpdate");
    v(this, "isSubmitting", !1);
    // Lock to prevent concurrent submissions
    v(this, "autofieldStorageListenersSetup", !1);
    v(this, "boundHandleAutofieldBlur", (e) => this.handleAutofieldBlur(e));
    this.options = e, this.supabaseService = new vt(
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
      return this.totalAverage = r != null && r.average_checkout_value ? r.average_checkout_value : 0, r ? (this.campaign = r, this.inputDetector = new Ge(r.input_mapping), r.type !== "bookvisit" && r.type !== "synxis" && r.type !== "elinapms" && (this.productDetector = new Fs(
        r.product_mapping
      ), this.totalExtractor = new Bs(
        r.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), r.type === "bookvisit" && ((s = (t = r.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0 && window.location.pathname === "/checkout" && !ts && (ts = !0, this.injectBookVisitAutofields(r.input_mapping)), this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch checkout campaign data"), !1);
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
    var s, r, n, o, a, l, u, c;
    if (this.isSubmitting) {
      this.pendingContentUpdate = { content: e, sessionId: t }, this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
        if (this.pendingContentUpdate) {
          const h = this.pendingContentUpdate;
          this.pendingContentUpdate = void 0, this.handleContentUpdate(
            h.content,
            h.sessionId
          );
        }
      }, 100);
      return;
    }
    this.isSubmitting = !0;
    try {
      let h = [], d = this.totalAverage;
      if (((s = this.campaign) == null ? void 0 : s.type) === "bookvisit") {
        const b = await this.withBasketTimeout(
          this.fetchBookVisitBasket()
        );
        b && (h = b.products, d = b.total);
      } else if (((r = this.campaign) == null ? void 0 : r.type) === "synxis") {
        const b = await this.withBasketTimeout(
          this.fetchSynxisBasket()
        );
        b && (h = b.products, d = b.total);
      } else if (((n = this.campaign) == null ? void 0 : n.type) === "elinapms") {
        const b = await this.fetchElinapmsBasket();
        b && (h = b.products, d = b.total);
      } else
        h = ((o = this.productDetector) == null ? void 0 : o.detectProducts()) || [], d = ((a = this.totalExtractor) == null ? void 0 : a.extractTotal()) || this.totalAverage;
      if (!this.hasContentChanged(
        e,
        h,
        d
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const p = typeof window < "u" ? window.location.href : "", y = this._sessionId || t, g = Ci(), w = { ...e }, k = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: w,
        products: h,
        url: p,
        total: d,
        id: y,
        ...g ? { analytics: g } : {},
        ...((l = this.campaign) == null ? void 0 : l.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {}
      }, m = await this.supabaseService.submitCartSession(k);
      m && m.id ? (this._sessionId = m.id, (c = this.inputDetector) == null || c.setSessionId(m.id), this.saveSessionIdToStorage(m.id), this.previousContent = w, this.previousProducts = [...h], this.previousTotal = d, console.log("Cart session updated successfully:", m.id)) : console.error("Failed to submit cart session");
    } catch (h) {
      console.error("Error handling content update:", h);
    } finally {
      this.isSubmitting = !1;
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
      }, je.BASKET_FETCH_TIMEOUT_MS);
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
    this.debounceTimer && (clearTimeout(this.debounceTimer), this.debounceTimer = void 0), this._urlCheckInterval && (clearInterval(this._urlCheckInterval), this._urlCheckInterval = void 0), this._iframeObserver && (this._iframeObserver.disconnect(), this._iframeObserver = void 0), this.pendingContentUpdate && (this.handleContentUpdate(
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
   * Save session ID to localStorage
   */
  saveSessionIdToStorage(e) {
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
      this.clearSessionIdFromStorage(), this._sessionId = void 0, console.log("Completed checkout cleanup finished");
    }
  }
  /**
   * Fetch basket data from BookVisit API
   */
  async fetchBookVisitBasket() {
    var s, r;
    if (!this.campaign || this.campaign.type !== "bookvisit")
      return null;
    const e = (r = (s = this.campaign.config) == null ? void 0 : s.bookvisit) == null ? void 0 : r.channel_id;
    if (!e)
      return console.error("BookVisit channel_id not found in campaign config"), null;
    const t = this.getCookie("bv_jwt");
    if (!t)
      return console.warn("BookVisit JWT token not found in cookies"), null;
    try {
      const n = `https://restapi.bookvisit.com/baskets/basket-v1?IncludePaymentHistory=false&ChannelId=${e}`, o = await fetch(n, {
        credentials: "include",
        headers: {
          authorization: `Bearer ${t}`
        }
      });
      if (!o.ok)
        return console.error(
          `BookVisit API error: ${o.status} ${o.statusText}`
        ), null;
      const a = await o.json();
      return this.extractBookVisitProductsAndTotal(a);
    } catch (n) {
      return console.error("Error fetching BookVisit basket:", n), null;
    }
  }
  /**
   * Extract products and total from BookVisit API response
   */
  extractBookVisitProductsAndTotal(e) {
    var r;
    const t = [];
    let s = 0;
    try {
      const n = (r = e == null ? void 0 : e.booking) == null ? void 0 : r.bookingData;
      if (!n)
        return { products: t, total: s };
      s = n.totalPrice || 0;
      const o = n.rooms || [], a = n.roomDescriptions || [], l = n.addOnDescriptions || [];
      o.forEach((c) => {
        var y;
        const h = a.find(
          (g) => g.id === c.roomId
        ), d = c.totalPrice || 0, f = {
          id: c.roomId,
          name: (h == null ? void 0 : h.name) || "Room",
          price: d,
          quantity: 1,
          type: "room",
          startDate: c.startDate,
          endDate: c.endDate,
          roomConfig: c.roomConfig
        };
        if (c.priceInfo && c.priceInfo.length > 0) {
          const g = c.priceInfo[0].ratePlanId, w = (y = n.ratePlanDescriptions) == null ? void 0 : y.find(
            (k) => k.id === g
          );
          w && (f.ratePlan = w.name);
        }
        t.push(f), (c.mandatoryAddOns || []).forEach((g) => {
          const w = g.totalPrice || 0;
          if (w > 0) {
            const k = l.find(
              (m) => m.id === g.addOnId
            );
            t.push({
              id: g.addOnId,
              name: (k == null ? void 0 : k.name) || "Add-on",
              price: w,
              quantity: g.numberOfUnits || 1,
              type: "addon",
              roomId: c.roomId,
              date: g.date
            });
          }
        });
      }), (n.optionalAddOns || []).forEach((c) => {
        const h = c.totalPrice || 0;
        if (h > 0) {
          const d = l.find(
            (f) => f.id === c.addOnId
          );
          t.push({
            id: c.addOnId,
            name: (d == null ? void 0 : d.name) || "Add-on",
            price: h,
            quantity: c.numberOfUnits || 1,
            type: "addon",
            roomId: c.roomId,
            date: c.date
          });
        }
      });
    } catch (n) {
      console.error(
        "Error extracting BookVisit products and total:",
        n
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
    const t = document.getElementById("main_content_container");
    if (!t) {
      console.warn(
        "main_content_container not found, cannot inject autofields"
      );
      return;
    }
    const s = this.getFieldsToInclude(e);
    if (s.length === 0) {
      console.log(
        "No relevant fields found in input_mapping for autofields"
      );
      return;
    }
    const r = this.createBookVisitFormSection(s);
    t.insertAdjacentHTML("afterbegin", r), this.setupAutofieldListenersWithRetry();
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
   * Get the user's locale from browser settings
   */
  getUserLocale() {
    return typeof navigator > "u" ? "en" : navigator.languages && navigator.languages.length > 0 ? navigator.languages[0].split("-")[0].toLowerCase() : navigator.language ? navigator.language.split("-")[0].toLowerCase() : "en";
  }
  /**
   * Get localized text for email and phone number fields
   */
  getLocalizedText(e) {
    const t = this.getUserLocale(), s = {
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
    const t = e.includes("firstName"), s = e.includes("lastName"), r = e.includes("email"), n = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber");
    let l = '<div class="bv-m-0 bv-grid bv-gap-[10px] bv-grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bv-mt-[20px] bv_small:bv-grid-cols-1">';
    return t && (l += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="given-name" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_firstname" placeholder="Fornavn *" name="firstName">
                </div>
            `), s && (l += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="family-name" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_lastname" placeholder="Etternavn *" name="lastName">
                </div>
            `), r && (l += `
                <div class="bv-relative bv-w-full">
                    <input autocomplete="email" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor" data-testid="customer_info_form_email" placeholder="${o} *" type="email" name="emailAddress">
                </div>
            `), n && (l += `
                <div class="bv-relative" data-testid="customer_info_form_phone_number">
                    <div class="bv-flex bv-flex-col bv-justify-start">
                        <div class="bv-flex bv-flex-row bv-flex-nowrap bv-items-center bv-justify-start bv-gap-[8px]">
                            <div class="bv-relative bv-m-0 bv-min-w-[80px] bv-max-w-[80px] bv-p-0">
                                <span class="bv-absolute bv-top-1/2 bv-left-[6px] bv-z-[2] bv-block bv-w-auto bv-border-[2px] bv-border-solid bv-border-transparent bv-text-bv_inputColor bv-opacity-70 bv-shadow-none -bv-translate-y-1/2">
                                    <svg data-prefix="far" data-icon="plus" class="svg-inline--fa fa-plus " role="img" viewBox="0 0 448 512" aria-hidden="true">
                                        <path fill="currentColor" d="M248 56c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 176-176 0c-13.3 0-24 10.7-24 24s10.7 24 24 24l176 0 0 176c0 13.3 10.7 24 24 24s24-10.7 24-24l0-176 176 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-176 0 0-176z"></path>
                                    </svg>
                                </span>
                                <div class="bv-relative bv-w-full">
                                    <input aria-label="${a}" pattern="[0-9]" autocomplete="tel-country-code" class="bv-box-border bv-flex bv-h-[40px] bv-w-full bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor bv-min-w-[80px] bv-max-w-[80px] bv-pl-[26px]" data-testid="checkout_phonecountrycode" placeholder="" type="number" name="phoneCountryCode">
                                </div>
                            </div>
                            <div class="bv-relative bv-w-full">
                                <input pattern="[0-9]" aria-label="${a}" autocomplete="tel-national" class="bv-box-border bv-flex bv-h-[40px] bv-pl-[14px] bv-rounded-bv_inputRoundedCorners bv-border-solid bv-bv_inputBorder disabled:bv-cursor-not-allowed disabled:bv-opacity-50 bv-font-bv_bodyFontFamily bv-text-bv_bodyFontSize placeholder:bv-text-bv_inputColor/30 focus:!bv-outline-none focus:bv-ring-2 bv-bg-bv_inputBackground bv-text-bv_inputColor bv-w-full" data-testid="checkout_phonenumber" placeholder="${a} *" type="number" name="phoneNumber">
                            </div>
                        </div>
                    </div>
                </div>
            `), l += "</div>", `
            <div data-testid="checkout_responsible_for_booking_section" class="bv-mx-0 bv-px-0 bv-pt-0 bv-pb-[40px] bv-w-full" aria-label="Ansvarlig for bestilling" role="group" style="scroll-margin-top: 20px;">
                <div class="bv-mb-[15px] bv-flex bv-items-center bv-justify-between bv-gap-[15px]">
                    <div data-orientation="horizontal" role="none" class="bv-bg-bv_dividerBorderColor bv-h-bv_dividerBorderWidth bv-w-full bv-flex-1"></div>
                    <p class="bv-bv_text bv-font-bv_bodyBoldFontWeight bv-opacity-bv_bodyMutedOpacity bv-text-bv_bodyFontSize bv-font-bv_bodyFontFamily" role="group" tabindex="-1">Ansvarlig for bestilling</p>
                    <div data-orientation="horizontal" role="none" class="bv-bg-bv_dividerBorderColor bv-h-bv_dividerBorderWidth bv-w-full bv-flex-1"></div>
                </div>
                <div class="bv-rounded-bv_cardBorderRadius bv-border-bv_cardBorderWidth bv-border-bv_cardBorderColor bv-bg-bv_cardBackground bv-text-bv_cardColor bv-shadow-bv_cardBoxShadow bv_card bv-relative bv-border-solid bv-select-none [&_.bv_card]:bv-shadow-none [&_.bv_card]:bv-bg-bv_cardInnerBackground bv-p-[25px] bv_small:bv-p-[20px]" data-testid="customer_info_section">
                    ${l}
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
    var o, a, l, u, c, h, d, f, p, y, g, w, k, m, b, x, C, O, _t, wt;
    const t = [];
    let s = 0;
    const r = this.getSynxisActualTotal(), n = this._synxisSessionIds;
    try {
      const Me = (e == null ? void 0 : e.ShoppingCart) || [], te = [];
      for (const I of Me) {
        const T = ((a = (o = I == null ? void 0 : I.UpdatedData) == null ? void 0 : o.itinerary) == null ? void 0 : a.reservations) || [];
        for (const se of T)
          te.push({
            resv: se,
            itineraryNumber: (I == null ? void 0 : I.Itemid) || ""
          });
      }
      let Ce = te;
      if (n != null && n.sbeRcDecoded) {
        const I = te.filter(
          ({ resv: T }) => T.id === n.sbeRcDecoded
        );
        I.length > 0 && (Ce = I);
      }
      Ce === te && te.length > 1 && (Ce = [...te].sort(
        (I, T) => T.itineraryNumber.localeCompare(I.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: I } of Ce) {
        const T = I.extrasFromShopping || {}, se = I.stayCriteria || {}, St = I.guestCriteria || {}, P = T.prices || {}, kt = ((c = (u = (l = P == null ? void 0 : P.Total) == null ? void 0 : l.Price) == null ? void 0 : u.Total) == null ? void 0 : c.AmountWithTaxesFees) || ((f = (d = (h = P == null ? void 0 : P.Total) == null ? void 0 : h.Price) == null ? void 0 : d.Total) == null ? void 0 : f.Amount) || ((y = (p = P == null ? void 0 : P.Total) == null ? void 0 : p.Price) == null ? void 0 : y.Amount) || 0, Et = ((P == null ? void 0 : P.Daily) || []).map((q) => {
          var Ct, It, Tt, xt, Pt, At, Ot, jt, $t, Rt;
          return {
            date: q.Date,
            amount: ((It = (Ct = q.Price) == null ? void 0 : Ct.Total) == null ? void 0 : It.Amount) || ((Tt = q.Price) == null ? void 0 : Tt.Amount) || 0,
            amountWithTax: ((Pt = (xt = q.Price) == null ? void 0 : xt.Total) == null ? void 0 : Pt.AmountWithTaxesFees) || 0,
            tax: ((Ot = (At = q.Price) == null ? void 0 : At.Tax) == null ? void 0 : Ot.Amount) || 0,
            fees: (($t = (jt = q.Price) == null ? void 0 : jt.Fees) == null ? void 0 : $t.Amount) || 0,
            currency: (Rt = q.Price) == null ? void 0 : Rt.CurrencyCode,
            inventory: q.AvailableInventory
          };
        }), Ds = {
          id: I.id,
          confirmationNumber: I.confirmationNumber,
          itineraryNumber: I.itineraryNumber,
          name: T.displayname || "Room",
          roomCode: se.roomCode,
          rateCode: se.rateCode,
          price: kt,
          actualTotal: r,
          dailyRate: T.amount || T.amountWithTaxesFees,
          currency: T.currencyCode,
          dailyPrices: Et,
          taxes: ((k = (w = (g = P == null ? void 0 : P.Total) == null ? void 0 : g.Price) == null ? void 0 : w.Tax) == null ? void 0 : k.Amount) || 0,
          fees: ((x = (b = (m = P == null ? void 0 : P.Total) == null ? void 0 : m.Price) == null ? void 0 : b.Fees) == null ? void 0 : x.Amount) || 0,
          startDate: (C = se.startDate) == null ? void 0 : C.split("T")[0],
          endDate: (O = se.endDate) == null ? void 0 : O.split("T")[0],
          nights: Et.length || null,
          adults: St.numAdults || 1,
          children: St.numChildren || 0,
          hotelId: String(I.hotelId),
          chainId: String(I.chainId),
          bedDescription: T.bedDescription,
          bedType: T.bedType,
          bedQuantity: T.bedQuantity,
          maxRoomSize: T.maxRoomSize,
          minRoomSize: T.minRoomSize,
          guestLimit: T.guestLimit,
          inventory: T.inventory,
          bookingPolicyCode: T.bookingPolicyCode,
          cancelPolicyCode: T.cancelPolicyCode,
          status: I.status,
          type: "room",
          quantity: 1,
          addons: I.addOns || [],
          image: T.coverImage || ((wt = (_t = T.imageUrls) == null ? void 0 : _t[0]) == null ? void 0 : wt.Path) || null
        };
        t.push(Ds), s += kt;
      }
    } catch (Me) {
      console.error("SynXis: Error extracting cart API data:", Me);
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
      const s = Array.from(e).map((n) => {
        const o = n;
        return {
          id: o.dataset.id,
          name: o.dataset.tagname,
          price: this.parseElinapmsNumber(o.dataset.tagprice),
          quantity: 1,
          type: "accommodation",
          category: o.dataset.tagcategory,
          locationId: o.dataset.accid,
          ratePlanId: o.dataset.rateruleId
        };
      }), r = this.extractElinapmsTotal();
      return { products: s, total: r };
    } catch (e) {
      return console.error("Error extracting Elina PMS basket:", e), null;
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
      const u = this.parseElinapmsNumber(e.value);
      if (u > 0) return u;
    }
    const t = document.getElementById("accommodationTotal");
    if (!t)
      return this.totalAverage;
    const s = t.querySelector(".formattedCurrency"), r = s ? this.parseElinapmsNumber(s.textContent) : 0, n = t.querySelector(".plusFees"), o = n ? this.parseElinapmsNumber(n.dataset.att) : 0;
    let a = 0;
    const l = document.getElementById("addonsTotal");
    if (l) {
      const u = l.querySelector(".formattedCurrency");
      a = u ? this.parseElinapmsNumber(u.textContent) : 0;
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
      ), u = document.querySelector(
        'input[name="lastName"]'
      );
      n || o || a || l || u ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(r, s)) : console.warn(
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
    var c;
    if (!this.inputDetector)
      return;
    const t = e.target, s = t.value.trim();
    if (!s)
      return;
    const r = this.inputDetector.getContent();
    let n = t.name;
    const o = this.inputDetector.inputMapping;
    (c = o == null ? void 0 : o.field_mappings) != null && c[n] ? n = o.field_mappings[n] : n === "emailAddress" ? n = "email" : n === "phoneNumber" ? n = "phone_number" : n === "firstName" ? n = "first_name" : n === "lastName" && (n = "last_name");
    const a = { ...r, [n]: s }, l = n === "email" || n.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), u = n === "phone_number" || n.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
    if (l || u || this.inputDetector.hasEmailOrPhoneNumber()) {
      const h = this.inputDetector.sessionId;
      this.debouncedHandleContentUpdate(a, h);
    }
  }
  /**
   * Set up event listeners on autofield inputs to store values in sessionStorage
   */
  setupAutofieldStorageListeners() {
    if (typeof document > "u" || this.autofieldStorageListenersSetup)
      return;
    const e = document.querySelector(
      'input[name="emailAddress"]'
    );
    e && (e.addEventListener("input", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage("autofield_email", n.value);
    }), e.addEventListener("blur", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage("autofield_email", n.value);
    }));
    const t = document.querySelector(
      'input[name="phoneCountryCode"]'
    );
    t && (t.addEventListener("input", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage(
        "autofield_phoneCountryCode",
        n.value
      );
    }), t.addEventListener("blur", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage(
        "autofield_phoneCountryCode",
        n.value
      );
    }));
    const s = document.querySelector(
      'input[name="phoneNumber"]'
    );
    s && (s.addEventListener("input", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage(
        "autofield_phoneNumber",
        n.value
      );
    }), s.addEventListener("blur", (r) => {
      const n = r.target;
      n.value && this.saveToSessionStorage(
        "autofield_phoneNumber",
        n.value
      );
    })), (e || t || s) && (this.autofieldStorageListenersSetup = !0);
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
        const h = o.getElementById(
          "registrationManualEmail"
        );
        h && !h.value ? (h.value = l, h.dispatchEvent(
          new Event("input", { bubbles: !0 })
        ), h.dispatchEvent(
          new Event("change", { bubbles: !0 })
        ), console.log("Filled email from sessionStorage:", l)) : h || (a = !1);
      }
      const u = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), c = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (u || c) {
        const h = o.querySelector(
          'input[name="country-code"]'
        );
        if (h && u) {
          h.value = u, h.dispatchEvent(
            new Event("change", { bubbles: !0 })
          );
          const f = o.querySelector(
            '#registrationManualPhonePrefix input[type="text"]'
          );
          f && (f.value = u, f.dispatchEvent(
            new Event("input", { bubbles: !0 })
          ), f.dispatchEvent(
            new Event("change", { bubbles: !0 })
          ));
          const p = o.getElementById(
            "registrationManualPhonePrefix"
          );
          if (p) {
            const y = p.querySelector(
              ".css-1yh68ch-singleValue"
            );
            y && (y.textContent = u);
          }
          console.log(
            "Filled phone country code from sessionStorage:",
            u
          );
        } else u && !h && (a = !1);
        const d = o.getElementById(
          "registrationManualPhoneNumber"
        );
        d && c && !d.value ? (d.value = c, d.dispatchEvent(
          new Event("input", { bubbles: !0 })
        ), d.dispatchEvent(
          new Event("change", { bubbles: !0 })
        ), console.log(
          "Filled phone number from sessionStorage:",
          c
        )) : c && !d && (a = !1);
      }
      return a;
    }, n = () => {
      let o = !0;
      const a = r(document);
      a || (o = !1);
      const l = document.querySelectorAll("iframe");
      let u = !1;
      l.forEach((c) => {
        var h;
        try {
          const d = c.contentDocument || ((h = c.contentWindow) == null ? void 0 : h.document);
          d && (r(d) ? u = !0 : o = !1);
        } catch {
          this.tryPostMessageToIframe(c);
        }
      }), (a || u) && (o = !0), !o && e < t ? (e++, setTimeout(n, s)) : e >= t && !o && console.warn(
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
    var t, s, r, n, o, a, l, u, c, h;
    try {
      const d = this.getFromSessionStorage("autofield_email"), f = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), p = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (!d && !f && !p)
        return;
      let y = "*";
      if (e.src)
        try {
          y = new URL(e.src).origin;
        } catch {
        }
      const g = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((r = e.name) == null ? void 0 : r.toLowerCase().includes("dibs")), w = ((n = e.src) == null ? void 0 : n.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((l = e.src) == null ? void 0 : l.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((u = e.name) == null ? void 0 : u.toLowerCase().includes("nets")) || ((c = e.name) == null ? void 0 : c.toLowerCase().includes("easy"));
      if (!e.contentWindow)
        return;
      const k = [
        // Format 1: Our standard format
        {
          type: "ekteintelligens-autofill",
          email: d || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        },
        // Format 2: Dibs/Nets Easy-specific formats
        ...g || w ? [
          {
            type: "dibs-autofill",
            email: d || null,
            phoneCountryCode: f || null,
            phoneNumber: p || null
          },
          {
            type: "nets-easy-autofill",
            email: d || null,
            phoneCountryCode: f || null,
            phoneNumber: p || null
          },
          {
            action: "autofill",
            data: {
              email: d || null,
              phoneCountryCode: f || null,
              phoneNumber: p || null
            }
          },
          {
            event: "customer-data",
            customer: {
              email: d || null,
              phone: p ? `${f || ""}${p}` : null,
              phoneCountryCode: f || null
            }
          }
        ] : [],
        // Format 3: Generic autofill format
        {
          action: "autofill-fields",
          email: d || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        }
      ];
      k.forEach((b) => {
        try {
          e.contentWindow.postMessage(b, y);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${w ? "Nets Easy/Nexi" : g ? "Dibs" : "cross-origin"} iframe via postMessage (${k.length} formats):`,
        {
          iframeSrc: ((h = e.src) == null ? void 0 : h.substring(0, 100)) || "unknown",
          email: d ? "***" : null,
          phoneCountryCode: f,
          phoneNumber: p ? "***" : null,
          targetOrigin: y
        }
      ), this.tryIframeUrlParameters(
        e,
        d,
        f,
        p
      );
    } catch (d) {
      console.warn("Failed to send postMessage to iframe:", d);
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
v(je, "BASKET_FETCH_TIMEOUT_MS", 8e3);
let ut = je;
class Ii {
  constructor(e) {
    v(this, "options");
    v(this, "supabaseService");
    v(this, "campaign");
    v(this, "formData", {});
    v(this, "inputListeners", []);
    v(this, "buttonListeners", []);
    v(this, "submitListener");
    v(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new vt(
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
class Ti {
  constructor(e) {
    // @ts-ignore
    v(this, "options");
    v(this, "isInitialized", !1);
    v(this, "currentPage", "");
    v(this, "currentVisitStartTime", 0);
    /** Start of the current foreground segment; 0 while paused. */
    v(this, "segmentStart", 0);
    v(this, "data", { visits: [] });
    v(this, "storageKey", "ei_enhanced_insights");
    v(this, "popstateHandler");
    // private pushstateHandler?: () => void;
    // private replacestateHandler?: () => void;
    v(this, "beforeunloadHandler");
    v(this, "visibilityChangeHandler");
    v(this, "originalPushState");
    v(this, "originalReplaceState");
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
      pi();
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
const Y = class Y {
  constructor(e) {
    v(this, "supabaseService");
    v(this, "isInitialized", !1);
    this.supabaseService = new vt(
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
        Y.URL_PARAM
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
        Y.STORAGE_KEY
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
          Y.STORAGE_KEY,
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
v(Y, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
v(Y, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let ht = Y;
class xi {
  constructor(e) {
    v(this, "options");
    v(this, "tools", /* @__PURE__ */ new Map());
    v(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s;
    if (this._isInitialized)
      return !0;
    try {
      ki({
        cookieDomain: this.options.cookieDomain,
        requireConsent: this.options.requireConsent,
        shareInsightsAcrossSubdomains: this.options.shareInsightsAcrossSubdomains
      });
      const r = new ht(this.options);
      if (await r.initialize(), this.tools.set("linkTracking", r), (e = this.options.features) != null && e.abandonedCart) {
        const n = new ut(this.options);
        await n.initialize(), this.tools.set("abandonedCart", n);
      }
      if ((t = this.options.features) != null && t.organizationPipeline) {
        const n = new Ii(
          this.options
        );
        await n.initialize(), this.tools.set(
          "organizationPipeline",
          n
        );
      }
      if ((s = this.options.features) != null && s.enhancedInsights) {
        const n = async () => {
          if (this.tools.has("enhancedInsights")) return;
          const o = new Ti(
            this.options
          );
          await o.initialize(), this.tools.set("enhancedInsights", o);
        };
        bt() && await n(), this.options.requireConsent && yi((o) => {
          if (o)
            n();
          else {
            const a = this.tools.get("enhancedInsights");
            a && (a.destroy(), a.clearData(), this.tools.delete("enhancedInsights"));
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
  /**
   * Grant or revoke analytics-persistence consent. Wire this to the CMP's
   * consent callback when the SDK is configured with `requireConsent: true`
   * (Cookiebot, OneTrust and TCF-compliant CMPs are also auto-detected).
   * Revoking clears the persisted payload and cookie.
   */
  setConsent(e) {
    _e(e);
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
typeof window < "u" && (window.EkteIntelligensSDK = xi);
export {
  xi as EkteIntelligensSDK
};
