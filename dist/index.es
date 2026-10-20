var ln = Object.defineProperty;
var cn = (r, e, t) => e in r ? ln(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var m = (r, e, t) => cn(r, typeof e != "symbol" ? e + "" : e, t);
const re = class re {
  constructor(e) {
    m(this, "inputMapping");
    m(this, "content", {});
    m(this, "sessionId");
    m(this, "hasEmailOrPhone", !1);
    m(this, "onContentUpdate");
    // One stable reference: `.bind(this)` returns a new function on every
    // call, so removeEventListener(this.handleInputBlur.bind(this)) never
    // removed anything and a stop/start cycle stacked duplicate listeners.
    // Adding the same reference twice is a no-op, so restarts are safe too.
    m(this, "boundHandleInputBlur", (e) => this.handleInputBlur(e));
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
    if (re.IGNORED_INPUT_TYPES.has(t)) return !0;
    const s = (e.getAttribute("autocomplete") || "").toLowerCase();
    return /(^|\s)(cc-[a-z-]+|current-password|new-password|one-time-code)(\s|$)/.test(
      s
    ) ? !0 : re.SENSITIVE_NAME.test(e.name || "") || re.SENSITIVE_NAME.test(e.id || "");
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
    var i;
    const t = (i = this.inputMapping) == null ? void 0 : i.excluded_inputs;
    if (!t || t.length === 0) return !1;
    const s = (e.name || "").toLowerCase(), n = (e.id || "").toLowerCase();
    return t.some((o) => {
      const a = o.toLowerCase();
      return s !== "" && a === s || n !== "" && a === n;
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
    const n = t.value.trim();
    n && (this.content[s] = n, this.isEmailOrPhone(s, n) && (this.hasEmailOrPhone = !0), this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
  }
  getFieldName(e) {
    var s, n;
    let t = e.name || e.id || e.getAttribute("data-field") || e.type || "unknown";
    if ((s = this.inputMapping) != null && s.field_mappings && this.inputMapping.field_mappings[t])
      t = this.inputMapping.field_mappings[t];
    else if ((n = this.inputMapping) != null && n.field_mappings) {
      const i = e.getAttribute("autocomplete-data");
      i && this.inputMapping.field_mappings[i] && (t = this.inputMapping.field_mappings[i]);
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
m(re, "IGNORED_INPUT_TYPES", /* @__PURE__ */ new Set([
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
m(re, "SENSITIVE_NAME", /passw|passord|pwd|cvc|cvv|card[-_ ]?(number|(num|no)([^a-z]|$))|security[-_ ]?code|kontonummer|account[-_ ]?number|personnummer|f[oø]dselsnummer|(^|[^a-z])(ssn|iban)([^a-z]|$)|(^|[^a-z])cc[-_]?(number|num|csc|exp)/i);
let ct = re;
class un {
  constructor(e) {
    m(this, "productMapping");
    this.productMapping = this.cleanProductMapping(e);
  }
  cleanProductMapping(e) {
    if (!e) return e;
    if (e.fields) {
      const t = { ...e }, s = {};
      for (const [n, i] of Object.entries(
        e.fields
      ))
        s[n] = this.cleanSelector(
          i
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
    const s = Object.values(t), n = this.findCommonParentSelector(s);
    if (n && document.querySelectorAll(n).forEach((o) => {
      const a = this.extractProductFromFieldsMapping(
        o,
        t
      );
      a && Object.keys(a).length > 0 && e.push(a);
    }), e.length === 0) {
      const i = this.extractProductFromFieldsMapping(
        document.body,
        t
      );
      i && Object.keys(i).length > 0 && e.push(i);
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
      const i = s[0];
      if (e.every(
        (a) => a.startsWith(i)
      ))
        return i;
    }
    const n = [
      "body",
      "main",
      "#content",
      "#main",
      ".main",
      ".content"
    ];
    for (const i of n)
      if (document.querySelectorAll(i).length > 0)
        return i;
    return null;
  }
  extractProductFromFieldsMapping(e, t) {
    try {
      const s = {};
      for (const [n, i] of Object.entries(t)) {
        let o = this.extractValue(e, i);
        if (o === null && i.startsWith("data-")) {
          const a = document.querySelectorAll(
            `[${i}]`
          );
          a.length > 0 && (o = a[0].getAttribute(
            i
          ));
        }
        o !== null && (n.toLowerCase().includes("price") ? s[n] = this.extractPrice(
          e,
          i
        ) : n.toLowerCase().includes("quantity") ? s[n] = this.extractQuantity(
          e,
          i
        ) : s[n] = o);
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
      document.querySelectorAll(s).forEach((i) => {
        const o = this.extractProductFromCommonElement(i);
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
    var s, n, i;
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
              return ((n = c.textContent) == null ? void 0 : n.trim()) || null;
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
      return o && ((i = o.textContent) == null ? void 0 : i.trim()) || null;
    } catch (o) {
      return console.warn(
        `Error extracting value with selector: ${t}`,
        o
      ), null;
    }
  }
  extractTextContent(e, t) {
    var n;
    const s = e.querySelector(t);
    return s && ((n = s.textContent) == null ? void 0 : n.trim()) || null;
  }
  extractPrice(e, t) {
    const s = this.extractValue(e, t);
    if (!s) return 0;
    let n = s.replace(/^[A-Z]{3}\s*/i, "");
    if (n = n.replace(/^[€$£¥]\s*/i, ""), n = n.replace(/[^\d.,]/g, ""), n.includes(",")) {
      const o = n.split(",");
      o.length === 2 && o[1].length === 3 ? n = o[0] + o[1] : n = n.replace(",", ".");
    }
    const i = parseFloat(n);
    return isNaN(i) ? 0 : i;
  }
  extractQuantity(e, t) {
    const s = this.extractValue(e, t);
    if (!s) return 1;
    const n = parseInt(s);
    return isNaN(n) ? 1 : n;
  }
  findElementsWithAnySelector(e) {
    const t = /* @__PURE__ */ new Set();
    for (const s of e)
      try {
        document.querySelectorAll(s).forEach((i) => t.add(i));
      } catch (n) {
        console.warn(`Invalid selector: ${s}`, n);
      }
    return Array.from(t);
  }
}
class dn {
  constructor(e) {
    m(this, "totalSelector");
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
      let n = s.replace(/[^\d.,]/g, "");
      const i = n.includes(","), o = n.includes(".");
      if (i && o) {
        const l = n.lastIndexOf(","), c = n.lastIndexOf(".");
        l > c ? n.substring(l + 1).length === 2 ? (n = n.replace(/\./g, ""), n = n.replace(",", ".")) : n = n.replace(/,/g, "") : n = n.replace(/,/g, "");
      } else if (i && !o) {
        const l = n.match(/,/g);
        if ((l ? l.length : 0) > 1)
          n = n.replace(/,/g, "");
        else {
          const u = n.match(/,(\d+)$/);
          u && u[1].length === 3 ? n = n.replace(",", "") : n = n.replace(",", ".");
        }
      } else if (!i && o) {
        const l = n.match(/\./g);
        if ((l ? l.length : 0) > 1)
          n = n.replace(/\./g, "");
        else {
          const u = n.match(/\.(\d+)$/);
          u && u[1].length === 3 && (n = n.replace(".", ""));
        }
      }
      const a = parseFloat(n);
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
const hn = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => be).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class At extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class fn extends At {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Jt extends At {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Gt extends At {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var ut;
(function(r) {
  r.Any = "any", r.ApNortheast1 = "ap-northeast-1", r.ApNortheast2 = "ap-northeast-2", r.ApSouth1 = "ap-south-1", r.ApSoutheast1 = "ap-southeast-1", r.ApSoutheast2 = "ap-southeast-2", r.CaCentral1 = "ca-central-1", r.EuCentral1 = "eu-central-1", r.EuWest1 = "eu-west-1", r.EuWest2 = "eu-west-2", r.EuWest3 = "eu-west-3", r.SaEast1 = "sa-east-1", r.UsEast1 = "us-east-1", r.UsWest1 = "us-west-1", r.UsWest2 = "us-west-2";
})(ut || (ut = {}));
var pn = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
class gn {
  constructor(e, { headers: t = {}, customFetch: s, region: n = ut.Any } = {}) {
    this.url = e, this.headers = t, this.region = n, this.fetch = hn(s);
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
    return pn(this, void 0, void 0, function* () {
      try {
        const { headers: n, method: i, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region);
        const c = new URL(`${this.url}/${e}`);
        l && l !== "any" && (a["x-region"] = l, c.searchParams.set("forceFunctionRegion", l));
        let u;
        o && (n && !Object.prototype.hasOwnProperty.call(n, "Content-Type") || !n) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", u = o) : typeof FormData < "u" && o instanceof FormData ? u = o : (a["Content-Type"] = "application/json", u = JSON.stringify(o)));
        const d = yield this.fetch(c.toString(), {
          method: i || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), n),
          body: u
        }).catch((y) => {
          throw new fn(y);
        }), h = d.headers.get("x-relay-error");
        if (h && h === "true")
          throw new Jt(d);
        if (!d.ok)
          throw new Gt(d);
        let f = ((s = d.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield d.json() : f === "application/octet-stream" ? p = yield d.blob() : f === "text/event-stream" ? p = d : f === "multipart/form-data" ? p = yield d.formData() : p = yield d.text(), { data: p, error: null, response: d };
      } catch (n) {
        return {
          data: null,
          error: n,
          response: n instanceof Gt || n instanceof Jt ? n.context : void 0
        };
      }
    });
  }
}
var D = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function mn(r) {
  if (r.__esModule) return r;
  var e = r.default;
  if (typeof e == "function") {
    var t = function s() {
      return this instanceof s ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(r).forEach(function(s) {
    var n = Object.getOwnPropertyDescriptor(r, s);
    Object.defineProperty(t, s, n.get ? n : {
      enumerable: !0,
      get: function() {
        return r[s];
      }
    });
  }), t;
}
var L = {}, Pt = {}, Ve = {}, xe = {}, We = {}, Ke = {}, yn = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, ve = yn();
const vn = ve.fetch, _s = ve.fetch.bind(ve), ws = ve.Headers, bn = ve.Request, _n = ve.Response, be = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: ws,
  Request: bn,
  Response: _n,
  default: _s,
  fetch: vn
}, Symbol.toStringTag, { value: "Module" })), wn = /* @__PURE__ */ mn(be);
var Je = {};
Object.defineProperty(Je, "__esModule", { value: !0 });
let Sn = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
Je.default = Sn;
var Ss = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(Ke, "__esModule", { value: !0 });
const kn = Ss(wn), En = Ss(Je);
let Cn = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = kn.default : this.fetch = fetch;
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
    let n = s(this.url.toString(), {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
      signal: this.signal
    }).then(async (i) => {
      var o, a, l;
      let c = null, u = null, d = null, h = i.status, f = i.statusText;
      if (i.ok) {
        if (this.method !== "HEAD") {
          const w = await i.text();
          w === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = w : u = JSON.parse(w));
        }
        const y = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), g = (a = i.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        y && g && g.length > 1 && (d = parseInt(g[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (c = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const y = await i.text();
        try {
          c = JSON.parse(y), Array.isArray(c) && i.status === 404 && (u = [], c = null, h = 200, f = "OK");
        } catch {
          i.status === 404 && y === "" ? (h = 204, f = "No Content") : c = {
            message: y
          };
        }
        if (c && this.isMaybeSingle && (!((l = c == null ? void 0 : c.details) === null || l === void 0) && l.includes("0 rows")) && (c = null, h = 200, f = "OK"), c && this.shouldThrowOnError)
          throw new En.default(c);
      }
      return {
        error: c,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (n = n.catch((i) => {
      var o, a, l;
      return {
        error: {
          message: `${(o = i == null ? void 0 : i.name) !== null && o !== void 0 ? o : "FetchError"}: ${i == null ? void 0 : i.message}`,
          details: `${(a = i == null ? void 0 : i.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(l = i == null ? void 0 : i.code) !== null && l !== void 0 ? l : ""}`
        },
        data: null,
        count: null,
        status: 0,
        statusText: ""
      };
    })), n.then(e, t);
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
Ke.default = Cn;
var Tn = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(We, "__esModule", { value: !0 });
const In = Tn(Ke);
let An = class extends In.default {
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
    const s = (e ?? "*").split("").map((n) => /\s/.test(n) && !t ? "" : (n === '"' && (t = !t), n)).join("");
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
  order(e, { ascending: t = !0, nullsFirst: s, foreignTable: n, referencedTable: i = n } = {}) {
    const o = i ? `${i}.order` : "order", a = this.url.searchParams.get(o);
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
    const n = typeof s > "u" ? "limit" : `${s}.limit`;
    return this.url.searchParams.set(n, `${e}`), this;
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
  range(e, t, { foreignTable: s, referencedTable: n = s } = {}) {
    const i = typeof n > "u" ? "offset" : `${n}.offset`, o = typeof n > "u" ? "limit" : `${n}.limit`;
    return this.url.searchParams.set(i, `${e}`), this.url.searchParams.set(o, `${t - e + 1}`), this;
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
  explain({ analyze: e = !1, verbose: t = !1, settings: s = !1, buffers: n = !1, wal: i = !1, format: o = "text" } = {}) {
    var a;
    const l = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      n ? "buffers" : null,
      i ? "wal" : null
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
We.default = An;
var Pn = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(xe, "__esModule", { value: !0 });
const xn = Pn(We);
let On = class extends xn.default {
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
    const s = Array.from(new Set(t)).map((n) => typeof n == "string" && new RegExp("[,()]").test(n) ? `"${n}"` : `${n}`).join(",");
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
  textSearch(e, t, { config: s, type: n } = {}) {
    let i = "";
    n === "plain" ? i = "pl" : n === "phrase" ? i = "ph" : n === "websearch" && (i = "w");
    const o = s === void 0 ? "" : `(${s})`;
    return this.url.searchParams.append(e, `${i}fts${o}.${t}`), this;
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
    const n = s ? `${s}.or` : "or";
    return this.url.searchParams.append(n, `(${e})`), this;
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
xe.default = On;
var jn = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(Ve, "__esModule", { value: !0 });
const we = jn(xe);
let $n = class {
  constructor(e, { headers: t = {}, schema: s, fetch: n }) {
    this.url = e, this.headers = t, this.schema = s, this.fetch = n;
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
    const n = t ? "HEAD" : "GET";
    let i = !1;
    const o = (e ?? "*").split("").map((a) => /\s/.test(a) && !i ? "" : (a === '"' && (i = !i), a)).join("");
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new we.default({
      method: n,
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
    const n = "POST", i = [];
    if (this.headers.Prefer && i.push(this.headers.Prefer), t && i.push(`count=${t}`), s || i.push("missing=default"), this.headers.Prefer = i.join(","), Array.isArray(e)) {
      const o = e.reduce((a, l) => a.concat(Object.keys(l)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((l) => `"${l}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new we.default({
      method: n,
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
  upsert(e, { onConflict: t, ignoreDuplicates: s = !1, count: n, defaultToNull: i = !0 } = {}) {
    const o = "POST", a = [`resolution=${s ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), n && a.push(`count=${n}`), i || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const l = e.reduce((c, u) => c.concat(Object.keys(u)), []);
      if (l.length > 0) {
        const c = [...new Set(l)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", c.join(","));
      }
    }
    return new we.default({
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
    const s = "PATCH", n = [];
    return this.headers.Prefer && n.push(this.headers.Prefer), t && n.push(`count=${t}`), this.headers.Prefer = n.join(","), new we.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new we.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Ve.default = $n;
var Ge = {}, Xe = {};
Object.defineProperty(Xe, "__esModule", { value: !0 });
Xe.version = void 0;
Xe.version = "0.0.0-automated";
Object.defineProperty(Ge, "__esModule", { value: !0 });
Ge.DEFAULT_HEADERS = void 0;
const Rn = Xe;
Ge.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Rn.version}` };
var ks = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(Pt, "__esModule", { value: !0 });
const Ln = ks(Ve), Dn = ks(xe), Nn = Ge;
let Un = class Es {
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
  constructor(e, { headers: t = {}, schema: s, fetch: n } = {}) {
    this.url = e, this.headers = Object.assign(Object.assign({}, Nn.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = n;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new Ln.default(t, {
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
    return new Es(this.url, {
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
  rpc(e, t = {}, { head: s = !1, get: n = !1, count: i } = {}) {
    let o;
    const a = new URL(`${this.url}/rpc/${e}`);
    let l;
    s || n ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (o = "POST", l = t);
    const c = Object.assign({}, this.headers);
    return i && (c.Prefer = `count=${i}`), new Dn.default({
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
Pt.default = Un;
var _e = D && D.__importDefault || function(r) {
  return r && r.__esModule ? r : { default: r };
};
Object.defineProperty(L, "__esModule", { value: !0 });
L.PostgrestError = L.PostgrestBuilder = L.PostgrestTransformBuilder = L.PostgrestFilterBuilder = L.PostgrestQueryBuilder = L.PostgrestClient = void 0;
const Cs = _e(Pt);
L.PostgrestClient = Cs.default;
const Ts = _e(Ve);
L.PostgrestQueryBuilder = Ts.default;
const Is = _e(xe);
L.PostgrestFilterBuilder = Is.default;
const As = _e(We);
L.PostgrestTransformBuilder = As.default;
const Ps = _e(Ke);
L.PostgrestBuilder = Ps.default;
const xs = _e(Je);
L.PostgrestError = xs.default;
var Fn = L.default = {
  PostgrestClient: Cs.default,
  PostgrestQueryBuilder: Ts.default,
  PostgrestFilterBuilder: Is.default,
  PostgrestTransformBuilder: As.default,
  PostgrestBuilder: Ps.default,
  PostgrestError: xs.default
};
const {
  PostgrestClient: Mn,
  PostgrestQueryBuilder: wo,
  PostgrestFilterBuilder: So,
  PostgrestTransformBuilder: ko,
  PostgrestBuilder: Eo,
  PostgrestError: Co
} = Fn;
function Bn() {
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
const qn = Bn(), zn = "2.11.15", Hn = `realtime-js/${zn}`, Vn = "1.0.0", Os = 1e4, Wn = 1e3;
var ke;
(function(r) {
  r[r.connecting = 0] = "connecting", r[r.open = 1] = "open", r[r.closing = 2] = "closing", r[r.closed = 3] = "closed";
})(ke || (ke = {}));
var j;
(function(r) {
  r.closed = "closed", r.errored = "errored", r.joined = "joined", r.joining = "joining", r.leaving = "leaving";
})(j || (j = {}));
var F;
(function(r) {
  r.close = "phx_close", r.error = "phx_error", r.join = "phx_join", r.reply = "phx_reply", r.leave = "phx_leave", r.access_token = "access_token";
})(F || (F = {}));
var dt;
(function(r) {
  r.websocket = "websocket";
})(dt || (dt = {}));
var ne;
(function(r) {
  r.Connecting = "connecting", r.Open = "open", r.Closing = "closing", r.Closed = "closed";
})(ne || (ne = {}));
class Kn {
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
    const n = t.getUint8(1), i = t.getUint8(2);
    let o = this.HEADER_LENGTH + 2;
    const a = s.decode(e.slice(o, o + n));
    o = o + n;
    const l = s.decode(e.slice(o, o + i));
    o = o + i;
    const c = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: l, payload: c };
  }
}
class js {
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
(function(r) {
  r.abstime = "abstime", r.bool = "bool", r.date = "date", r.daterange = "daterange", r.float4 = "float4", r.float8 = "float8", r.int2 = "int2", r.int4 = "int4", r.int4range = "int4range", r.int8 = "int8", r.int8range = "int8range", r.json = "json", r.jsonb = "jsonb", r.money = "money", r.numeric = "numeric", r.oid = "oid", r.reltime = "reltime", r.text = "text", r.time = "time", r.timestamp = "timestamp", r.timestamptz = "timestamptz", r.timetz = "timetz", r.tsrange = "tsrange", r.tstzrange = "tstzrange";
})(T || (T = {}));
const Xt = (r, e, t = {}) => {
  var s;
  const n = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((i, o) => (i[o] = Jn(o, r, e, n), i), {});
}, Jn = (r, e, t, s) => {
  const n = e.find((a) => a.name === r), i = n == null ? void 0 : n.type, o = t[r];
  return i && !s.includes(i) ? $s(i, o) : ht(o);
}, $s = (r, e) => {
  if (r.charAt(0) === "_") {
    const t = r.slice(1, r.length);
    return Qn(e, t);
  }
  switch (r) {
    case T.bool:
      return Gn(e);
    case T.float4:
    case T.float8:
    case T.int2:
    case T.int4:
    case T.int8:
    case T.numeric:
    case T.oid:
      return Xn(e);
    case T.json:
    case T.jsonb:
      return Yn(e);
    case T.timestamp:
      return Zn(e);
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
      return ht(e);
    default:
      return ht(e);
  }
}, ht = (r) => r, Gn = (r) => {
  switch (r) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return r;
  }
}, Xn = (r) => {
  if (typeof r == "string") {
    const e = parseFloat(r);
    if (!Number.isNaN(e))
      return e;
  }
  return r;
}, Yn = (r) => {
  if (typeof r == "string")
    try {
      return JSON.parse(r);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), r;
    }
  return r;
}, Qn = (r, e) => {
  if (typeof r != "string")
    return r;
  const t = r.length - 1, s = r[t];
  if (r[0] === "{" && s === "}") {
    let i;
    const o = r.slice(1, t);
    try {
      i = JSON.parse("[" + o + "]");
    } catch {
      i = o ? o.split(",") : [];
    }
    return i.map((a) => $s(e, a));
  }
  return r;
}, Zn = (r) => typeof r == "string" ? r.replace(" ", "T") : r, Rs = (r) => {
  let e = r;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class et {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, n = Os) {
    this.channel = e, this.event = t, this.payload = s, this.timeout = n, this.sent = !1, this.timeoutTimer = void 0, this.ref = "", this.receivedResp = null, this.recHooks = [], this.refEvent = null;
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
var Yt;
(function(r) {
  r.SYNC = "sync", r.JOIN = "join", r.LEAVE = "leave";
})(Yt || (Yt = {}));
class Ee {
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
    this.channel._on(s.state, {}, (n) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = Ee.syncState(this.state, n, i, o), this.pendingDiffs.forEach((l) => {
        this.state = Ee.syncDiff(this.state, l, i, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (n) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(n) : (this.state = Ee.syncDiff(this.state, n, i, o), a());
    }), this.onJoin((n, i, o) => {
      this.channel._trigger("presence", {
        event: "join",
        key: n,
        currentPresences: i,
        newPresences: o
      });
    }), this.onLeave((n, i, o) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: n,
        currentPresences: i,
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
  static syncState(e, t, s, n) {
    const i = this.cloneDeep(e), o = this.transformState(t), a = {}, l = {};
    return this.map(i, (c, u) => {
      o[c] || (l[c] = u);
    }), this.map(o, (c, u) => {
      const d = i[c];
      if (d) {
        const h = u.map((g) => g.presence_ref), f = d.map((g) => g.presence_ref), p = u.filter((g) => f.indexOf(g.presence_ref) < 0), y = d.filter((g) => h.indexOf(g.presence_ref) < 0);
        p.length > 0 && (a[c] = p), y.length > 0 && (l[c] = y);
      } else
        a[c] = u;
    }), this.syncDiff(i, { joins: a, leaves: l }, s, n);
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
  static syncDiff(e, t, s, n) {
    const { joins: i, leaves: o } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return s || (s = () => {
    }), n || (n = () => {
    }), this.map(i, (a, l) => {
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
      c = c.filter((d) => u.indexOf(d.presence_ref) < 0), e[a] = c, n(a, c, l), c.length === 0 && delete e[a];
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
      const n = e[s];
      return "metas" in n ? t[s] = n.metas.map((i) => (i.presence_ref = i.phx_ref, delete i.phx_ref, delete i.phx_ref_prev, i)) : t[s] = n, t;
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
var Qt;
(function(r) {
  r.ALL = "*", r.INSERT = "INSERT", r.UPDATE = "UPDATE", r.DELETE = "DELETE";
})(Qt || (Qt = {}));
var Zt;
(function(r) {
  r.BROADCAST = "broadcast", r.PRESENCE = "presence", r.POSTGRES_CHANGES = "postgres_changes", r.SYSTEM = "system";
})(Zt || (Zt = {}));
var z;
(function(r) {
  r.SUBSCRIBED = "SUBSCRIBED", r.TIMED_OUT = "TIMED_OUT", r.CLOSED = "CLOSED", r.CHANNEL_ERROR = "CHANNEL_ERROR";
})(z || (z = {}));
class xt {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = j.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new et(this, F.join, this.params, this.timeout), this.rejoinTimer = new js(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = j.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((n) => n.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = j.closed, this.socket._remove(this);
    }), this._onError((n) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, n), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(F.reply, {}, (n, i) => {
      this._trigger(this._replyEventName(i), n);
    }), this.presence = new Ee(this), this.broadcastEndpointURL = Rs(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, n;
    if (this.socket.isConnected() || this.socket.connect(), this.state == j.closed) {
      const { config: { broadcast: i, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(z.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(z.CLOSED));
      const l = {}, c = {
        broadcast: i,
        presence: o,
        postgres_changes: (n = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((u) => u.filter)) !== null && n !== void 0 ? n : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: c }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(z.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, p = [];
          for (let y = 0; y < f; y++) {
            const g = h[y], { filter: { event: w, schema: C, table: v, filter: _ } } = g, I = u && u[y];
            if (I && I.event === w && I.schema === C && I.table === v && I.filter === _)
              p.push(Object.assign(Object.assign({}, g), { id: I.id }));
            else {
              this.unsubscribe(), this.state = j.errored, e == null || e(z.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(z.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = j.errored, e == null || e(z.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(z.TIMED_OUT);
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
    var s, n;
    if (!this._canPush() && e.type === "broadcast") {
      const { event: i, payload: o } = e, l = {
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
              event: i,
              payload: o,
              private: this.private
            }
          ]
        })
      };
      try {
        const c = await this._fetchWithTimeout(this.broadcastEndpointURL, l, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((n = c.body) === null || n === void 0 ? void 0 : n.cancel()), c.ok ? "ok" : "error";
      } catch (c) {
        return c.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((i) => {
        var o, a, l;
        const c = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((l = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || l === void 0) && l.ack) && i("ok"), c.receive("ok", () => i("ok")), c.receive("error", () => i("error")), c.receive("timeout", () => i("timed out"));
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
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(F.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let s = null;
    return new Promise((n) => {
      s = new et(this, F.leave, {}, e), s.receive("ok", () => {
        t(), n("ok");
      }).receive("timeout", () => {
        t(), n("timed out");
      }).receive("error", () => {
        n("error");
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
    const n = new AbortController(), i = setTimeout(() => n.abort(), s), o = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: n.signal }));
    return clearTimeout(i), o;
  }
  /** @internal */
  _push(e, t, s = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let n = new et(this, e, t, s);
    return this._canPush() ? n.send() : (n.startTimeout(), this.pushBuffer.push(n)), n;
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
    var n, i;
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: c, join: u } = F;
    if (s && [a, l, c, u].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let h = this._onMessage(o, t, s);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (n = this.bindings.postgres_changes) === null || n === void 0 || n.filter((f) => {
      var p, y, g;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((g = (y = f.filter) === null || y === void 0 ? void 0 : y.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(h, s)) : (i = this.bindings[o]) === null || i === void 0 || i.filter((f) => {
      var p, y, g, w, C, v;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const _ = f.id, I = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return _ && ((y = t.ids) === null || y === void 0 ? void 0 : y.includes(_)) && (I === "*" || (I == null ? void 0 : I.toLocaleLowerCase()) === ((g = t.data) === null || g === void 0 ? void 0 : g.type.toLocaleLowerCase()));
        } else {
          const _ = (C = (w = f == null ? void 0 : f.filter) === null || w === void 0 ? void 0 : w.event) === null || C === void 0 ? void 0 : C.toLocaleLowerCase();
          return _ === "*" || _ === ((v = t == null ? void 0 : t.event) === null || v === void 0 ? void 0 : v.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const p = h.data, { schema: y, table: g, commit_timestamp: w, type: C, errors: v } = p;
        h = Object.assign(Object.assign({}, {
          schema: y,
          table: g,
          commit_timestamp: w,
          eventType: C,
          new: {},
          old: {},
          errors: v
        }), this._getPayloadRecords(p));
      }
      f.callback(h, s);
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
    const n = e.toLocaleLowerCase(), i = {
      type: n,
      filter: t,
      callback: s
    };
    return this.bindings[n] ? this.bindings[n].push(i) : this.bindings[n] = [i], this;
  }
  /** @internal */
  _off(e, t) {
    const s = e.toLocaleLowerCase();
    return this.bindings[s] = this.bindings[s].filter((n) => {
      var i;
      return !(((i = n.type) === null || i === void 0 ? void 0 : i.toLocaleLowerCase()) === s && xt.isEqual(n.filter, t));
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
    this._on(F.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(F.error, {}, (t) => e(t));
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
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Xt(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Xt(e.columns, e.old_record)), t;
  }
}
const es = () => {
}, er = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class tr {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = Os, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = es, this.ref = 0, this.logger = es, this.conn = null, this.sendBuffer = [], this.serializer = new Kn(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (i) => {
      let o;
      return i ? o = i : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => be).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${dt.websocket}`, this.httpEndpoint = Rs(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const n = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (n && (this.accessTokenValue = n, this.apiKey = n), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (i) => [1e3, 2e3, 5e3, 1e4][i - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (i, o) => o(JSON.stringify(i)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new js(async () => {
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
      if (this.transport || (this.transport = qn), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Vn }));
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
      case ke.connecting:
        return ne.Connecting;
      case ke.open:
        return ne.Open;
      case ke.closing:
        return ne.Closing;
      default:
        return ne.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === ne.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, n = this.getChannels().find((i) => i.topic === s);
    if (n)
      return n;
    {
      const i = new xt(`realtime:${e}`, t, this);
      return this.channels.push(i), i;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: s, payload: n, ref: i } = e, o = () => {
      this.encode(e, (a) => {
        var l;
        (l = this.conn) === null || l === void 0 || l.send(a);
      });
    };
    this.log("push", `${t} ${s} (${i})`, n), this.isConnected() ? o() : this.sendBuffer.push(o);
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
      const n = {
        access_token: t,
        version: Hn
      };
      t && s.updateJoinPayload(n), s.joinedOnce && s._isJoined() && s._push(F.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Wn, "hearbeat timeout");
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
      let { topic: s, event: n, payload: i, ref: o } = t;
      s === "phoenix" && n === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), o && o === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${i.status || ""} ${s} ${n} ${o && "(" + o + ")" || ""}`, i), Array.from(this.channels).filter((a) => a._isMember(s)).forEach((a) => a._trigger(n, i, o)), this.stateChangeCallbacks.message.forEach((a) => a(t));
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
    this.channels.forEach((e) => e._trigger(F.error));
  }
  /** @internal */
  _appendParams(e, t) {
    if (Object.keys(t).length === 0)
      return e;
    const s = e.match(/\?/) ? "&" : "?", n = new URLSearchParams(t);
    return `${e}${s}${n}`;
  }
  _workerObjectUrl(e) {
    let t;
    if (e)
      t = e;
    else {
      const s = new Blob([er], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class Ot extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function O(r) {
  return typeof r == "object" && r !== null && "__isStorageError" in r;
}
class sr extends Ot {
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
class ft extends Ot {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var nr = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
const Ls = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => be).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, rr = () => nr(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => be)).Response : Response;
}), pt = (r) => {
  if (Array.isArray(r))
    return r.map((t) => pt(t));
  if (typeof r == "function" || r !== Object(r))
    return r;
  const e = {};
  return Object.entries(r).forEach(([t, s]) => {
    const n = t.replace(/([-_][a-z])/gi, (i) => i.toUpperCase().replace(/[-_]/g, ""));
    e[n] = pt(s);
  }), e;
}, ir = (r) => {
  if (typeof r != "object" || r === null)
    return !1;
  const e = Object.getPrototypeOf(r);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in r) && !(Symbol.iterator in r);
};
var ae = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
const tt = (r) => r.msg || r.message || r.error_description || r.error || JSON.stringify(r), or = (r, e, t) => ae(void 0, void 0, void 0, function* () {
  const s = yield rr();
  r instanceof s && !(t != null && t.noResolveJson) ? r.json().then((n) => {
    const i = r.status || 500, o = (n == null ? void 0 : n.statusCode) || i + "";
    e(new sr(tt(n), i, o));
  }).catch((n) => {
    e(new ft(tt(n), n));
  }) : e(new ft(tt(r), r));
}), ar = (r, e, t, s) => {
  const n = { method: r, headers: (e == null ? void 0 : e.headers) || {} };
  return r === "GET" || !s ? n : (ir(s) ? (n.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(s)) : n.body = s, Object.assign(Object.assign({}, n), t));
};
function Oe(r, e, t, s, n, i) {
  return ae(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      r(t, ar(e, s, n, i)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => or(l, a, s));
    });
  });
}
function Me(r, e, t, s) {
  return ae(this, void 0, void 0, function* () {
    return Oe(r, "GET", e, t, s);
  });
}
function H(r, e, t, s, n) {
  return ae(this, void 0, void 0, function* () {
    return Oe(r, "POST", e, s, n, t);
  });
}
function gt(r, e, t, s, n) {
  return ae(this, void 0, void 0, function* () {
    return Oe(r, "PUT", e, s, n, t);
  });
}
function lr(r, e, t, s) {
  return ae(this, void 0, void 0, function* () {
    return Oe(r, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function Ds(r, e, t, s, n) {
  return ae(this, void 0, void 0, function* () {
    return Oe(r, "DELETE", e, s, n, t);
  });
}
var R = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
const cr = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, ts = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class ur {
  constructor(e, t = {}, s, n) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = Ls(n);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, n) {
    return R(this, void 0, void 0, function* () {
      try {
        let i;
        const o = Object.assign(Object.assign({}, ts), n);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (i = new FormData(), i.append("cacheControl", o.cacheControl), l && i.append("metadata", this.encodeMetadata(l)), i.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (i = s, i.append("cacheControl", o.cacheControl), l && i.append("metadata", this.encodeMetadata(l))) : (i = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), n != null && n.headers && (a = Object.assign(Object.assign({}, a), n.headers));
        const c = this._removeEmptyFolders(t), u = this._getFinalPath(c), d = yield (e == "PUT" ? gt : H)(this.fetch, `${this.url}/object/${u}`, i, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: c, id: d.Id, fullPath: d.Key },
          error: null
        };
      } catch (i) {
        if (O(i))
          return { data: null, error: i };
        throw i;
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
    return R(this, void 0, void 0, function* () {
      return this.uploadOrUpdate("POST", e, t, s);
    });
  }
  /**
   * Upload a file with a token generated from `createSignedUploadUrl`.
   * @param path The file path, including the file name. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param token The token generated from `createSignedUploadUrl`
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadToSignedUrl(e, t, s, n) {
    return R(this, void 0, void 0, function* () {
      const i = this._removeEmptyFolders(e), o = this._getFinalPath(i), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const c = Object.assign({ upsert: ts.upsert }, n), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(c.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", c.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", c.cacheControl)) : (l = s, u["cache-control"] = `max-age=${c.cacheControl}`, u["content-type"] = c.contentType);
        const d = yield gt(this.fetch, a.toString(), l, { headers: u });
        return {
          data: { path: i, fullPath: d.Key },
          error: null
        };
      } catch (l) {
        if (O(l))
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
    return R(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const n = Object.assign({}, this.headers);
        t != null && t.upsert && (n["x-upsert"] = "true");
        const i = yield H(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: n }), o = new URL(this.url + i.url), a = o.searchParams.get("token");
        if (!a)
          throw new Ot("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (s) {
        if (O(s))
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
    return R(this, void 0, void 0, function* () {
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
    return R(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (n) {
        if (O(n))
          return { data: null, error: n };
        throw n;
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
    return R(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield H(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (n) {
        if (O(n))
          return { data: null, error: n };
        throw n;
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
    return R(this, void 0, void 0, function* () {
      try {
        let n = this._getFinalPath(e), i = yield H(this.fetch, `${this.url}/object/sign/${n}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return i = { signedUrl: encodeURI(`${this.url}${i.signedURL}${o}`) }, { data: i, error: null };
      } catch (n) {
        if (O(n))
          return { data: null, error: n };
        throw n;
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
    return R(this, void 0, void 0, function* () {
      try {
        const n = yield H(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), i = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: n.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${i}`) : null })),
          error: null
        };
      } catch (n) {
        if (O(n))
          return { data: null, error: n };
        throw n;
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
    return R(this, void 0, void 0, function* () {
      const n = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", i = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = i ? `?${i}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield Me(this.fetch, `${this.url}/${n}/${a}${o}`, {
          headers: this.headers,
          noResolveJson: !0
        })).blob(), error: null };
      } catch (a) {
        if (O(a))
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
    return R(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield Me(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: pt(s), error: null };
      } catch (s) {
        if (O(s))
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
    return R(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield lr(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (O(s) && s instanceof ft) {
          const n = s.originalError;
          if ([400, 404].includes(n == null ? void 0 : n.status))
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
    const s = this._getFinalPath(e), n = [], i = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    i !== "" && n.push(i);
    const a = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image" : "object", l = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {});
    l !== "" && n.push(l);
    let c = n.join("&");
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
    return R(this, void 0, void 0, function* () {
      try {
        return { data: yield Ds(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
      } catch (t) {
        if (O(t))
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
    return R(this, void 0, void 0, function* () {
      try {
        const n = Object.assign(Object.assign(Object.assign({}, cr), t), { prefix: e || "" });
        return { data: yield H(this.fetch, `${this.url}/object/list/${this.bucketId}`, n, { headers: this.headers }, s), error: null };
      } catch (n) {
        if (O(n))
          return { data: null, error: n };
        throw n;
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
const dr = "2.10.4", hr = { "X-Client-Info": `storage-js/${dr}` };
var ue = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
class fr {
  constructor(e, t = {}, s, n) {
    const i = new URL(e);
    n != null && n.useNewHostname && /supabase\.(co|in|red)$/.test(i.hostname) && !i.hostname.includes("storage.supabase.") && (i.hostname = i.hostname.replace("supabase.", "storage.supabase.")), this.url = i.href, this.headers = Object.assign(Object.assign({}, hr), t), this.fetch = Ls(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield Me(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
      } catch (e) {
        if (O(e))
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
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield Me(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
      } catch (t) {
        if (O(t))
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
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          type: t.type,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (O(s))
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
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield gt(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (O(s))
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
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield H(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (O(t))
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
    return ue(this, void 0, void 0, function* () {
      try {
        return { data: yield Ds(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (O(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class pr extends fr {
  constructor(e, t = {}, s, n) {
    super(e, t, s, n);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new ur(this.url, this.headers, e, this.fetch);
  }
}
const gr = "2.53.0";
let Se = "";
typeof Deno < "u" ? Se = "deno" : typeof document < "u" ? Se = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? Se = "react-native" : Se = "node";
const mr = { "X-Client-Info": `supabase-js-${Se}/${gr}` }, yr = {
  headers: mr
}, vr = {
  schema: "public"
}, br = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, _r = {};
var wr = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
const Sr = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = _s : e = fetch, (...t) => e(...t);
}, kr = () => typeof Headers > "u" ? ws : Headers, Er = (r, e, t) => {
  const s = Sr(t), n = kr();
  return (i, o) => wr(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : r;
    let c = new n(o == null ? void 0 : o.headers);
    return c.has("apikey") || c.set("apikey", r), c.has("Authorization") || c.set("Authorization", `Bearer ${l}`), s(i, Object.assign(Object.assign({}, o), { headers: c }));
  });
};
var Cr = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
function Tr(r) {
  return r.endsWith("/") ? r : r + "/";
}
function Ir(r, e) {
  var t, s;
  const { db: n, auth: i, realtime: o, global: a } = r, { db: l, auth: c, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, l), n),
    auth: Object.assign(Object.assign({}, c), i),
    realtime: Object.assign(Object.assign({}, u), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => Cr(this, void 0, void 0, function* () {
      return "";
    })
  };
  return r.accessToken ? h.accessToken = r.accessToken : delete h.accessToken, h;
}
const Ns = "2.71.1", ge = 30 * 1e3, mt = 3, st = mt * ge, Ar = "http://localhost:9999", Pr = "supabase.auth.token", xr = { "X-Client-Info": `gotrue-js/${Ns}` }, yt = "X-Supabase-Api-Version", Us = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, Or = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, jr = 10 * 60 * 1e3;
class jt extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function b(r) {
  return typeof r == "object" && r !== null && "__isAuthError" in r;
}
class $r extends jt {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function Rr(r) {
  return b(r) && r.name === "AuthApiError";
}
class Fs extends jt {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class Z extends jt {
  constructor(e, t, s, n) {
    super(e, s, n), this.name = t, this.status = s;
  }
}
class X extends Z {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Lr(r) {
  return b(r) && r.name === "AuthSessionMissingError";
}
class Re extends Z {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Le extends Z {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class De extends Z {
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
function Dr(r) {
  return b(r) && r.name === "AuthImplicitGrantRedirectError";
}
class ss extends Z {
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
class vt extends Z {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function nt(r) {
  return b(r) && r.name === "AuthRetryableFetchError";
}
class ns extends Z {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class bt extends Z {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Be = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), rs = ` 	
\r=`.split(""), Nr = (() => {
  const r = new Array(128);
  for (let e = 0; e < r.length; e += 1)
    r[e] = -1;
  for (let e = 0; e < rs.length; e += 1)
    r[rs[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Be.length; e += 1)
    r[Be[e].charCodeAt(0)] = e;
  return r;
})();
function is(r, e, t) {
  if (r !== null)
    for (e.queue = e.queue << 8 | r, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Be[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Be[s]), e.queuedBits -= 6;
    }
}
function Ms(r, e, t) {
  const s = Nr[r];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(r)}"`);
  }
}
function os(r) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, n = { queue: 0, queuedBits: 0 }, i = (o) => {
    Mr(o, s, t);
  };
  for (let o = 0; o < r.length; o += 1)
    Ms(r.charCodeAt(o), n, i);
  return e.join("");
}
function Ur(r, e) {
  if (r <= 127) {
    e(r);
    return;
  } else if (r <= 2047) {
    e(192 | r >> 6), e(128 | r & 63);
    return;
  } else if (r <= 65535) {
    e(224 | r >> 12), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  } else if (r <= 1114111) {
    e(240 | r >> 18), e(128 | r >> 12 & 63), e(128 | r >> 6 & 63), e(128 | r & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${r.toString(16)}`);
}
function Fr(r, e) {
  for (let t = 0; t < r.length; t += 1) {
    let s = r.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const n = (s - 55296) * 1024 & 65535;
      s = (r.charCodeAt(t + 1) - 56320 & 65535 | n) + 65536, t += 1;
    }
    Ur(s, e);
  }
}
function Mr(r, e, t) {
  if (e.utf8seq === 0) {
    if (r <= 127) {
      t(r);
      return;
    }
    for (let s = 1; s < 6; s += 1)
      if (!(r >> 7 - s & 1)) {
        e.utf8seq = s;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = r & 31;
    else if (e.utf8seq === 3)
      e.codepoint = r & 15;
    else if (e.utf8seq === 4)
      e.codepoint = r & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (r <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | r & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function Br(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (n) => {
    e.push(n);
  };
  for (let n = 0; n < r.length; n += 1)
    Ms(r.charCodeAt(n), t, s);
  return new Uint8Array(e);
}
function qr(r) {
  const e = [];
  return Fr(r, (t) => e.push(t)), new Uint8Array(e);
}
function zr(r) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (n) => {
    e.push(n);
  };
  return r.forEach((n) => is(n, t, s)), is(null, t, s), e.join("");
}
function Hr(r) {
  return Math.round(Date.now() / 1e3) + r;
}
function Vr() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(r) {
    const e = Math.random() * 16 | 0;
    return (r == "x" ? e : e & 3 | 8).toString(16);
  });
}
const U = () => typeof window < "u" && typeof document < "u", ee = {
  tested: !1,
  writable: !1
}, Bs = () => {
  if (!U())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (ee.tested)
    return ee.writable;
  const r = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(r, r), globalThis.localStorage.removeItem(r), ee.tested = !0, ee.writable = !0;
  } catch {
    ee.tested = !0, ee.writable = !1;
  }
  return ee.writable;
};
function Wr(r) {
  const e = {}, t = new URL(r);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((n, i) => {
        e[i] = n;
      });
    } catch {
    }
  return t.searchParams.forEach((s, n) => {
    e[n] = s;
  }), e;
}
const qs = (r) => {
  let e;
  return r ? e = r : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => be).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Kr = (r) => typeof r == "object" && r !== null && "status" in r && "ok" in r && "json" in r && typeof r.json == "function", me = async (r, e, t) => {
  await r.setItem(e, JSON.stringify(t));
}, te = async (r, e) => {
  const t = await r.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, G = async (r, e) => {
  await r.removeItem(e);
};
class Ye {
  constructor() {
    this.promise = new Ye.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
Ye.promiseConstructor = Promise;
function rt(r) {
  const e = r.split(".");
  if (e.length !== 3)
    throw new bt("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!Or.test(e[s]))
      throw new bt("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(os(e[0])),
    payload: JSON.parse(os(e[1])),
    signature: Br(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Jr(r) {
  return await new Promise((e) => {
    setTimeout(() => e(null), r);
  });
}
function Gr(r, e) {
  return new Promise((s, n) => {
    (async () => {
      for (let i = 0; i < 1 / 0; i++)
        try {
          const o = await r(i);
          if (!e(i, null, o)) {
            s(o);
            return;
          }
        } catch (o) {
          if (!e(i, o)) {
            n(o);
            return;
          }
        }
    })();
  });
}
function Xr(r) {
  return ("0" + r.toString(16)).substr(-2);
}
function Yr() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let n = "";
    for (let i = 0; i < 56; i++)
      n += t.charAt(Math.floor(Math.random() * s));
    return n;
  }
  return crypto.getRandomValues(e), Array.from(e, Xr).join("");
}
async function Qr(r) {
  const t = new TextEncoder().encode(r), s = await crypto.subtle.digest("SHA-256", t), n = new Uint8Array(s);
  return Array.from(n).map((i) => String.fromCharCode(i)).join("");
}
async function Zr(r) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), r;
  const t = await Qr(r);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function de(r, e, t = !1) {
  const s = Yr();
  let n = s;
  t && (n += "/PASSWORD_RECOVERY"), await me(r, `${e}-code-verifier`, n);
  const i = await Zr(s);
  return [i, s === i ? "plain" : "s256"];
}
const ei = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function ti(r) {
  const e = r.headers.get(yt);
  if (!e || !e.match(ei))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function si(r) {
  if (!r)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (r <= e)
    throw new Error("JWT has expired");
}
function ni(r) {
  switch (r) {
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
const ri = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function he(r) {
  if (!ri.test(r))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function it() {
  const r = {};
  return new Proxy(r, {
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
function as(r) {
  return JSON.parse(JSON.stringify(r));
}
var ii = function(r, e) {
  var t = {};
  for (var s in r) Object.prototype.hasOwnProperty.call(r, s) && e.indexOf(s) < 0 && (t[s] = r[s]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, s = Object.getOwnPropertySymbols(r); n < s.length; n++)
      e.indexOf(s[n]) < 0 && Object.prototype.propertyIsEnumerable.call(r, s[n]) && (t[s[n]] = r[s[n]]);
  return t;
};
const se = (r) => r.msg || r.message || r.error_description || r.error || JSON.stringify(r), oi = [502, 503, 504];
async function ls(r) {
  var e;
  if (!Kr(r))
    throw new vt(se(r), 0);
  if (oi.includes(r.status))
    throw new vt(se(r), r.status);
  let t;
  try {
    t = await r.json();
  } catch (i) {
    throw new Fs(se(i), i);
  }
  let s;
  const n = ti(r);
  if (n && n.getTime() >= Us["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new ns(se(t), r.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new X();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((i, o) => i && typeof o == "string", !0))
    throw new ns(se(t), r.status, t.weak_password.reasons);
  throw new $r(se(t), r.status || 500, s);
}
const ai = (r, e, t, s) => {
  const n = { method: r, headers: (e == null ? void 0 : e.headers) || {} };
  return r === "GET" ? n : (n.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), n.body = JSON.stringify(s), Object.assign(Object.assign({}, n), t));
};
async function S(r, e, t, s) {
  var n;
  const i = Object.assign({}, s == null ? void 0 : s.headers);
  i[yt] || (i[yt] = Us["2024-01-01"].name), s != null && s.jwt && (i.Authorization = `Bearer ${s.jwt}`);
  const o = (n = s == null ? void 0 : s.query) !== null && n !== void 0 ? n : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await li(r, e, t + a, {
    headers: i,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function li(r, e, t, s, n, i) {
  const o = ai(e, s, n, i);
  let a;
  try {
    a = await r(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new vt(se(l), 0);
  }
  if (a.ok || await ls(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await ls(l);
  }
}
function B(r) {
  var e;
  let t = null;
  hi(r) && (t = Object.assign({}, r), r.expires_at || (t.expires_at = Hr(r.expires_in)));
  const s = (e = r.user) !== null && e !== void 0 ? e : r;
  return { data: { session: t, user: s }, error: null };
}
function cs(r) {
  const e = B(r);
  return !e.error && r.weak_password && typeof r.weak_password == "object" && Array.isArray(r.weak_password.reasons) && r.weak_password.reasons.length && r.weak_password.message && typeof r.weak_password.message == "string" && r.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = r.weak_password), e;
}
function Y(r) {
  var e;
  return { data: { user: (e = r.user) !== null && e !== void 0 ? e : r }, error: null };
}
function ci(r) {
  return { data: r, error: null };
}
function ui(r) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: n, verification_type: i } = r, o = ii(r, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: n,
    verification_type: i
  }, l = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: l
    },
    error: null
  };
}
function di(r) {
  return r;
}
function hi(r) {
  return r.access_token && r.refresh_token && r.expires_in;
}
const ot = ["global", "local", "others"];
var fi = function(r, e) {
  var t = {};
  for (var s in r) Object.prototype.hasOwnProperty.call(r, s) && e.indexOf(s) < 0 && (t[s] = r[s]);
  if (r != null && typeof Object.getOwnPropertySymbols == "function")
    for (var n = 0, s = Object.getOwnPropertySymbols(r); n < s.length; n++)
      e.indexOf(s[n]) < 0 && Object.prototype.propertyIsEnumerable.call(r, s[n]) && (t[s[n]] = r[s[n]]);
  return t;
};
class pi {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = qs(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = ot[0]) {
    if (ot.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${ot.join(", ")}`);
    try {
      return await S(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (s) {
      if (b(s))
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
        xform: Y
      });
    } catch (s) {
      if (b(s))
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
      const { options: t } = e, s = fi(e, ["options"]), n = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (n.new_email = s == null ? void 0 : s.newEmail, delete n.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: n,
        headers: this.headers,
        xform: ui,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (b(t))
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
        xform: Y
      });
    } catch (t) {
      if (b(t))
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
    var t, s, n, i, o, a, l;
    try {
      const c = { nextPage: null, lastPage: 0, total: 0 }, u = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (i = (n = e == null ? void 0 : e.perPage) === null || n === void 0 ? void 0 : n.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: di
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((p) => {
        const y = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        c[`${g}Page`] = y;
      }), c.total = parseInt(h)), { data: Object.assign(Object.assign({}, d), c), error: null };
    } catch (c) {
      if (b(c))
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
    he(e);
    try {
      return await S(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: Y
      });
    } catch (t) {
      if (b(t))
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
    he(e);
    try {
      return await S(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: Y
      });
    } catch (s) {
      if (b(s))
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
    he(e);
    try {
      return await S(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: Y
      });
    } catch (s) {
      if (b(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    he(e.userId);
    try {
      const { data: t, error: s } = await S(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (n) => ({ data: { factors: n }, error: null })
      });
      return { data: t, error: s };
    } catch (t) {
      if (b(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    he(e.userId), he(e.id);
    try {
      return { data: await S(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (b(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
function us(r = {}) {
  return {
    getItem: (e) => r[e] || null,
    setItem: (e, t) => {
      r[e] = t;
    },
    removeItem: (e) => {
      delete r[e];
    }
  };
}
function gi() {
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
const fe = {
  /**
   * @experimental
   */
  debug: !!(globalThis && Bs() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class zs extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class mi extends zs {
}
async function yi(r, e, t) {
  fe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", r, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), fe.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", r);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(r, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (n) => {
    if (n) {
      fe.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", r, n.name);
      try {
        return await t();
      } finally {
        fe.debug && console.log("@supabase/gotrue-js: navigatorLock: released", r, n.name);
      }
    } else {
      if (e === 0)
        throw fe.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", r), new mi(`Acquiring an exclusive Navigator LockManager lock "${r}" immediately failed`);
      if (fe.debug)
        try {
          const i = await globalThis.navigator.locks.query();
          console.log("@supabase/gotrue-js: Navigator LockManager state", JSON.stringify(i, null, "  "));
        } catch (i) {
          console.warn("@supabase/gotrue-js: Error when querying Navigator LockManager state", i);
        }
      return console.warn("@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request"), await t();
    }
  }));
}
gi();
const vi = {
  url: Ar,
  storageKey: Pr,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: xr,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function ds(r, e, t) {
  return await t();
}
const pe = {};
class Ae {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = Ae.nextInstanceID, Ae.nextInstanceID += 1, this.instanceID > 0 && U() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const n = Object.assign(Object.assign({}, vi), e);
    if (this.logDebugMessages = !!n.debug, typeof n.debug == "function" && (this.logger = n.debug), this.persistSession = n.persistSession, this.storageKey = n.storageKey, this.autoRefreshToken = n.autoRefreshToken, this.admin = new pi({
      url: n.url,
      headers: n.headers,
      fetch: n.fetch
    }), this.url = n.url, this.headers = n.headers, this.fetch = qs(n.fetch), this.lock = n.lock || ds, this.detectSessionInUrl = n.detectSessionInUrl, this.flowType = n.flowType, this.hasCustomAuthorizationHeader = n.hasCustomAuthorizationHeader, n.lock ? this.lock = n.lock : U() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = yi : this.lock = ds, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (n.storage ? this.storage = n.storage : Bs() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = us(this.memoryStorage)), n.userStorage && (this.userStorage = n.userStorage)) : (this.memoryStorage = {}, this.storage = us(this.memoryStorage)), U() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
      try {
        this.broadcastChannel = new globalThis.BroadcastChannel(this.storageKey);
      } catch (i) {
        console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available", i);
      }
      (s = this.broadcastChannel) === null || s === void 0 || s.addEventListener("message", async (i) => {
        this._debug("received broadcast notification from other tab or client", i), await this._notifyAllSubscribers(i.data.event, i.data.session, !1);
      });
    }
    this.initialize();
  }
  /**
   * The JWKS used for verifying asymmetric JWTs
   */
  get jwks() {
    var e, t;
    return (t = (e = pe[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    pe[this.storageKey] = Object.assign(Object.assign({}, pe[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = pe[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    pe[this.storageKey] = Object.assign(Object.assign({}, pe[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Ns}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = Wr(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), U() && this.detectSessionInUrl && s !== "none") {
        const { data: n, error: i } = await this._getSessionFromURL(t, s);
        if (i) {
          if (this._debug("#_initialize()", "error detecting session from URL", i), Dr(i)) {
            const l = (e = i.details) === null || e === void 0 ? void 0 : e.code;
            if (l === "identity_already_exists" || l === "identity_not_found" || l === "single_identity_not_deletable")
              return { error: i };
          }
          return await this._removeSession(), { error: i };
        }
        const { session: o, redirectType: a } = n;
        return this._debug("#_initialize()", "detected session in URL", o, "redirect type", a), await this._saveSession(o), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o) : await this._notifyAllSubscribers("SIGNED_IN", o);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return b(t) ? { error: t } : {
        error: new Fs("Unexpected error during initialization", t)
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
    var t, s, n;
    try {
      const i = await S(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (n = e == null ? void 0 : e.options) === null || n === void 0 ? void 0 : n.captchaToken }
        },
        xform: B
      }), { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (i) {
      if (b(i))
        return { data: { user: null, session: null }, error: i };
      throw i;
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
    var t, s, n;
    try {
      let i;
      if ("email" in e) {
        const { email: u, password: d, options: h } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await de(this.storage, this.storageKey)), i = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: h == null ? void 0 : h.emailRedirectTo,
          body: {
            email: u,
            password: d,
            data: (t = h == null ? void 0 : h.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken },
            code_challenge: f,
            code_challenge_method: p
          },
          xform: B
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: h } = e;
        i = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (s = h == null ? void 0 : h.data) !== null && s !== void 0 ? s : {},
            channel: (n = h == null ? void 0 : h.channel) !== null && n !== void 0 ? n : "sms",
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken }
          },
          xform: B
        });
      } else
        throw new Le("You must provide either an email or phone number and a password");
      const { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (i) {
      if (b(i))
        return { data: { user: null, session: null }, error: i };
      throw i;
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
        const { email: i, password: o, options: a } = e;
        t = await S(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: i,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: cs
        });
      } else if ("phone" in e) {
        const { phone: i, password: o, options: a } = e;
        t = await S(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: i,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: cs
        });
      } else
        throw new Le("You must provide either an email or phone number and a password");
      const { data: s, error: n } = t;
      return n ? { data: { user: null, session: null }, error: n } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new Re() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: n
      });
    } catch (t) {
      if (b(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Log in an existing user via a third-party provider.
   * This method supports the PKCE flow.
   */
  async signInWithOAuth(e) {
    var t, s, n, i;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (s = e.options) === null || s === void 0 ? void 0 : s.scopes,
      queryParams: (n = e.options) === null || n === void 0 ? void 0 : n.queryParams,
      skipBrowserRedirect: (i = e.options) === null || i === void 0 ? void 0 : i.skipBrowserRedirect
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
    var t, s, n, i, o, a, l, c, u, d, h, f;
    let p, y;
    if ("message" in e)
      p = e.message, y = e.signature;
    else {
      const { chain: g, wallet: w, statement: C, options: v } = e;
      let _;
      if (U())
        if (typeof w == "object")
          _ = w;
        else {
          const k = window;
          if ("solana" in k && typeof k.solana == "object" && ("signIn" in k.solana && typeof k.solana.signIn == "function" || "signMessage" in k.solana && typeof k.solana.signMessage == "function"))
            _ = k.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof w != "object" || !(v != null && v.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        _ = w;
      }
      const I = new URL((t = v == null ? void 0 : v.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in _ && _.signIn) {
        const k = await _.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, v == null ? void 0 : v.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: I.host,
          uri: I.href
        }), C ? { statement: C } : null));
        let E;
        if (Array.isArray(k) && k[0] && typeof k[0] == "object")
          E = k[0];
        else if (k && typeof k == "object" && "signedMessage" in k && "signature" in k)
          E = k;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in E && "signature" in E && (typeof E.signedMessage == "string" || E.signedMessage instanceof Uint8Array) && E.signature instanceof Uint8Array)
          p = typeof E.signedMessage == "string" ? E.signedMessage : new TextDecoder().decode(E.signedMessage), y = E.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in _) || typeof _.signMessage != "function" || !("publicKey" in _) || typeof _ != "object" || !_.publicKey || !("toBase58" in _.publicKey) || typeof _.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${I.host} wants you to sign in with your Solana account:`,
          _.publicKey.toBase58(),
          ...C ? ["", C, ""] : [""],
          "Version: 1",
          `URI: ${I.href}`,
          `Issued At: ${(n = (s = v == null ? void 0 : v.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && n !== void 0 ? n : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((i = v == null ? void 0 : v.signInWithSolana) === null || i === void 0) && i.notBefore ? [`Not Before: ${v.signInWithSolana.notBefore}`] : [],
          ...!((o = v == null ? void 0 : v.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${v.signInWithSolana.expirationTime}`] : [],
          ...!((a = v == null ? void 0 : v.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${v.signInWithSolana.chainId}`] : [],
          ...!((l = v == null ? void 0 : v.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${v.signInWithSolana.nonce}`] : [],
          ...!((c = v == null ? void 0 : v.signInWithSolana) === null || c === void 0) && c.requestId ? [`Request ID: ${v.signInWithSolana.requestId}`] : [],
          ...!((d = (u = v == null ? void 0 : v.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...v.signInWithSolana.resources.map((E) => `- ${E}`)
          ] : []
        ].join(`
`);
        const k = await _.signMessage(new TextEncoder().encode(p), "utf8");
        if (!k || !(k instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        y = k;
      }
    }
    try {
      const { data: g, error: w } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: zr(y) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: B
      });
      if (w)
        throw w;
      return !g || !g.session || !g.user ? {
        data: { user: null, session: null },
        error: new Re()
      } : (g.session && (await this._saveSession(g.session), await this._notifyAllSubscribers("SIGNED_IN", g.session)), { data: Object.assign({}, g), error: w });
    } catch (g) {
      if (b(g))
        return { data: { user: null, session: null }, error: g };
      throw g;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await te(this.storage, `${this.storageKey}-code-verifier`), [s, n] = (t ?? "").split("/");
    try {
      const { data: i, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: B
      });
      if (await G(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !i || !i.session || !i.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new Re()
      } : (i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", i.session)), { data: Object.assign(Object.assign({}, i), { redirectType: n ?? null }), error: o });
    } catch (i) {
      if (b(i))
        return { data: { user: null, session: null, redirectType: null }, error: i };
      throw i;
    }
  }
  /**
   * Allows signing in with an OIDC ID token. The authentication provider used
   * should be enabled and configured.
   */
  async signInWithIdToken(e) {
    try {
      const { options: t, provider: s, token: n, access_token: i, nonce: o } = e, a = await S(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: n,
          access_token: i,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: B
      }), { data: l, error: c } = a;
      return c ? { data: { user: null, session: null }, error: c } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new Re()
      } : (l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), { data: l, error: c });
    } catch (t) {
      if (b(t))
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
    var t, s, n, i, o;
    try {
      if ("email" in e) {
        const { email: a, options: l } = e;
        let c = null, u = null;
        this.flowType === "pkce" && ([c, u] = await de(this.storage, this.storageKey));
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
            data: (n = l == null ? void 0 : l.data) !== null && n !== void 0 ? n : {},
            create_user: (i = l == null ? void 0 : l.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            channel: (o = l == null ? void 0 : l.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: c == null ? void 0 : c.message_id }, error: u };
      }
      throw new Le("You must provide either an email or phone number.");
    } catch (a) {
      if (b(a))
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
      let n, i;
      "options" in e && (n = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, i = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: i } }),
        redirectTo: n,
        xform: B
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const l = o.session, c = o.user;
      return l != null && l.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (n) {
      if (b(n))
        return { data: { user: null, session: null }, error: n };
      throw n;
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
    var t, s, n;
    try {
      let i = null, o = null;
      return this.flowType === "pkce" && ([i, o] = await de(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((n = e == null ? void 0 : e.options) === null || n === void 0) && n.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: i, code_challenge_method: o }),
        headers: this.headers,
        xform: ci
      });
    } catch (i) {
      if (b(i))
        return { data: null, error: i };
      throw i;
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
          throw new X();
        const { error: n } = await S(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: n };
      });
    } catch (e) {
      if (b(e))
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
        const { email: s, type: n, options: i } = e, { error: o } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: s,
            type: n,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          },
          redirectTo: i == null ? void 0 : i.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: o };
      } else if ("phone" in e) {
        const { phone: s, type: n, options: i } = e, { data: o, error: a } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: s,
            type: n,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new Le("You must provide either an email or phone number and a type");
    } catch (t) {
      if (b(t))
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
        const s = this.pendingInLock.length ? this.pendingInLock[this.pendingInLock.length - 1] : Promise.resolve(), n = (async () => (await s, await t()))();
        return this.pendingInLock.push((async () => {
          try {
            await n;
          } catch {
          }
        })()), n;
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
            const n = [...this.pendingInLock];
            await Promise.all(n), this.pendingInLock.splice(0, n.length);
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
      const t = await te(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < st : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await te(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = it();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (l, c, u) => (!o && c === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(l, c, u))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: n, error: i } = await this._callRefreshToken(e.refresh_token);
      return i ? { data: { session: null }, error: i } : { data: { session: n }, error: null };
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
        xform: Y
      }) : await this._useSession(async (t) => {
        var s, n, i;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new X() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (i = (n = o.session) === null || n === void 0 ? void 0 : n.access_token) !== null && i !== void 0 ? i : void 0,
          xform: Y
        });
      });
    } catch (t) {
      if (b(t))
        return Lr(t) && (await this._removeSession(), await G(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
        const { data: n, error: i } = s;
        if (i)
          throw i;
        if (!n.session)
          throw new X();
        const o = n.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await de(this.storage, this.storageKey));
        const { data: c, error: u } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: Y
        });
        if (u)
          throw u;
        return o.user = c.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
      });
    } catch (s) {
      if (b(s))
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
        throw new X();
      const t = Date.now() / 1e3;
      let s = t, n = !0, i = null;
      const { payload: o } = rt(e.access_token);
      if (o.exp && (s = o.exp, n = s <= t), n) {
        const { session: a, error: l } = await this._callRefreshToken(e.refresh_token);
        if (l)
          return { data: { user: null, session: null }, error: l };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        i = a;
      } else {
        const { data: a, error: l } = await this._getUser(e.access_token);
        if (l)
          throw l;
        i = {
          access_token: e.access_token,
          refresh_token: e.refresh_token,
          user: a.user,
          token_type: "bearer",
          expires_in: s - t,
          expires_at: s
        }, await this._saveSession(i), await this._notifyAllSubscribers("SIGNED_IN", i);
      }
      return { data: { user: i.user, session: i }, error: null };
    } catch (t) {
      if (b(t))
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
          throw new X();
        const { session: n, error: i } = await this._callRefreshToken(e.refresh_token);
        return i ? { data: { user: null, session: null }, error: i } : n ? { data: { user: n.user, session: n }, error: null } : { data: { user: null, session: null }, error: null };
      });
    } catch (t) {
      if (b(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!U())
        throw new De("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new De(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new ss("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new De("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new ss("No code detected.");
        const { data: C, error: v } = await this._exchangeCodeForSession(e.code);
        if (v)
          throw v;
        const _ = new URL(window.location.href);
        return _.searchParams.delete("code"), window.history.replaceState(window.history.state, "", _.toString()), { data: { session: C.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: n, access_token: i, refresh_token: o, expires_in: a, expires_at: l, token_type: c } = e;
      if (!i || !a || !o || !c)
        throw new De("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      l && (h = parseInt(l));
      const f = h - u;
      f * 1e3 <= ge && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const p = h - d;
      u - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, h, u) : u - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, h, u);
      const { data: y, error: g } = await this._getUser(i);
      if (g)
        throw g;
      const w = {
        provider_token: s,
        provider_refresh_token: n,
        access_token: i,
        expires_in: d,
        expires_at: h,
        refresh_token: o,
        token_type: c,
        user: y.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: w, redirectType: e.type }, error: null };
    } catch (s) {
      if (b(s))
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
    const t = await te(this.storage, `${this.storageKey}-code-verifier`);
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
      const { data: n, error: i } = t;
      if (i)
        return { error: i };
      const o = (s = n.session) === null || s === void 0 ? void 0 : s.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(Rr(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await G(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = Vr(), s = {
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
      var s, n;
      try {
        const { data: { session: i }, error: o } = t;
        if (o)
          throw o;
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", i)), this._debug("INITIAL_SESSION", "callback id", e, "session", i);
      } catch (i) {
        await ((n = this.stateChangeEmitters.get(e)) === null || n === void 0 ? void 0 : n.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", i), console.error(i);
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
    let s = null, n = null;
    this.flowType === "pkce" && ([s, n] = await de(
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
          code_challenge_method: n,
          gotrue_meta_security: { captcha_token: t.captchaToken }
        },
        headers: this.headers,
        redirectTo: t.redirectTo
      });
    } catch (i) {
      if (b(i))
        return { data: null, error: i };
      throw i;
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
      if (b(t))
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
      const { data: s, error: n } = await this._useSession(async (i) => {
        var o, a, l, c, u;
        const { data: d, error: h } = i;
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
      if (n)
        throw n;
      return U() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
    } catch (s) {
      if (b(s))
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
        var s, n;
        const { data: i, error: o } = t;
        if (o)
          throw o;
        return await S(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (n = (s = i.session) === null || s === void 0 ? void 0 : s.access_token) !== null && n !== void 0 ? n : void 0
        });
      });
    } catch (t) {
      if (b(t))
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
      return await Gr(async (n) => (n > 0 && await Jr(200 * Math.pow(2, n - 1)), this._debug(t, "refreshing attempt", n), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: B
      })), (n, i) => {
        const o = 200 * Math.pow(2, n);
        return i && nt(i) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < ge;
      });
    } catch (s) {
      if (this._debug(t, "error", s), b(s))
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), U() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
      const n = await te(this.storage, this.storageKey);
      if (n && this.userStorage) {
        let o = await te(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: n.user }, await me(this.userStorage, this.storageKey + "-user", o)), n.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : it();
      } else if (n && !n.user && !n.user) {
        const o = await te(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (n.user = o.user, await G(this.storage, this.storageKey + "-user"), await me(this.storage, this.storageKey, n)) : n.user = it();
      }
      if (this._debug(s, "session from storage", n), !this._isValidSession(n)) {
        this._debug(s, "session is not valid"), n !== null && await this._removeSession();
        return;
      }
      const i = ((t = n.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < st;
      if (this._debug(s, `session has${i ? "" : " not"} expired with margin of ${st}s`), i) {
        if (this.autoRefreshToken && n.refresh_token) {
          const { error: o } = await this._callRefreshToken(n.refresh_token);
          o && (console.error(o), nt(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
        }
      } else if (n.user && n.user.__isUserNotAvailableProxy === !0)
        try {
          const { data: o, error: a } = await this._getUser(n.access_token);
          !a && (o != null && o.user) ? (n.user = o.user, await this._saveSession(n), await this._notifyAllSubscribers("SIGNED_IN", n)) : this._debug(s, "could not get user data, skipping SIGNED_IN notification");
        } catch (o) {
          console.error("Error getting user data:", o), this._debug(s, "error getting user data, skipping SIGNED_IN notification", o);
        }
      else
        await this._notifyAllSubscribers("SIGNED_IN", n);
    } catch (n) {
      this._debug(s, "error", n), console.error(n);
      return;
    } finally {
      this._debug(s, "end");
    }
  }
  async _callRefreshToken(e) {
    var t, s;
    if (!e)
      throw new X();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const n = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(n, "begin");
    try {
      this.refreshingDeferred = new Ye();
      const { data: i, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!i.session)
        throw new X();
      await this._saveSession(i.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", i.session);
      const a = { session: i.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (i) {
      if (this._debug(n, "error", i), b(i)) {
        const o = { session: null, error: i };
        return nt(i) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
      }
      throw (s = this.refreshingDeferred) === null || s === void 0 || s.reject(i), i;
    } finally {
      this.refreshingDeferred = null, this._debug(n, "end");
    }
  }
  async _notifyAllSubscribers(e, t, s = !0) {
    const n = `#_notifyAllSubscribers(${e})`;
    this._debug(n, "begin", t, `broadcast = ${s}`);
    try {
      this.broadcastChannel && s && this.broadcastChannel.postMessage({ event: e, session: t });
      const i = [], o = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (l) {
          i.push(l);
        }
      });
      if (await Promise.all(o), i.length > 0) {
        for (let a = 0; a < i.length; a += 1)
          console.error(i[a]);
        throw i[0];
      }
    } finally {
      this._debug(n, "end");
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
      !s && t.user && await me(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const n = Object.assign({}, t);
      delete n.user;
      const i = as(n);
      await me(this.storage, this.storageKey, i);
    } else {
      const n = as(t);
      await me(this.storage, this.storageKey, n);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await G(this.storage, this.storageKey), await G(this.storage, this.storageKey + "-code-verifier"), await G(this.storage, this.storageKey + "-user"), this.userStorage && await G(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && U() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), ge);
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
              const n = Math.floor((s.expires_at * 1e3 - e) / ge);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${n} ticks, a tick lasts ${ge}ms, refresh threshold is ${mt} ticks`), n <= mt && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof zs)
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
    if (this._debug("#_handleVisibilityChange()"), !U() || !(window != null && window.addEventListener))
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
    const n = [`provider=${encodeURIComponent(t)}`];
    if (s != null && s.redirectTo && n.push(`redirect_to=${encodeURIComponent(s.redirectTo)}`), s != null && s.scopes && n.push(`scopes=${encodeURIComponent(s.scopes)}`), this.flowType === "pkce") {
      const [i, o] = await de(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(i)}`,
        code_challenge_method: `${encodeURIComponent(o)}`
      });
      n.push(a.toString());
    }
    if (s != null && s.queryParams) {
      const i = new URLSearchParams(s.queryParams);
      n.push(i.toString());
    }
    return s != null && s.skipBrowserRedirect && n.push(`skip_http_redirect=${s.skipBrowserRedirect}`), `${e}?${n.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s;
        const { data: n, error: i } = t;
        return i ? { data: null, error: i } : await S(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
      });
    } catch (t) {
      if (b(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _enroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s, n;
        const { data: i, error: o } = t;
        if (o)
          return { data: null, error: o };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: c } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return c ? { data: null, error: c } : (e.factorType === "totp" && (!((n = l == null ? void 0 : l.totp) === null || n === void 0) && n.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), { data: l, error: null });
      });
    } catch (t) {
      if (b(t))
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
          const { data: n, error: i } = t;
          if (i)
            return { data: null, error: i };
          const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), { data: o, error: a });
        });
      } catch (t) {
        if (b(t))
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
          const { data: n, error: i } = t;
          return i ? { data: null, error: i } : await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
          });
        });
      } catch (t) {
        if (b(t))
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
    const s = (e == null ? void 0 : e.factors) || [], n = s.filter((o) => o.factor_type === "totp" && o.status === "verified"), i = s.filter((o) => o.factor_type === "phone" && o.status === "verified");
    return {
      data: {
        all: s,
        totp: n,
        phone: i
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
      const { data: { session: n }, error: i } = e;
      if (i)
        return { data: null, error: i };
      if (!n)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: o } = rt(n.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let l = a;
      ((s = (t = n.user.factors) === null || t === void 0 ? void 0 : t.filter((d) => d.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (l = "aal2");
      const u = o.amr || [];
      return { data: { currentLevel: a, nextLevel: l, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((a) => a.kid === e);
    if (s)
      return s;
    const n = Date.now();
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + jr > n)
      return s;
    const { data: i, error: o } = await S(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (o)
      throw o;
    return !i.keys || i.keys.length === 0 || (this.jwks = i, this.jwks_cached_at = n, s = i.keys.find((a) => a.kid === e), !s) ? null : s;
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
      const { header: n, payload: i, signature: o, raw: { header: a, payload: l } } = rt(s);
      t != null && t.allowExpired || si(i.exp);
      const c = !n.alg || n.alg.startsWith("HS") || !n.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(n.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!c) {
        const { error: f } = await this.getUser(s);
        if (f)
          throw f;
        return {
          data: {
            claims: i,
            header: n,
            signature: o
          },
          error: null
        };
      }
      const u = ni(n.alg), d = await crypto.subtle.importKey("jwk", c, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, d, o, qr(`${a}.${l}`)))
        throw new bt("Invalid JWT signature");
      return {
        data: {
          claims: i,
          header: n,
          signature: o
        },
        error: null
      };
    } catch (s) {
      if (b(s))
        return { data: null, error: s };
      throw s;
    }
  }
}
Ae.nextInstanceID = 0;
const bi = Ae;
class _i extends bi {
  constructor(e) {
    super(e);
  }
}
var wi = function(r, e, t, s) {
  function n(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : n(u.value).then(a, l);
    }
    c((s = s.apply(r, e || [])).next());
  });
};
class Si {
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
    var n, i, o;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = Tr(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const c = `sb-${l.hostname.split(".")[0]}-auth-token`, u = {
      db: vr,
      realtime: _r,
      auth: Object.assign(Object.assign({}, br), { storageKey: c }),
      global: yr
    }, d = Ir(s ?? {}, u);
    this.storageKey = (n = d.auth.storageKey) !== null && n !== void 0 ? n : "", this.headers = (i = d.global.headers) !== null && i !== void 0 ? i : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = d.auth) !== null && o !== void 0 ? o : {}, this.headers, d.global.fetch), this.fetch = Er(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new Mn(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), this.storage = new pr(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new gn(this.functionsUrl.href, {
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
    return wi(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: n, storageKey: i, flowType: o, lock: a, debug: l }, c, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new _i({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), c),
      storageKey: i,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: s,
      storage: n,
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
    return new tr(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const ki = (r, e, t) => new Si(r, e, t);
function Ei() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const r = process.version.match(/^v(\d+)\./);
  return r ? parseInt(r[1], 10) <= 18 : !1;
}
Ei() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class $t {
  constructor(e, t) {
    m(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", n = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = ki(s, n);
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
      const { data: n, error: i } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: { ...e, config: s }
        }
      );
      return i ? (console.error(
        "Error calling cart-checkout-session function:",
        i
      ), null) : n;
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
const Qe = "assistantAnalyticsPayload", Ci = "ei_enhanced_insights", Ce = "ei_analytics", Rt = "ei_insights", _t = "ei_analytics_consent", Ti = 3500, Ii = 10, Ai = 3, Pi = 50, xi = 100, Oi = 8, ji = [
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
], $i = [
  "attribution_history",
  "touch_count",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_landing_page",
  "first_referrer",
  "first_date_visited",
  "enhanced_insights"
], Ri = 30 * 60 * 1e3;
function Li(r) {
  let e = 0, t = -1 / 0;
  const s = r.filter((n) => typeof n.enteredAt == "number").sort((n, i) => n.enteredAt - i.enteredAt);
  for (const n of s)
    n.enteredAt - t > Ri && (e += 1), t = Math.max(n.enteredAt, n.enteredAt + wt(n));
  return e;
}
function Di() {
  try {
    if (typeof navigator > "u") return null;
    const r = String(navigator.userAgent ?? "");
    if (/ipad|tablet|playbook|silk/i.test(r) || /android(?!.*mobile)/i.test(r)) return "tablet";
    const e = navigator.userAgentData;
    return e && typeof e.mobile == "boolean" ? e.mobile ? "mobile" : "desktop" : /mobi|iphone|ipod|android|windows phone|opera mini/i.test(r) ? "mobile" : r ? "desktop" : null;
  } catch {
    return null;
  }
}
function wt(r) {
  return typeof r.activeMs == "number" && r.activeMs > 0 ? r.activeMs : typeof r.leftAt == "number" && r.leftAt > r.enteredAt ? r.leftAt - r.enteredAt : 0;
}
let oe = {}, ye = null, Pe = !0, hs = !1, q;
const Hs = [];
function Vs(r) {
  if (typeof document > "u") return [];
  const e = r + "=", t = [];
  for (const s of ("; " + document.cookie).split("; ")) {
    if (s.slice(0, e.length) !== e) continue;
    const n = s.slice(e.length).split(";")[0];
    if (n)
      try {
        t.push(decodeURIComponent(n));
      } catch {
      }
  }
  return t;
}
function Ws() {
  if (q !== void 0) return q;
  q = null;
  try {
    if (oe.cookieDomain)
      return q = oe.cookieDomain.replace(/^\./, ""), q;
    const r = window.location.hostname;
    if (!r || /^[\d.]+$/.test(r) || r === "localhost")
      return null;
    const e = r.split("."), t = "ei_domain_probe";
    for (let s = e.length - 2; s >= 0; s--) {
      const n = e.slice(s).join(".");
      if (document.cookie = `${t}=1; domain=.${n}; path=/; SameSite=Lax`, document.cookie.indexOf(`${t}=1`) !== -1)
        return document.cookie = `${t}=; domain=.${n}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`, q = n, q;
    }
  } catch {
  }
  return q;
}
function Te(r, e) {
  try {
    const t = encodeURIComponent(JSON.stringify(e));
    if (t.length > Ti) return !1;
    const s = Ws(), n = window.location.protocol === "https:" ? "; Secure" : "";
    return document.cookie = `${r}=${t}` + (s ? `; domain=.${s}` : "") + `; path=/; SameSite=Lax${n}`, !0;
  } catch {
    return !1;
  }
}
function St(r) {
  try {
    const e = Ws();
    document.cookie = `${r}=` + (e ? `; domain=.${e}` : "") + "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
  }
}
function Ks(r) {
  const e = [];
  for (const t of Vs(r))
    try {
      const s = JSON.parse(t);
      s && typeof s == "object" && !Array.isArray(s) && e.push(s);
    } catch {
    }
  return e;
}
function Js() {
  const r = {};
  for (const e of Ks(Rt))
    for (const [t, s] of Object.entries(e)) {
      if (!s || typeof s != "object" || Array.isArray(s))
        continue;
      const n = r[t];
      n && String(s.last_visit_at ?? "") <= String(n.last_visit_at ?? "") || (r[t] = s);
    }
  return r;
}
function Ni(r) {
  if (Te(Ce, r)) return;
  const e = qe(r);
  for (let t = e.length - 1; t >= 2; t--) {
    const s = [e[0], ...e.slice(-(t - 1))];
    if (Te(Ce, Et(s)))
      return;
  }
  e.length > 1 && Te(
    Ce,
    Et([e[0], e[e.length - 1]])
  );
}
function Ui() {
  St(Ce);
}
function Fi() {
  const r = Ks(Ce);
  if (r.length === 0) return null;
  const e = (n) => {
    const i = qe(n), o = i[0], a = o && typeof o.date_visited == "string" ? o.date_visited : "";
    return { touches: i.length, at: a };
  };
  let t = r[0], s = e(t);
  for (const n of r.slice(1)) {
    const i = e(n);
    (i.touches > s.touches || i.touches === s.touches && !!i.at && (!s.at || i.at < s.at)) && (t = n, s = i);
  }
  return t;
}
function Mi() {
  const r = en();
  if (!r) return null;
  const { visits: e, time_per_page: t, ...s } = r, n = {};
  return Object.entries(t ?? {}).sort((i, o) => o[1] - i[1]).slice(0, Ii).forEach(([i, o]) => {
    n[i] = o;
  }), { ...s, time_per_page: n };
}
function Bi() {
  try {
    if (typeof window > "u" || oe.shareInsightsAcrossSubdomains === !1 || !Ze())
      return;
    const r = Mi();
    if (!r) return;
    const e = window.location.hostname, t = Js();
    let s = Object.entries(t).filter(([i, o]) => i !== e && o && typeof o == "object").sort(
      (i, o) => {
        var a, l;
        return String(((a = i[1]) == null ? void 0 : a.last_visit_at) ?? "").localeCompare(
          String(((l = o[1]) == null ? void 0 : l.last_visit_at) ?? "")
        );
      }
    );
    s = s.slice(
      Math.max(0, s.length - (Ai - 1))
    );
    let n = r;
    for (; ; ) {
      const i = {};
      for (const [a, l] of s) i[a] = l;
      if (i[e] = n, Te(Rt, i)) return;
      if (s.length > 0) {
        s = s.slice(1);
        continue;
      }
      if (n.time_per_page) {
        const { time_per_page: a, ...l } = n;
        n = l;
        continue;
      }
      const o = typeof n.pages == "string" ? n.pages : "";
      if (o) {
        const a = o.split(",");
        n = {
          ...n,
          pages: a.slice(Math.ceil(a.length / 2)).join(",")
        };
        continue;
      }
      return;
    }
  } catch {
  }
}
function qi() {
  if (typeof window > "u") return [];
  const r = Js(), e = window.location.hostname;
  return Object.entries(r).filter(
    ([t, s]) => t !== e && s && typeof s == "object" && !Array.isArray(s)
  ).map(([, t]) => t);
}
function zi(r, e) {
  if (e.length === 0) return r;
  const t = r ? [r, ...e] : e, s = (h) => typeof h == "number" && isFinite(h) ? h : 0;
  let n = 0, i = 0, o = 0;
  const a = [], l = {};
  let c = null, u = null;
  for (const h of t) {
    n += s(h.visit_count), i += s(h.session_count), o += s(h.total_time_seconds), typeof h.pages == "string" && h.pages.split(",").forEach((g) => {
      g && a.indexOf(g) === -1 && a.push(g);
    });
    const f = h.time_per_page;
    if (f && typeof f == "object" && !Array.isArray(f))
      for (const [g, w] of Object.entries(
        f
      ))
        l[g] = (l[g] ?? 0) + s(w);
    const p = typeof h.first_visit_at == "string" ? h.first_visit_at : null, y = typeof h.last_visit_at == "string" ? h.last_visit_at : null;
    p && (!c || p < c) && (c = p), y && (!u || y > u) && (u = y);
  }
  const d = {
    time_per_page: l,
    visit_count: n,
    unique_pages: a.length,
    total_time_seconds: o,
    pages: a.join(",")
  };
  return t.every((h) => typeof h.session_count == "number") && (d.session_count = i), c && (d.first_visit_at = c), u && (d.last_visit_at = u), r && Array.isArray(r.visits) && (d.visits = r.visits), d;
}
function Gs() {
  try {
    const r = window, e = r.Cookiebot;
    if (e && e.consent && typeof e.consent.statistics == "boolean" && e.hasResponse)
      return !!(e.consent.statistics || e.consent.marketing);
    if (typeof r.OnetrustActiveGroups == "string" && r.OnetrustActiveGroups)
      return /C0002|C0004/.test(r.OnetrustActiveGroups);
  } catch {
  }
  return null;
}
function Hi() {
  if (hs || typeof window > "u") return;
  hs = !0;
  const r = () => {
    const e = Gs();
    e === !0 ? Ie(!0) : e === !1 && Ie(!1);
  };
  try {
    window.addEventListener("CookiebotOnConsentReady", r), window.addEventListener("CookiebotOnAccept", r), window.addEventListener("CookiebotOnDecline", r), window.addEventListener("OneTrustGroupsUpdated", r);
    const e = window.__tcfapi;
    typeof e == "function" && e("addEventListener", 2, (t, s) => {
      var n, i;
      !s || !t || (t.eventStatus === "tcloaded" || t.eventStatus === "useractioncomplete") && Ie(!!((i = (n = t.purpose) == null ? void 0 : n.consents) != null && i[1]));
    });
  } catch {
  }
}
function Ze() {
  return Xs() ? !1 : !oe.requireConsent || Pe;
}
function Xs() {
  return Vs(_t).indexOf("0") !== -1;
}
function Ys(r) {
  Hs.push(r);
}
function Ie(r) {
  const e = r !== Pe;
  if (Pe = r, r)
    St(_t), Qs();
  else {
    Te(_t, 0), Ui(), St(Rt);
    try {
      sessionStorage.removeItem(Qe);
    } catch {
    }
  }
  if (e)
    for (const t of Hs)
      try {
        t(r);
      } catch {
      }
}
function Vi() {
  const r = {};
  for (const [e, t] of new URL(
    window.location.href
  ).searchParams.entries())
    r[e] = t;
  return {
    ...r,
    landing_page: window.location.origin + window.location.pathname,
    date_visited: (/* @__PURE__ */ new Date()).toISOString(),
    referrer: document.referrer
  };
}
function kt(r) {
  return ji.filter((e) => r[e] !== void 0).map((e) => e + "=" + String(r[e])).join("&");
}
function qe(r) {
  if (!r) return [];
  const e = r.attribution_history;
  if (Array.isArray(e))
    return e.filter(
      (s) => !!s && typeof s == "object" && !Array.isArray(s)
    );
  const t = {};
  for (const [s, n] of Object.entries(r))
    $i.indexOf(s) === -1 && (t[s] = n);
  return Object.keys(t).length > 0 ? [t] : [];
}
function Wi(...r) {
  const e = /* @__PURE__ */ new Set(), t = [];
  for (const s of r)
    for (const n of s) {
      const i = String(n.date_visited ?? "") + "|" + kt(n);
      e.has(i) || (e.add(i), t.push(n));
    }
  return t.sort(
    (s, n) => String(s.date_visited ?? "").localeCompare(String(n.date_visited ?? ""))
  );
}
function Ki(r) {
  return r.length <= Oi ? r : [r[0], ...r.slice(-7)];
}
function Ji(r, e) {
  if (r.length === 0) return [e];
  const t = kt(e);
  return !t || t === kt(r[r.length - 1]) ? r : Ki([...r, e]);
}
function Et(r) {
  if (r.length === 0) return {};
  const e = r[0], s = { ...r[r.length - 1] }, n = (i, o) => {
    e[o] !== void 0 && (s[i] = e[o]);
  };
  return n("first_utm_source", "utm_source"), n("first_utm_medium", "utm_medium"), n("first_utm_campaign", "utm_campaign"), n("first_landing_page", "landing_page"), n("first_referrer", "referrer"), n("first_date_visited", "date_visited"), s.touch_count = r.length, s.attribution_history = r, s;
}
function Qs() {
  if (!(typeof window > "u" || !ye) && !Xs())
    try {
      window.sessionStorage && sessionStorage.setItem(
        Qe,
        JSON.stringify(ye)
      ), Ni(ye);
    } catch {
    }
}
function Gi(r) {
  if (!(typeof window > "u")) {
    oe = r ?? {}, q = void 0;
    try {
      const e = window.sessionStorage ? sessionStorage.getItem(Qe) : null;
      let t = null;
      if (e) {
        const n = JSON.parse(e);
        n && typeof n == "object" && !Array.isArray(n) && (t = n);
      }
      const s = Ji(
        Wi(
          qe(t),
          qe(Fi())
        ),
        Vi()
      );
      if (ye = Et(s), oe.requireConsent) {
        Hi();
        const n = Gs();
        n === null ? Pe = !1 : Ie(n);
      } else
        Pe = !0, Qs();
    } catch {
    }
  }
}
function Zs(r) {
  let e = r.trim();
  if (!e) return "";
  const t = e.search(/[?#]/);
  return t >= 0 && (e = e.slice(0, t)), e.startsWith("/") || (e = "/" + e), e.length > 1 && e.endsWith("/") && (e = e.slice(0, -1)), e;
}
function Xi(r) {
  return Zs(r).replace(/\./g, "_");
}
function en() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const r = window.localStorage.getItem(Ci);
    if (!r) return null;
    const e = JSON.parse(r), t = Array.isArray(e == null ? void 0 : e.visits) ? e.visits.filter(
      (c) => c && typeof c.page == "string" && typeof c.enteredAt == "number"
    ) : [], s = t[0], n = t[t.length - 1];
    if (!s || !n) return null;
    const i = [];
    for (const c of t) {
      const u = Zs(c.page);
      u && i.indexOf(u) === -1 && i.push(u);
    }
    const o = t.reduce((c, u) => c + wt(u), 0), a = {};
    for (const c of t) {
      const u = Xi(c.page);
      u && (a[u] = (a[u] ?? 0) + wt(c));
    }
    const l = {};
    return Object.entries(a).slice(0, xi).forEach(([c, u]) => {
      l[c] = Math.round(u / 1e3);
    }), {
      time_per_page: l,
      visits: t.slice(-Pi),
      visit_count: t.length,
      session_count: Li(t),
      unique_pages: i.length,
      total_time_seconds: Math.round(o / 1e3),
      pages: i.join(","),
      first_visit_at: new Date(s.enteredAt).toISOString(),
      last_visit_at: new Date(n.enteredAt).toISOString()
    };
  } catch {
    return null;
  }
}
function Yi() {
  try {
    if (!Ze()) return null;
    let r = {};
    if (typeof window < "u" && window.sessionStorage) {
      const s = sessionStorage.getItem(Qe);
      if (s) {
        const n = JSON.parse(s);
        n && typeof n == "object" && (r = n);
      }
    }
    Object.keys(r).length === 0 && ye && (r = { ...ye });
    let e = en();
    oe.shareInsightsAcrossSubdomains !== !1 && (e = zi(
      e,
      qi()
    )), e && (r.enhanced_insights = e);
    const t = Di();
    return t && (r.device = t), Object.keys(r).length > 0 ? JSON.stringify(r) : null;
  } catch {
    return null;
  }
}
const ze = "ei_stay_params", Qi = 7 * 24 * 60 * 60 * 1e3, Zi = 12 * 60 * 60 * 1e3, eo = 60, to = 864e5, so = [
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
let He = !0, Q = null, fs = !1, ps = !1;
const gs = (r) => r < 10 ? "0" + r : String(r);
function Ne(r, e, t) {
  if (r < 2e3 || r > 2100 || e < 1 || e > 12 || t < 1 || t > 31) return null;
  const s = new Date(Date.UTC(r, e - 1, t));
  return s.getUTCMonth() !== e - 1 || s.getUTCDate() !== t ? null : `${r}-${gs(e)}-${gs(t)}`;
}
function ms(r, e) {
  const t = r.trim();
  let s = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(t);
  if (s) {
    const h = Ne(+s[1], +s[2], +s[3]);
    return h ? [h] : [];
  }
  if (s = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t), !s) return [];
  const n = +s[1], i = +s[2], o = +s[3];
  if (t.charAt(s[1].length) === ".") {
    const h = Ne(o, i, n);
    return h ? [h] : [];
  }
  const l = Ne(o, i, n), c = Ne(o, n, i), u = [], d = e === "DMY" ? [l, c] : [c, l];
  for (const h of d)
    h && u.indexOf(h) === -1 && u.push(h);
  return u;
}
function tn(r, e) {
  const [t, s, n] = r.split("-").map(Number), [i, o, a] = e.split("-").map(Number);
  return Math.round(
    (Date.UTC(i, o - 1, a) - Date.UTC(t, s - 1, n)) / to
  );
}
const sn = (r, e) => {
  const t = tn(r, e);
  return t >= 1 && t <= eo;
}, at = (r) => {
  if (r == null) return;
  const e = Number(r.trim());
  return Number.isInteger(e) && e >= 0 && e <= 99 ? e : void 0;
};
function no(r) {
  let e;
  try {
    e = new URL(r);
  } catch {
    return null;
  }
  const t = e.searchParams, s = [];
  for (const [c, u, d] of so) {
    const h = t.get(c), f = t.get(u);
    if (!h || !f) continue;
    const p = ms(h, d), y = ms(f, d), g = [];
    for (const w of p)
      for (const C of y)
        sn(w, C) && g.push({ checkin: w, checkout: C });
    g.length > 0 && s.push(g);
  }
  if (s.length === 0) return null;
  let n = null;
  if (s.length > 1) {
    e: for (const c of s)
      for (const u of c)
        if (s.some(
          (h) => h !== c && h.some(
            (f) => f.checkin === u.checkin && f.checkout === u.checkout
          )
        )) {
          n = u;
          break e;
        }
  }
  n || (n = s[0][0]);
  const i = {
    checkin: n.checkin,
    checkout: n.checkout,
    captured_at: (/* @__PURE__ */ new Date()).toISOString(),
    url: e.origin + e.pathname
  }, o = at(t.get("adults")), a = at(t.get("children")), l = at(t.get("guests"));
  return o !== void 0 ? i.adults = o : l !== void 0 && (i.adults = l), a !== void 0 && (i.children = a), i;
}
const nn = (r, e = Date.now()) => {
  const t = Date.parse(r.captured_at);
  return Number.isFinite(t) && e - t >= 0 && e - t <= Qi;
};
function ro() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const r = window.localStorage.getItem(ze);
    if (!r) return null;
    const e = JSON.parse(r);
    if (!e || typeof e != "object" || typeof e.checkin != "string" || typeof e.checkout != "string" || typeof e.captured_at != "string")
      return null;
    const t = e;
    return !nn(t) || !sn(t.checkin, t.checkout) ? (window.localStorage.removeItem(ze), null) : t;
  } catch {
    return null;
  }
}
function rn() {
  var r;
  if (!(typeof window > "u" || !Q) && Ze())
    try {
      (r = window.localStorage) == null || r.setItem(
        ze,
        JSON.stringify(Q)
      );
    } catch {
    }
}
function on() {
  try {
    typeof window < "u" && window.localStorage && window.localStorage.removeItem(ze);
  } catch {
  }
}
function Ct() {
  if (!He || typeof window > "u") return null;
  try {
    const r = no(window.location.href);
    return r && (Q = r, rn()), r;
  } catch {
    return null;
  }
}
function io(r) {
  if (He = (r == null ? void 0 : r.enabled) !== !1, !(!He || typeof window > "u")) {
    if (Ct(), !ps) {
      ps = !0;
      try {
        window.addEventListener("popstate", () => {
          Ct();
        });
      } catch {
      }
    }
    fs || (fs = !0, Ys((e) => {
      e ? rn() : on();
    }));
  }
}
function oo() {
  if (!He) return null;
  const r = Ct();
  if (r) return r;
  if (Q && nn(Q)) return Q;
  const e = ro();
  return e && (Q = e), e;
}
function ao() {
  Q = null, on();
}
function lo(r, e, t = Zi) {
  if (!e || !Array.isArray(r) || r.length === 0)
    return r;
  const s = Date.parse(e.captured_at);
  if (!Number.isFinite(s) || Date.now() - s > t)
    return r;
  let n = !1;
  const i = tn(e.checkin, e.checkout), o = r.map((a) => !a || typeof a != "object" || a.startDate || a.endDate || String(a.type ?? "").toLowerCase() === "addon" ? a : (n = !0, {
    ...a,
    startDate: e.checkin,
    endDate: e.checkout,
    nights: i,
    ei_stay_source: "url"
  }));
  return n ? o : r;
}
let Ue = !1;
const Fe = '[data-testid="checkout_responsible_for_booking_section"]', co = "/gw/itinerary/v1/createReservation", ys = "ei_synxis_resv_", lt = /* @__PURE__ */ new Map();
let vs = !1, bs = !1;
const V = class V {
  constructor(e) {
    m(this, "options");
    m(this, "supabaseService");
    m(this, "inputDetector");
    m(this, "productDetector");
    m(this, "totalExtractor");
    m(this, "campaign");
    m(this, "totalAverage", 0);
    m(this, "_sessionId");
    m(this, "isInitialized", !1);
    m(this, "previousContent", {});
    m(this, "previousProducts", []);
    m(this, "previousTotal", 0);
    m(this, "debounceTimer");
    m(this, "pendingContentUpdate");
    m(this, "isSubmitting", !1);
    // Lock to prevent concurrent submissions
    // Our injected autofield section and its per-field wrappers. Kept in
    // memory while off the page so typed values survive being re-added.
    m(this, "autofieldSection");
    m(this, "autofieldWrappers", []);
    m(this, "autofieldObserver");
    // GA4 dataLayer events go out at most once per page load, so the
    // section flickering in and out does not inflate the counts
    m(this, "hasTrackedAutofieldsShown", !1);
    m(this, "hasTrackedAutofieldsHidden", !1);
    // Last state written to the console, so syncAutofields (which runs on
    // every DOM change) only logs when something actually changes
    m(this, "autofieldLogState");
    m(this, "boundHandleAutofieldBlur", (e) => this.handleAutofieldBlur(e));
    m(this, "boundSaveAutofieldToStorage", (e) => {
      const t = e.target, s = V.AUTOFIELD_STORAGE_KEYS[t.name];
      s && t.value && this.saveToSessionStorage(s, t.value);
    });
    this.options = e, this.supabaseService = new $t(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    var e, t, s, n, i;
    if (this.isInitialized)
      return !0;
    try {
      if (this.loadSessionIdFromStorage(), (e = this.options.config) != null && e.completedCheckout && this._sessionId)
        return await this.handleCompletedCheckout(), !0;
      const o = await this.supabaseService.getCheckoutCampaign(
        this.options.checkoutCampaignId
      );
      if (this.totalAverage = o != null && o.average_checkout_value ? o.average_checkout_value : 0, !o)
        return console.error("Failed to fetch checkout campaign data"), !1;
      if (this.campaign = o, console.log("EI: checkout campaign loaded", {
        type: o.type,
        autofields: ((s = (t = o.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0,
        path: window.location.pathname
      }), o.type === "synxis" && this.installSynxisReservationCapture(), this.inputDetector = new ct(o.input_mapping), o.type !== "bookvisit" && o.type !== "synxis" && o.type !== "elinapms" && (this.productDetector = new un(
        o.product_mapping
      ), this.totalExtractor = new dn(
        o.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), o.type === "bookvisit" && ((i = (n = o.config) == null ? void 0 : n.bookvisit) == null ? void 0 : i.autofields) === !0 && !Ue) {
        Ue = !0;
        try {
          this.injectBookVisitAutofields(o.input_mapping);
        } catch (a) {
          console.error("Failed to inject BookVisit autofields:", a);
        }
      } else o.type === "bookvisit" && console.log(
        "EI autofields: not injecting:",
        Ue ? "already injected by another SDK instance on this page" : "config.bookvisit.autofields is not true on the campaign"
      );
      return this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0;
    } catch (o) {
      return console.error("Failed to initialize abandoned cart tool:", o), !1;
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
    var s, n, i, o, a, l, c, u, d, h;
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
      let f = [], p = this.totalAverage;
      if (((s = this.campaign) == null ? void 0 : s.type) === "bookvisit") {
        const E = await this.withBasketTimeout(
          this.fetchBookVisitBasket()
        );
        E && (f = E.products, p = E.total);
      } else if (((n = this.campaign) == null ? void 0 : n.type) === "synxis") {
        const E = await this.withBasketTimeout(
          this.fetchSynxisBasket()
        );
        E && (f = E.products, p = E.total);
      } else if (((i = this.campaign) == null ? void 0 : i.type) === "elinapms") {
        const E = await this.fetchElinapmsBasket();
        E && (f = E.products, p = E.total);
      } else
        f = ((o = this.productDetector) == null ? void 0 : o.detectProducts()) || [], p = ((a = this.totalExtractor) == null ? void 0 : a.extractTotal()) || this.totalAverage;
      const y = ((l = this.options.features) == null ? void 0 : l.stayCapture) === !1 ? null : oo();
      if (f = lo(f, y), !this.hasContentChanged(
        e,
        f,
        p
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const w = typeof window < "u" ? window.location.href : "", C = this._sessionId || t, v = this.withStay(Yi(), y), _ = { ...e }, I = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: _,
        products: f,
        url: w,
        total: p,
        id: C,
        ...v ? { analytics: v } : {},
        ...((c = this.campaign) == null ? void 0 : c.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {},
        ...((d = this.campaign) == null ? void 0 : d.type) === "bookvisit" && this._bookvisitSessionIds ? { metadata: this._bookvisitSessionIds } : {}
      }, k = await this.supabaseService.submitCartSession(I);
      k && k.id ? (this._sessionId = k.id, (h = this.inputDetector) == null || h.setSessionId(k.id), this.saveSessionIdToStorage(k.id), this.previousContent = _, this.previousProducts = [...f], this.previousTotal = p, console.log("Cart session updated successfully:", k.id)) : console.error("Failed to submit cart session");
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
    const s = new Promise((n) => {
      t = setTimeout(() => {
        console.warn("Basket fetch timed out, continuing without it"), n(null);
      }, V.BASKET_FETCH_TIMEOUT_MS);
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
    const n = JSON.stringify(e) !== JSON.stringify(this.previousContent), i = JSON.stringify(t) !== JSON.stringify(this.previousProducts), o = s !== this.previousTotal;
    return n || i || o;
  }
  destroy() {
    this.debounceTimer && (clearTimeout(this.debounceTimer), this.debounceTimer = void 0), this._urlCheckInterval && (clearInterval(this._urlCheckInterval), this._urlCheckInterval = void 0), this.stopSyncingAutofields(), this.autofieldSection && (this.autofieldSection.remove(), this.autofieldSection = void 0, Ue = !1, console.log("EI autofields: stopped (tool destroyed)")), this._iframeObserver && (this._iframeObserver.disconnect(), this._iframeObserver = void 0), this.pendingContentUpdate && (this.handleContentUpdate(
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
      this.clearSessionIdFromStorage(), this._sessionId = void 0, ao(), console.log("Completed checkout cleanup finished");
    }
  }
  /**
   * Fetch basket data from BookVisit API
   */
  async fetchBookVisitBasket() {
    var s, n;
    if (!this.campaign || this.campaign.type !== "bookvisit")
      return null;
    const e = (n = (s = this.campaign.config) == null ? void 0 : s.bookvisit) == null ? void 0 : n.channel_id;
    if (!e)
      return console.error("BookVisit channel_id not found in campaign config"), null;
    const t = this.getCookie("bv_jwt");
    if (!t)
      return console.warn("BookVisit JWT token not found in cookies"), null;
    try {
      const i = `https://restapi.bookvisit.com/baskets/basket-v1?IncludePaymentHistory=false&ChannelId=${e}`, o = await fetch(i, {
        credentials: "include",
        headers: {
          authorization: `Bearer ${t}`
        }
      });
      if (!o.ok)
        return console.error(
          `BookVisit API error: ${o.status} ${o.statusText}`
        ), null;
      const a = await o.json(), l = this.getBookVisitSessionIds(a);
      return l && (this._bookvisitSessionIds = l), this.extractBookVisitProductsAndTotal(a);
    } catch (i) {
      return console.error("Error fetching BookVisit basket:", i), null;
    }
  }
  /**
   * Identifiers of a BookVisit basket: the basket/booking id from the API
   * response (field names differ between API versions, so several are
   * tried), plus `sbe_rc`/`basketId` from the page URL when present.
   * Never throws; null when nothing was found.
   */
  getBookVisitSessionIds(e) {
    var t, s, n, i;
    try {
      const o = (p) => typeof p == "string" && p.trim() ? p.trim() : typeof p == "number" && isFinite(p) ? String(p) : null, a = (e == null ? void 0 : e.booking) ?? {}, l = (a == null ? void 0 : a.bookingData) ?? {}, c = o(a == null ? void 0 : a.basketId) ?? o(a == null ? void 0 : a.id) ?? o(l == null ? void 0 : l.basketId) ?? o(e == null ? void 0 : e.basketId) ?? o(e == null ? void 0 : e.id), u = o(l == null ? void 0 : l.bookingNumber) ?? o(l == null ? void 0 : l.bookingCode) ?? o(l == null ? void 0 : l.reservationNumber) ?? o(a == null ? void 0 : a.bookingNumber) ?? o(a == null ? void 0 : a.bookingCode), d = o((t = l == null ? void 0 : l.customer) == null ? void 0 : t.countryCode) ?? o((s = l == null ? void 0 : l.customer) == null ? void 0 : s.country) ?? o((n = l == null ? void 0 : l.guest) == null ? void 0 : n.countryCode) ?? o((i = a == null ? void 0 : a.customer) == null ? void 0 : i.countryCode);
      let h = null, f = null;
      if (typeof window < "u") {
        const p = new URLSearchParams(window.location.search);
        if (h = p.get("sbe_rc") ?? p.get("sbeRc"), h)
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
    var n, i, o;
    const t = [];
    let s = 0;
    try {
      const a = (n = e == null ? void 0 : e.booking) == null ? void 0 : n.bookingData;
      if (!a)
        return { products: t, total: s };
      s = a.totalPrice || 0;
      const l = typeof ((i = a.customer) == null ? void 0 : i.countryCode) == "string" ? a.customer.countryCode : typeof ((o = a.customer) == null ? void 0 : o.country) == "string" ? a.customer.country : void 0, c = a.rooms || [], u = a.roomDescriptions || [], d = a.addOnDescriptions || [];
      c.forEach((f) => {
        var _, I, k, E;
        const p = u.find(
          ($) => $.id === f.roomId
        ), y = f.totalPrice || 0, g = (I = (_ = p == null ? void 0 : p.images) == null ? void 0 : _[0]) == null ? void 0 : I.uri, w = (k = p == null ? void 0 : p.images) == null ? void 0 : k.map(
          ($) => $.uri
        ), C = {
          id: f.roomId,
          name: (p == null ? void 0 : p.name) || "Room",
          price: y,
          quantity: 1,
          type: "room",
          startDate: f.startDate,
          endDate: f.endDate,
          roomConfig: f.roomConfig,
          image: g,
          images: w,
          ...l ? { guestCountry: l } : {}
        };
        if (f.priceInfo && f.priceInfo.length > 0) {
          const $ = f.priceInfo[0].ratePlanId, W = (E = a.ratePlanDescriptions) == null ? void 0 : E.find(
            (K) => K.id === $
          );
          W && (C.ratePlan = W.name);
        }
        t.push(C), (f.mandatoryAddOns || []).forEach(($) => {
          const W = $.totalPrice || 0;
          if (W > 0) {
            const K = d.find(
              (je) => je.id === $.addOnId
            );
            t.push({
              id: $.addOnId,
              name: (K == null ? void 0 : K.name) || "Add-on",
              price: W,
              quantity: $.numberOfUnits || 1,
              type: "addon",
              roomId: f.roomId,
              date: $.date
            });
          }
        });
      }), (a.optionalAddOns || []).forEach((f) => {
        const p = f.totalPrice || 0;
        if (p > 0) {
          const y = d.find(
            (g) => g.id === f.addOnId
          );
          t.push({
            id: f.addOnId,
            name: (y == null ? void 0 : y.name) || "Add-on",
            price: p,
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
    ), console.log("EI autofields: ready, watching the page for checkout", {
      fields: t,
      path: window.location.pathname
    }), typeof MutationObserver < "u" ? (this.autofieldObserver = new MutationObserver(
      () => this.syncAutofields()
    ), this.autofieldObserver.observe(document.body, {
      childList: !0,
      subtree: !0
    })) : console.warn(
      "EI autofields: MutationObserver unavailable, cannot follow page changes"
    ), this.syncAutofields();
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
    if (!this.isBookVisitCheckoutPage()) {
      e.parentElement && e.remove(), this.logAutofieldState("off checkout, section not on page", {
        path: window.location.pathname
      });
      return;
    }
    const t = document.getElementById("main_content_container");
    if (!t) {
      this.logAutofieldState(
        "on checkout, waiting for #main_content_container",
        { path: window.location.pathname }
      );
      return;
    }
    let s = !1;
    const n = e.querySelector(
      "[data-ei-autofield-grid]"
    );
    let i = null;
    for (const o of this.autofieldWrappers) {
      const a = !this.nativeAutofieldExists(
        o.dataset.eiAutofield ?? ""
      );
      a && o.parentElement !== n ? (n.insertBefore(
        o,
        i ? i.nextSibling : n.firstChild
      ), s = !0) : !a && o.parentElement === n && (o.remove(), s = !0), a && (i = o);
    }
    if (i && e.parentElement !== t ? (t.insertAdjacentElement("afterbegin", e), s = !0, this.hasTrackedAutofieldsShown || (this.hasTrackedAutofieldsShown = !0, this.pushAutofieldsEvent("ei_autofields_shown"))) : !i && e.parentElement && (e.remove(), s = !0, this.hasTrackedAutofieldsHidden || (this.hasTrackedAutofieldsHidden = !0, this.pushAutofieldsEvent("ei_autofields_hidden"))), i) {
      const o = this.autofieldWrappers.filter((a) => a.parentElement === n).map((a) => a.dataset.eiAutofield).join(",");
      this.logAutofieldState(`shown: ${o}`);
    } else
      this.logAutofieldState(
        "hidden: BookVisit renders all the fields itself"
      );
    s && this.setupAutofieldListenersWithRetry();
  }
  /**
   * Console log for the autofields, only when the state differs from the
   * last one logged
   */
  logAutofieldState(e, t) {
    e !== this.autofieldLogState && (this.autofieldLogState = e, t ? console.log(`EI autofields: ${e}`, t) : console.log(`EI autofields: ${e}`));
  }
  /**
   * Push a GA4 custom event for our autofields to the dataLayer. When
   * shown, ei_autofields lists the autofields on the page.
   */
  pushAutofieldsEvent(e) {
    try {
      const t = this.autofieldWrappers.filter((n) => n.isConnected).map((n) => n.dataset.eiAutofield).join(","), s = window;
      s.dataLayer = s.dataLayer || [], s.dataLayer.push({
        event: e,
        ...t ? { ei_autofields: t } : {}
      });
    } catch (t) {
      console.warn("Failed to push autofields event to dataLayer:", t);
    }
  }
  /**
   * Check whether the current page is BookVisit's checkout page
   */
  isBookVisitCheckoutPage() {
    return /\/checkout\/?$/.test(window.location.pathname);
  }
  /**
   * Check whether BookVisit itself renders an input for the given autofield,
   * ignoring the ones we injected
   */
  nativeAutofieldExists(e) {
    const t = V.AUTOFIELD_SELECTORS[e];
    return !t || typeof document > "u" ? !1 : Array.from(document.querySelectorAll(t)).some(
      (s) => !s.closest("[data-ei-autofields]")
    );
  }
  /**
   * Determine which fields to include based on input_mapping
   */
  getFieldsToInclude(e) {
    const t = [], s = (e == null ? void 0 : e.field_mappings) || {}, n = (e == null ? void 0 : e.inputs) || [];
    return (this.hasFieldMapping(s, ["first_name"]) || this.hasInputSelector(n, [
      "firstName",
      "firstname",
      "first_name",
      "given-name"
    ])) && t.push("firstName"), (this.hasFieldMapping(s, ["last_name"]) || this.hasInputSelector(n, [
      "lastName",
      "lastname",
      "last_name",
      "family-name"
    ])) && t.push("lastName"), (this.hasFieldMapping(s, ["email"]) || this.hasInputSelector(n, [
      "email",
      "emailAddress",
      "email_address",
      "e-mail"
    ])) && t.push("email"), (this.hasFieldMapping(s, ["phone_number"]) || this.hasInputSelector(n, [
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
      const n = s.toLowerCase();
      for (const i of t) {
        const o = i.toLowerCase();
        if (n === o)
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
      const n = s.toLowerCase();
      for (const i of t) {
        const o = i.toLowerCase();
        if (n.includes(o))
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
    }, n = s[e][t];
    return n || s[e].en || e;
  }
  /**
   * Create the BookVisit form section HTML
   */
  createBookVisitFormSection(e) {
    const t = e.includes("firstName"), s = e.includes("lastName"), n = e.includes("email"), i = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber"), l = "bv:box-border bv:flex bv:h-[40px] bv:w-full bv:pl-[14px] bv:rounded-bv_inputRoundedCorners bv:border-solid bv:bv_inputBorder bv:disabled:cursor-not-allowed bv:disabled:opacity-50 bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:placeholder:text-bv_inputColor/70 bv:focus:outline-hidden! bv:focus:ring-2 bv:bg-bv_inputBackground bv:text-bv_inputColor";
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
            `), n && (c += `
                <div data-ei-autofield="email" style="display: contents;">
                <label for="customer-emailAddress" class="bv:sr-only">${o}</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-emailAddress" autocomplete="email" class="${l}" data-testid="customer_info_form_email" placeholder="${o} *" type="email" name="emailAddress">
                </div>
                </div>
            `), i && (c += `
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
   * discounts that the SBE applies client-side at reservation time. The root
   * `total` is picked in this order:
   *   1. the reservation captured from the SBE's own createReservation
   *      response (post-discount, see installSynxisReservationCapture)
   *   2. selectSynxisTotal(): the API total, or the DOM-visible price when it
   *      looks like a plausible promo on it
   * The DOM price is also exposed per-product as `actualTotal` for reference.
   *
   * Possible future fallback: the SBE's Redux store holds the same figure at
   * reservation.byId[<id>].Prices.Total.Total, but reaching it goes through
   * React internals, so it is deliberately not read here.
   */
  extractSynxisCartApiData(e) {
    var l, c, u, d, h, f, p, y, g, w, C, v, _, I, k, E, $, W, K, je;
    const t = [];
    let s = 0;
    const n = [], i = this.getSynxisActualTotal(), o = this._synxisSessionIds;
    try {
      const M = (e == null ? void 0 : e.ShoppingCart) || [], N = [];
      for (const A of M) {
        const P = ((c = (l = A == null ? void 0 : A.UpdatedData) == null ? void 0 : l.itinerary) == null ? void 0 : c.reservations) || [];
        for (const le of P)
          N.push({
            resv: le,
            itineraryNumber: (A == null ? void 0 : A.Itemid) || ""
          });
      }
      let $e = N;
      if (o != null && o.sbeRcDecoded) {
        const A = N.filter(
          ({ resv: P }) => P.id === o.sbeRcDecoded
        );
        A.length > 0 && ($e = A);
      }
      $e === N && N.length > 1 && ($e = [...N].sort(
        (A, P) => P.itineraryNumber.localeCompare(A.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: A } of $e) {
        const P = A.extrasFromShopping || {}, le = A.stayCriteria || {}, Lt = A.guestCriteria || {}, x = P.prices || {}, ce = this.getCapturedSynxisReservation(A.id);
        A.id && n.push(String(A.id));
        const Dt = ((h = (d = (u = x == null ? void 0 : x.Total) == null ? void 0 : u.Price) == null ? void 0 : d.Total) == null ? void 0 : h.AmountWithTaxesFees) || ((y = (p = (f = x == null ? void 0 : x.Total) == null ? void 0 : f.Price) == null ? void 0 : p.Total) == null ? void 0 : y.Amount) || ((w = (g = x == null ? void 0 : x.Total) == null ? void 0 : g.Price) == null ? void 0 : w.Amount) || 0, Nt = ((x == null ? void 0 : x.Daily) || []).map((J) => {
          var Ut, Ft, Mt, Bt, qt, zt, Ht, Vt, Wt, Kt;
          return {
            date: J.Date,
            amount: ((Ft = (Ut = J.Price) == null ? void 0 : Ut.Total) == null ? void 0 : Ft.Amount) || ((Mt = J.Price) == null ? void 0 : Mt.Amount) || 0,
            amountWithTax: ((qt = (Bt = J.Price) == null ? void 0 : Bt.Total) == null ? void 0 : qt.AmountWithTaxesFees) || 0,
            tax: ((Ht = (zt = J.Price) == null ? void 0 : zt.Tax) == null ? void 0 : Ht.Amount) || 0,
            fees: ((Wt = (Vt = J.Price) == null ? void 0 : Vt.Fees) == null ? void 0 : Wt.Amount) || 0,
            currency: (Kt = J.Price) == null ? void 0 : Kt.CurrencyCode,
            inventory: J.AvailableInventory
          };
        }), an = {
          id: A.id,
          confirmationNumber: A.confirmationNumber,
          itineraryNumber: A.itineraryNumber,
          name: P.displayname || "Room",
          roomCode: le.roomCode,
          rateCode: le.rateCode,
          price: Dt,
          actualTotal: i,
          discountedTotal: (ce == null ? void 0 : ce.total) ?? null,
          originalTotal: (ce == null ? void 0 : ce.originalTotal) ?? null,
          dailyRate: P.amount || P.amountWithTaxesFees,
          currency: P.currencyCode,
          dailyPrices: Nt,
          taxes: ((_ = (v = (C = x == null ? void 0 : x.Total) == null ? void 0 : C.Price) == null ? void 0 : v.Tax) == null ? void 0 : _.Amount) || 0,
          fees: ((E = (k = (I = x == null ? void 0 : x.Total) == null ? void 0 : I.Price) == null ? void 0 : k.Fees) == null ? void 0 : E.Amount) || 0,
          startDate: ($ = le.startDate) == null ? void 0 : $.split("T")[0],
          endDate: (W = le.endDate) == null ? void 0 : W.split("T")[0],
          nights: Nt.length || null,
          adults: Lt.numAdults || 1,
          children: Lt.numChildren || 0,
          hotelId: String(A.hotelId),
          chainId: String(A.chainId),
          bedDescription: P.bedDescription,
          bedType: P.bedType,
          bedQuantity: P.bedQuantity,
          maxRoomSize: P.maxRoomSize,
          minRoomSize: P.minRoomSize,
          guestLimit: P.guestLimit,
          inventory: P.inventory,
          bookingPolicyCode: P.bookingPolicyCode,
          cancelPolicyCode: P.cancelPolicyCode,
          status: A.status,
          type: "room",
          quantity: 1,
          addons: A.addOns || [],
          image: P.coverImage || ((je = (K = P.imageUrls) == null ? void 0 : K[0]) == null ? void 0 : je.Path) || null
        };
        t.push(an), s += Dt;
      }
    } catch (M) {
      console.error("SynXis: Error extracting cart API data:", M);
    }
    const a = n.map(
      (M) => {
        var N;
        return ((N = this.getCapturedSynxisReservation(M)) == null ? void 0 : N.total) ?? null;
      }
    );
    return a.length > 0 && a.every((M) => M !== null && M > 0) ? s = a.reduce(
      (M, N) => M + N,
      0
    ) : s = this.selectSynxisTotal(s, i), { products: t, total: s };
  }
  /**
   * Pick the root total from the cart API sum and the DOM-visible price.
   *
   * The API total is the list price and the default. The DOM price is
   * post-discount but parsed from locale-formatted text, so it only wins
   * when it looks like a plausible promo on the API total: above zero, no
   * higher than the API total (a promo never raises the price) and not cut
   * by half or more. Anything else is logged and ignored. With no API total
   * we take the DOM price, then the campaign average.
   */
  selectSynxisTotal(e, t) {
    const s = t !== null && t > 0 ? t : null;
    if (e > 0) {
      if (s !== null) {
        if (s <= e && s > e * 0.5)
          return s;
        console.warn(
          `SynXis: Ignoring DOM total ${s}, API total is ${e}`
        );
      }
      return e;
    }
    return s !== null ? s : this.totalAverage || 0;
  }
  /**
   * Wrap window.fetch and XMLHttpRequest so the SBE's createReservation
   * response can be read as it goes past. The fetch Response is cloned and
   * the XHR body is read after loadend; the page's own handling is never
   * touched and nothing in here may throw. Installed once per page and only
   * useful when the script also runs on the room-selection page. With
   * nothing captured, extractSynxisCartApiData() silently falls back.
   */
  installSynxisReservationCapture() {
    if (!(vs || typeof window > "u")) {
      vs = !0;
      try {
        if (typeof window.fetch == "function") {
          const e = window.fetch;
          window.fetch = (t, s) => {
            const n = e.call(window, t, s);
            try {
              const i = typeof t == "string" ? t : t instanceof URL ? t.href : t == null ? void 0 : t.url;
              this.isSynxisCreateReservationUrl(i) && n.then(
                (o) => this.readSynxisReservationResponse(o),
                () => {
                }
              );
            } catch {
            }
            return n;
          };
        }
      } catch (e) {
        console.warn("SynXis: Could not wrap fetch:", e);
      }
      try {
        const e = typeof XMLHttpRequest < "u" ? XMLHttpRequest.prototype : null;
        if (e) {
          const t = e.open, s = e.send, n = this;
          e.open = function(...i) {
            try {
              this.__eiSynxisUrl = String(i[1] ?? "");
            } catch {
            }
            return t.apply(this, i);
          }, e.send = function(...i) {
            try {
              n.isSynxisCreateReservationUrl(
                this.__eiSynxisUrl
              ) && this.addEventListener("loadend", () => {
                try {
                  const o = this.responseType === "" || this.responseType === "text" ? JSON.parse(this.responseText) : this.response;
                  n.captureSynxisReservationResponse(o);
                } catch {
                }
              });
            } catch {
            }
            return s.apply(this, i);
          };
        }
      } catch (e) {
        console.warn("SynXis: Could not wrap XMLHttpRequest:", e);
      }
    }
  }
  isSynxisCreateReservationUrl(e) {
    return typeof e == "string" && e.toLowerCase().includes(
      co.toLowerCase()
    );
  }
  readSynxisReservationResponse(e) {
    try {
      if (!e || !e.ok)
        return;
      e.clone().json().then(
        (t) => this.captureSynxisReservationResponse(t),
        () => {
        }
      );
    } catch {
    }
  }
  /**
   * Pull { id, total, originalTotal, currency } out of a createReservation
   * response and keep it in memory + sessionStorage. The reservation may sit
   * at the root or inside a wrapper (e.g. Reservations[0]), so the node is
   * searched for rather than addressed. The first response's shape is logged
   * once so the real layout can be confirmed on a live checkout.
   */
  captureSynxisReservationResponse(e) {
    var t, s, n, i, o, a;
    try {
      const l = this.findSynxisReservationNode(e);
      if (bs || (bs = !0, console.log(
        "SynXis: createReservation response keys:",
        e && typeof e == "object" ? Object.keys(e) : typeof e,
        "reservation at:",
        l ? l.path || "<root>" : "<not found>"
      )), !l)
        return null;
      const c = l.node, u = ((s = (t = c.Prices) == null ? void 0 : t.Total) == null ? void 0 : s.Total) ?? ((i = (n = c.prices) == null ? void 0 : n.Total) == null ? void 0 : i.Total) ?? {}, d = c.Id ?? c.id, h = Number(u.AmountWithTaxesFees ?? u.Amount);
      if (!d || !Number.isFinite(h) || h <= 0)
        return null;
      const f = Number(u.OriginalAmount), p = {
        id: String(d),
        total: h,
        originalTotal: u.OriginalAmount != null && Number.isFinite(f) ? f : null,
        currency: c.CurrencyCode ?? c.currencyCode ?? ((a = (o = c.Prices) == null ? void 0 : o.Total) == null ? void 0 : a.CurrencyCode) ?? u.CurrencyCode ?? null,
        hasDiscount: c.hasDiscount ?? c.HasDiscount,
        promotionDiscount: c.promotionDiscount ?? c.PromotionDiscount ?? null
      };
      return lt.set(p.id, p), this.saveToSessionStorage(
        ys + p.id,
        JSON.stringify(p)
      ), p;
    } catch (l) {
      return console.warn(
        "SynXis: Could not read createReservation response:",
        l
      ), null;
    }
  }
  /**
   * Find the first object that looks like a reservation (has an Id and
   * Prices.Total.Total), searching a few levels into wrappers and arrays.
   */
  findSynxisReservationNode(e, t = "", s = 0) {
    var o, a, l, c;
    if (!e || typeof e != "object" || s > 4)
      return null;
    const n = ((a = (o = e.Prices) == null ? void 0 : o.Total) == null ? void 0 : a.Total) ?? ((c = (l = e.prices) == null ? void 0 : l.Total) == null ? void 0 : c.Total);
    if (n && typeof n == "object" && (e.Id ?? e.id))
      return { node: e, path: t };
    const i = Array.isArray(e) ? e.map((u, d) => [String(d), u]) : Object.entries(e);
    for (const [u, d] of i) {
      if (!d || typeof d != "object")
        continue;
      const h = this.findSynxisReservationNode(
        d,
        t ? `${t}.${u}` : u,
        s + 1
      );
      if (h)
        return h;
    }
    return null;
  }
  /**
   * Captured reservation by id: memory first, then the sessionStorage copy
   * written on the room-selection page.
   */
  getCapturedSynxisReservation(e) {
    if (!e)
      return null;
    const t = String(e), s = lt.get(t);
    if (s)
      return s;
    const n = this.getFromSessionStorage(ys + t);
    if (!n)
      return null;
    try {
      const i = JSON.parse(n);
      if (i && typeof i.total == "number")
        return lt.set(t, i), i;
    } catch {
    }
    return null;
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
   * Parse a locale-formatted price string like "12 980,50 kr", "NOK 3,310"
   * or "12,980.50 kr". See parseLocalizedNumber for the separator rules.
   */
  parseSynxisPrice(e) {
    return this.parseLocalizedNumber(e);
  }
  /**
   * Parse a locale-formatted number. Everything but digits, ".", "," and
   * "-" is dropped first (currency codes, nbsp, narrow nbsp). With both "."
   * and "," present the rightmost one is the decimal mark. With only one
   * kind present it is a thousands separator when it occurs more than once
   * or when exactly three digits follow it ("3,310" is 3310, not 3.31);
   * otherwise it is the decimal mark ("980,5", "980.50").
   */
  parseLocalizedNumber(e) {
    if (e == null)
      return null;
    const t = String(e).replace(/[^\d,.-]/g, "");
    if (!t)
      return null;
    const s = t.lastIndexOf("."), n = t.lastIndexOf(",");
    let i;
    if (s !== -1 && n !== -1)
      i = s > n ? t.replace(/,/g, "") : t.replace(/\./g, "").replace(",", ".");
    else if (s === -1 && n === -1)
      i = t;
    else {
      const a = s !== -1 ? "." : ",", l = Math.max(s, n), c = t.split(a).length - 1, u = t.length - l - 1;
      i = c > 1 || u === 3 ? t.split(a).join("") : t.replace(a, ".");
    }
    const o = parseFloat(i);
    return isNaN(o) ? null : o;
  }
  /**
   * Get SynXis session identifiers from cookies and URL parameters
   */
  getSynxisSessionIds() {
    const e = this.getCookie("sbeSessionID"), t = this.getCookie("shoppingCartId");
    let s = null, n = null;
    if (typeof window < "u" && (s = new URLSearchParams(window.location.search).get("sbe_rc"), s))
      try {
        n = atob(s);
      } catch {
      }
    return !e && !t && !s ? null : { sbeSessionId: e, shoppingCartId: t, sbeRc: s, sbeRcDecoded: n };
  }
  /**
   * Get SynXis-related entries from window.dataLayer (fallback)
   */
  getSynxisDataLayer() {
    if (typeof window > "u")
      return null;
    const e = window.dataLayer;
    return Array.isArray(e) ? e.filter((t) => {
      var s, n;
      return t.Cart || ((s = t.ecommerce) == null ? void 0 : s.checkout) || ((n = t.ecommerce) == null ? void 0 : n.items) || t.HName || t.HOTEL_ID || t.event === "checkout" || t.event === "checkoutLoad" || t.event === "app" || t.event === "purchase" || t.event === "confirmation" || t.event === "rooms.add" || t.TotalCost != null;
    }) : null;
  }
  /**
   * Extract products and total from SynXis dataLayer entries (fallback)
   */
  extractSynxisProductsFromDataLayer(e) {
    const t = [];
    let s = 0;
    try {
      const n = e.find((o) => o.event === "checkout") || e.find((o) => o.event === "purchase") || e.find((o) => o.event === "app" && o.Cart) || e.find((o) => o.Cart) || e.find((o) => o.event === "app") || {};
      s = n.TotalCostWithTax || n.TotalCost || n.ItineraryPrice || this.totalAverage || 0;
      const i = n.Cart || [];
      i.length > 0 ? i.forEach((o) => {
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
      }) : (n.RoomCode || n.RoomName) && t.push({
        id: n.RoomCode || n.HOTEL_ID,
        name: n.RoomName || "Room",
        price: s,
        quantity: 1,
        type: "room",
        startDate: n.ArrivalDt,
        endDate: n.DepartDt,
        roomCode: n.RoomCode,
        rateCode: n.RateCode,
        rateName: n.RateName,
        hotelName: n.HName,
        hotelId: n.HOTEL_ID,
        nights: n.NightsQty,
        adults: n.AdultQty,
        children: n.ChildQty,
        dailyRate: n.ItineraryDailyRate,
        currency: n.CurrCode,
        taxes: n.Taxes || 0
      });
    } catch (n) {
      console.error("SynXis: Error extracting dataLayer data:", n);
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
      const s = this.readElinapmsStay(document), n = Array.from(e).map((o) => {
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
      }), i = this.extractElinapmsTotal();
      return { products: n, total: i };
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
      const n = /^(\d{4})-(\d{2})-(\d{2})/, i = n.exec(s.dataset.startdate ?? ""), o = n.exec(s.dataset.enddate ?? "");
      if (!i || !o) return null;
      const a = i[0], l = o[0], c = Math.round(
        (Date.UTC(+o[1], +o[2] - 1, +o[3]) - Date.UTC(+i[1], +i[2] - 1, +i[3])) / 864e5
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
    const s = t.querySelector(".formattedCurrency"), n = s ? this.parseElinapmsNumber(s.textContent) : 0, i = t.querySelector(".plusFees"), o = i ? this.parseElinapmsNumber(i.dataset.att) : 0;
    let a = 0;
    const l = document.getElementById("addonsTotal");
    if (l) {
      const c = l.querySelector(".formattedCurrency");
      a = c ? this.parseElinapmsNumber(c.textContent) : 0;
    }
    return n + o + a;
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
   * ("2 840,00" or "2&nbsp;840,00") and US ("2,840.00" and "2,840") formats,
   * see parseLocalizedNumber for the separator rules. Unparseable input is 0.
   */
  parseElinapmsNumber(e) {
    return this.parseLocalizedNumber(e) ?? 0;
  }
  /**
   * Get cookie value by name
   */
  getCookie(e) {
    var n;
    if (typeof document > "u")
      return null;
    const s = `; ${document.cookie}`.split(`; ${e}=`);
    return s.length === 2 && ((n = s.pop()) == null ? void 0 : n.split(";").shift()) || null;
  }
  /**
   * Set up autofield listeners with retry logic
   * This ensures both InputDetector listeners and sessionStorage listeners are attached
   */
  setupAutofieldListenersWithRetry() {
    let e = 0;
    const t = 5, s = 100, n = () => {
      const i = document.querySelector(
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
      i || o || a || l || c ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(n, s)) : console.warn(
        "Autofield inputs not found after retries, listeners may not be attached"
      );
    };
    n();
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
    const n = this.inputDetector.getContent();
    let i = t.name;
    const o = this.inputDetector.inputMapping;
    (u = o == null ? void 0 : o.field_mappings) != null && u[i] ? i = o.field_mappings[i] : i === "emailAddress" ? i = "email" : i === "phoneNumber" ? i = "phone_number" : i === "firstName" ? i = "first_name" : i === "lastName" && (i = "last_name");
    const a = { ...n, [i]: s }, l = i === "email" || i.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), c = i === "phone_number" || i.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
    if (l || c || this.inputDetector.hasEmailOrPhoneNumber()) {
      const d = this.inputDetector.sessionId;
      this.debouncedHandleContentUpdate(a, d);
    }
  }
  /**
   * Set up event listeners on autofield inputs to store values in sessionStorage
   */
  setupAutofieldStorageListeners() {
    typeof document > "u" || Object.keys(V.AUTOFIELD_STORAGE_KEYS).forEach(
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
    const t = 30, s = 300, n = (o) => {
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
          const p = o.getElementById(
            "registrationManualPhonePrefix"
          );
          if (p) {
            const y = p.querySelector(
              ".css-1yh68ch-singleValue"
            );
            y && (y.textContent = c);
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
    }, i = () => {
      let o = !0;
      const a = n(document);
      a || (o = !1);
      const l = document.querySelectorAll("iframe");
      let c = !1;
      l.forEach((u) => {
        var d;
        try {
          const h = u.contentDocument || ((d = u.contentWindow) == null ? void 0 : d.document);
          h && (n(h) ? c = !0 : o = !1);
        } catch {
          this.tryPostMessageToIframe(u);
        }
      }), (a || c) && (o = !0), !o && e < t ? (e++, setTimeout(i, s)) : e >= t && !o && console.warn(
        "Payment page fields not found after maximum retries. Fields may be in a cross-origin iframe or not yet loaded."
      );
    };
    i(), this.setupIframeWatcher();
  }
  /**
   * Try to send data to cross-origin iframe using postMessage
   * Attempts multiple message formats in case the iframe uses different conventions
   */
  tryPostMessageToIframe(e) {
    var t, s, n, i, o, a, l, c, u, d;
    try {
      const h = this.getFromSessionStorage("autofield_email"), f = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), p = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (!h && !f && !p)
        return;
      let y = "*";
      if (e.src)
        try {
          y = new URL(e.src).origin;
        } catch {
        }
      const g = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((n = e.name) == null ? void 0 : n.toLowerCase().includes("dibs")), w = ((i = e.src) == null ? void 0 : i.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((l = e.src) == null ? void 0 : l.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((c = e.name) == null ? void 0 : c.toLowerCase().includes("nets")) || ((u = e.name) == null ? void 0 : u.toLowerCase().includes("easy"));
      if (!e.contentWindow)
        return;
      const C = [
        // Format 1: Our standard format
        {
          type: "ekteintelligens-autofill",
          email: h || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        },
        // Format 2: Dibs/Nets Easy-specific formats
        ...g || w ? [
          {
            type: "dibs-autofill",
            email: h || null,
            phoneCountryCode: f || null,
            phoneNumber: p || null
          },
          {
            type: "nets-easy-autofill",
            email: h || null,
            phoneCountryCode: f || null,
            phoneNumber: p || null
          },
          {
            action: "autofill",
            data: {
              email: h || null,
              phoneCountryCode: f || null,
              phoneNumber: p || null
            }
          },
          {
            event: "customer-data",
            customer: {
              email: h || null,
              phone: p ? `${f || ""}${p}` : null,
              phoneCountryCode: f || null
            }
          }
        ] : [],
        // Format 3: Generic autofill format
        {
          action: "autofill-fields",
          email: h || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        }
      ];
      C.forEach((_) => {
        try {
          e.contentWindow.postMessage(_, y);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${w ? "Nets Easy/Nexi" : g ? "Dibs" : "cross-origin"} iframe via postMessage (${C.length} formats):`,
        {
          iframeSrc: ((d = e.src) == null ? void 0 : d.substring(0, 100)) || "unknown",
          email: h ? "***" : null,
          phoneCountryCode: f,
          phoneNumber: p ? "***" : null,
          targetOrigin: y
        }
      ), this.tryIframeUrlParameters(
        e,
        h,
        f,
        p
      );
    } catch (h) {
      console.warn("Failed to send postMessage to iframe:", h);
    }
  }
  /**
   * Try to pass data via URL parameters if the iframe src can be modified
   * This only works if the iframe hasn't loaded yet or can be reloaded
   */
  tryIframeUrlParameters(e, t, s, n) {
    if (e.src)
      try {
        const i = new URL(e.src), o = i.hostname.includes("dibspayment.eu") || i.hostname.includes("dibs."), a = i.hostname.includes("netseasy") || i.hostname.includes("nets.eu") || i.hostname.includes("nexigroup.com") || i.hostname.includes("dibspayment.eu");
        if (!o && !a)
          return;
        const l = i.searchParams.toString().length > 0;
        (t || s || n) && console.log(`${a ? "Nets Easy/Nexi" : o ? "Dibs" : "Payment"} iframe URL analysis:`, {
          currentUrl: e.src,
          hasParams: l,
          suggestedParams: {
            ...t ? { email: t } : {},
            ...s ? { phoneCountryCode: s } : {},
            ...n ? { phoneNumber: "***" } : {}
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
        s.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            const i = n;
            i.tagName === "IFRAME" && i.addEventListener("load", () => {
              setTimeout(() => {
                this.fillPaymentPageFields();
              }, 500);
            }), i.querySelectorAll("iframe").forEach((a) => {
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
      s !== e && (e = s, this.checkAndFillPaymentPageFields(), this.syncAutofields());
    }, 500);
    this._urlCheckInterval = t;
  }
};
m(V, "BASKET_FETCH_TIMEOUT_MS", 8e3), /**
 * Selectors that identify each autofield, whether rendered by BookVisit
 * itself or injected by us. Inputs matched by name only count inside the
 * booker section: the checkout can also have guest inputs with the same
 * names, and those must not stop us from showing the booker fields.
 */
m(V, "AUTOFIELD_SELECTORS", {
  firstName: `#customer-firstName, ${Fe} input[name="firstName"]`,
  lastName: `#customer-lastName, ${Fe} input[name="lastName"]`,
  email: `#customer-emailAddress, ${Fe} input[name="emailAddress"]`,
  phoneNumber: `#customer-phoneNumber, ${Fe} input[name="phoneNumber"]`
}), /**
 * sessionStorage key for each autofield input name
 */
m(V, "AUTOFIELD_STORAGE_KEYS", {
  emailAddress: "autofield_email",
  phoneCountryCode: "autofield_phoneCountryCode",
  phoneNumber: "autofield_phoneNumber"
});
let Tt = V;
class uo {
  constructor(e) {
    m(this, "options");
    m(this, "supabaseService");
    m(this, "campaign");
    m(this, "formData", {});
    m(this, "inputListeners", []);
    m(this, "buttonListeners", []);
    m(this, "submitListener");
    m(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new $t(
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
        const n = this.getElementBySelector(
          s.selector_type,
          s.selector_value
        );
        if (n) {
          const i = s.true_value || "on", o = this.isCheckboxChecked(n), a = this.getCheckboxValue(n);
          o && a === i ? this.formData[t] = !0 : this.formData[t] = !1;
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
      const n = this.getElementBySelector(
        s.selector_type,
        s.selector_value
      );
      if (!n) {
        console.warn(
          `Could not find element for field "${t}" with selector type "${s.selector_type}" and value "${s.selector_value}"`
        );
        return;
      }
      const i = (o) => {
        this.handleInputChange(
          t,
          o.target,
          s
        );
      };
      if (s.type === "checkbox") {
        if (n instanceof HTMLButtonElement || n.getAttribute("role") === "checkbox") {
          n.addEventListener("click", () => {
            setTimeout(() => {
              this.handleInputChange(t, n, s);
            }, 0);
          });
          const o = new MutationObserver(() => {
            this.handleInputChange(t, n, s);
          });
          o.observe(n, {
            attributes: !0,
            attributeFilter: ["aria-checked", "data-state"]
          }), n._eiObserver = o;
        } else
          n.addEventListener("change", i);
        this.handleInputChange(t, n, s);
      } else
        n.addEventListener("blur", i), n.addEventListener("change", i);
      this.inputListeners.push({ element: n, fieldName: t, handler: i });
    });
  }
  setupButtonListeners() {
    if (!this.campaign) return;
    const { input_mapping: e } = this.campaign;
    Object.keys(e).forEach((t) => {
      const s = e[t];
      if (s.type !== "button" || s.mode !== "toggle") return;
      const n = this.getElementBySelector(
        s.selector_type,
        s.selector_value
      );
      if (!n) {
        console.warn(
          `Could not find button element for field "${t}" with selector type "${s.selector_type}" and value "${s.selector_value}"`
        );
        return;
      }
      const i = (o) => {
        o.preventDefault(), this.handleButtonToggle(t, s.default_value);
      };
      n.addEventListener("click", i), this.buttonListeners.push({ element: n, fieldName: t, handler: i });
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
    const s = (n) => {
      this.handleSubmit(n);
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
        } catch (n) {
          return console.warn(
            `Invalid querySelector: ${s}`,
            n
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
    var n;
    if ((s == null ? void 0 : s.type) === "checkbox") {
      const i = s.true_value || "on", o = this.isCheckboxChecked(t), a = this.getCheckboxValue(t);
      o && a === i ? this.formData[e] = !0 : this.formData[e] = !1;
      return;
    }
    t instanceof HTMLInputElement ? this.formData[e] = t.value : t instanceof HTMLSelectElement ? this.formData[e] = t.value : t instanceof HTMLTextAreaElement ? this.formData[e] = t.value : this.formData[e] = t.getAttribute("value") || ((n = t.textContent) == null ? void 0 : n.trim()) || "";
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
class ho {
  constructor(e) {
    // @ts-ignore
    m(this, "options");
    m(this, "isInitialized", !1);
    m(this, "currentPage", "");
    m(this, "currentVisitStartTime", 0);
    /** Start of the current foreground segment; 0 while paused. */
    m(this, "segmentStart", 0);
    m(this, "data", { visits: [] });
    m(this, "storageKey", "ei_enhanced_insights");
    m(this, "popstateHandler");
    // private pushstateHandler?: () => void;
    // private replacestateHandler?: () => void;
    m(this, "beforeunloadHandler");
    m(this, "visibilityChangeHandler");
    m(this, "originalPushState");
    m(this, "originalReplaceState");
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
      Bi();
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
const ie = class ie {
  constructor(e) {
    m(this, "supabaseService");
    m(this, "isInitialized", !1);
    this.supabaseService = new $t(
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
        ie.URL_PARAM
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
        ie.STORAGE_KEY
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
          ie.STORAGE_KEY,
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
m(ie, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
m(ie, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let It = ie;
class fo {
  constructor(e) {
    m(this, "options");
    m(this, "tools", /* @__PURE__ */ new Map());
    m(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s, n, i;
    if (this._isInitialized)
      return !0;
    try {
      Gi({
        cookieDomain: this.options.cookieDomain,
        requireConsent: this.options.requireConsent,
        shareInsightsAcrossSubdomains: this.options.shareInsightsAcrossSubdomains
      }), io({
        enabled: !!((e = this.options.features) != null && e.abandonedCart) && ((t = this.options.features) == null ? void 0 : t.stayCapture) !== !1
      });
      const o = new It(this.options);
      if (await o.initialize(), this.tools.set("linkTracking", o), (s = this.options.features) != null && s.abandonedCart) {
        const a = new Tt(this.options);
        await a.initialize(), this.tools.set("abandonedCart", a);
      }
      if ((n = this.options.features) != null && n.organizationPipeline) {
        const a = new uo(
          this.options
        );
        await a.initialize(), this.tools.set(
          "organizationPipeline",
          a
        );
      }
      if ((i = this.options.features) != null && i.enhancedInsights) {
        const a = async () => {
          if (this.tools.has("enhancedInsights")) return;
          const l = new ho(
            this.options
          );
          await l.initialize(), this.tools.set("enhancedInsights", l);
        };
        Ze() && await a(), this.options.requireConsent && Ys((l) => {
          if (l)
            a();
          else {
            const c = this.tools.get("enhancedInsights");
            c && (c.destroy(), c.clearData(), this.tools.delete("enhancedInsights"));
          }
        });
      }
      return this._isInitialized = !0, !0;
    } catch (o) {
      return console.error("Failed to initialize EkteIntelligens SDK:", o), !1;
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
    Ie(e);
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
const po = "1.3.1";
typeof window < "u" && (window.EkteIntelligensSDK = fo, console.log(`EI SDK ${po} loaded`, {
  path: window.location.pathname
}));
export {
  fo as EkteIntelligensSDK
};
