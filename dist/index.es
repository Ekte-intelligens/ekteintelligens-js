var ur = Object.defineProperty;
var dr = (i, e, t) => e in i ? ur(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var g = (i, e, t) => dr(i, typeof e != "symbol" ? e + "" : e, t);
const le = class le {
  constructor(e) {
    g(this, "inputMapping");
    g(this, "content", {});
    g(this, "sessionId");
    g(this, "hasEmailOrPhone", !1);
    g(this, "onContentUpdate");
    // One stable reference: `.bind(this)` returns a new function on every
    // call, so removeEventListener(this.handleInputBlur.bind(this)) never
    // removed anything and a stop/start cycle stacked duplicate listeners.
    // Adding the same reference twice is a no-op, so restarts are safe too.
    g(this, "boundHandleInputBlur", (e) => this.handleInputBlur(e));
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
    if (le.IGNORED_INPUT_TYPES.has(t)) return !0;
    const s = (e.getAttribute("autocomplete") || "").toLowerCase();
    return /(^|\s)(cc-[a-z-]+|current-password|new-password|one-time-code)(\s|$)/.test(
      s
    ) ? !0 : le.SENSITIVE_NAME.test(e.name || "") || le.SENSITIVE_NAME.test(e.id || "");
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
g(le, "IGNORED_INPUT_TYPES", /* @__PURE__ */ new Set([
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
g(le, "SENSITIVE_NAME", /passw|passord|pwd|cvc|cvv|card[-_ ]?(number|(num|no)([^a-z]|$))|security[-_ ]?code|kontonummer|account[-_ ]?number|personnummer|f[oø]dselsnummer|(^|[^a-z])(ssn|iban)([^a-z]|$)|(^|[^a-z])cc[-_]?(number|num|csc|exp)/i);
let ft = le;
class hr {
  constructor(e) {
    g(this, "productMapping");
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
        const a = t.split(",").map((c) => c.trim());
        for (const c of a)
          try {
            const l = e.querySelector(c);
            if (l)
              return ((r = l.textContent) == null ? void 0 : r.trim()) || null;
          } catch (l) {
            console.warn(
              `Invalid selector in comma list: ${c}`,
              l
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
class fr {
  constructor(e) {
    g(this, "totalSelector");
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
        const c = r.lastIndexOf(","), l = r.lastIndexOf(".");
        c > l ? r.substring(c + 1).length === 2 ? (r = r.replace(/\./g, ""), r = r.replace(",", ".")) : r = r.replace(/,/g, "") : r = r.replace(/,/g, "");
      } else if (n && !o) {
        const c = r.match(/,/g);
        if ((c ? c.length : 0) > 1)
          r = r.replace(/,/g, "");
        else {
          const u = r.match(/,(\d+)$/);
          u && u[1].length === 3 ? r = r.replace(",", "") : r = r.replace(",", ".");
        }
      } else if (!n && o) {
        const c = r.match(/\./g);
        if ((c ? c.length : 0) > 1)
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
const pr = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ke).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class $t extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class gr extends $t {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class Qt extends $t {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Zt extends $t {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var pt;
(function(i) {
  i.Any = "any", i.ApNortheast1 = "ap-northeast-1", i.ApNortheast2 = "ap-northeast-2", i.ApSouth1 = "ap-south-1", i.ApSoutheast1 = "ap-southeast-1", i.ApSoutheast2 = "ap-southeast-2", i.CaCentral1 = "ca-central-1", i.EuCentral1 = "eu-central-1", i.EuWest1 = "eu-west-1", i.EuWest2 = "eu-west-2", i.EuWest3 = "eu-west-3", i.SaEast1 = "sa-east-1", i.UsEast1 = "us-east-1", i.UsWest1 = "us-west-1", i.UsWest2 = "us-west-2";
})(pt || (pt = {}));
var mr = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
class yr {
  constructor(e, { headers: t = {}, customFetch: s, region: r = pt.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = pr(s);
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
    return mr(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: n, body: o } = t;
        let a = {}, { region: c } = t;
        c || (c = this.region);
        const l = new URL(`${this.url}/${e}`);
        c && c !== "any" && (a["x-region"] = c, l.searchParams.set("forceFunctionRegion", c));
        let u;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", u = o) : typeof FormData < "u" && o instanceof FormData ? u = o : (a["Content-Type"] = "application/json", u = JSON.stringify(o)));
        const d = yield this.fetch(l.toString(), {
          method: n || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: u
        }).catch((y) => {
          throw new gr(y);
        }), h = d.headers.get("x-relay-error");
        if (h && h === "true")
          throw new Qt(d);
        if (!d.ok)
          throw new Zt(d);
        let f = ((s = d.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield d.json() : f === "application/octet-stream" ? p = yield d.blob() : f === "text/event-stream" ? p = d : f === "multipart/form-data" ? p = yield d.formData() : p = yield d.text(), { data: p, error: null, response: d };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof Zt || r instanceof Qt ? r.context : void 0
        };
      }
    });
  }
}
var F = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function vr(i) {
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
var U = {}, Rt = {}, Je = {}, Le = {}, Ye = {}, Xe = {}, br = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, Se = br();
const _r = Se.fetch, Ss = Se.fetch.bind(Se), ks = Se.Headers, wr = Se.Request, Sr = Se.Response, ke = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: ks,
  Request: wr,
  Response: Sr,
  default: Ss,
  fetch: _r
}, Symbol.toStringTag, { value: "Module" })), kr = /* @__PURE__ */ vr(ke);
var Qe = {};
Object.defineProperty(Qe, "__esModule", { value: !0 });
let Er = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
Qe.default = Er;
var Es = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Xe, "__esModule", { value: !0 });
const Cr = Es(kr), Ir = Es(Qe);
let Ar = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = Cr.default : this.fetch = fetch;
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
      var o, a, c;
      let l = null, u = null, d = null, h = n.status, f = n.statusText;
      if (n.ok) {
        if (this.method !== "HEAD") {
          const b = await n.text();
          b === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = b : u = JSON.parse(b));
        }
        const y = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), m = (a = n.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        y && m && m.length > 1 && (d = parseInt(m[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (l = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const y = await n.text();
        try {
          l = JSON.parse(y), Array.isArray(l) && n.status === 404 && (u = [], l = null, h = 200, f = "OK");
        } catch {
          n.status === 404 && y === "" ? (h = 204, f = "No Content") : l = {
            message: y
          };
        }
        if (l && this.isMaybeSingle && (!((c = l == null ? void 0 : l.details) === null || c === void 0) && c.includes("0 rows")) && (l = null, h = 200, f = "OK"), l && this.shouldThrowOnError)
          throw new Ir.default(l);
      }
      return {
        error: l,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (r = r.catch((n) => {
      var o, a, c;
      return {
        error: {
          message: `${(o = n == null ? void 0 : n.name) !== null && o !== void 0 ? o : "FetchError"}: ${n == null ? void 0 : n.message}`,
          details: `${(a = n == null ? void 0 : n.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(c = n == null ? void 0 : n.code) !== null && c !== void 0 ? c : ""}`
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
Xe.default = Ar;
var Tr = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Ye, "__esModule", { value: !0 });
const Pr = Tr(Xe);
let xr = class extends Pr.default {
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
    const c = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      r ? "buffers" : null,
      n ? "wal" : null
    ].filter(Boolean).join("|"), l = (a = this.headers.Accept) !== null && a !== void 0 ? a : "application/json";
    return this.headers.Accept = `application/vnd.pgrst.plan+${o}; for="${l}"; options=${c};`, o === "json" ? this : this;
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
Ye.default = xr;
var Or = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Le, "__esModule", { value: !0 });
const jr = Or(Ye);
let $r = class extends jr.default {
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
Le.default = $r;
var Rr = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Je, "__esModule", { value: !0 });
const Ce = Rr(Le);
let Dr = class {
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
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new Ce.default({
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
      const o = e.reduce((a, c) => a.concat(Object.keys(c)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new Ce.default({
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
      const c = e.reduce((l, u) => l.concat(Object.keys(u)), []);
      if (c.length > 0) {
        const l = [...new Set(c)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", l.join(","));
      }
    }
    return new Ce.default({
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
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new Ce.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new Ce.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Je.default = Dr;
var Ze = {}, et = {};
Object.defineProperty(et, "__esModule", { value: !0 });
et.version = void 0;
et.version = "0.0.0-automated";
Object.defineProperty(Ze, "__esModule", { value: !0 });
Ze.DEFAULT_HEADERS = void 0;
const Lr = et;
Ze.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Lr.version}` };
var Cs = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Rt, "__esModule", { value: !0 });
const Nr = Cs(Je), Ur = Cs(Le), Fr = Ze;
let Mr = class Is {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, Fr.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new Nr.default(t, {
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
    return new Is(this.url, {
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
    let c;
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (o = "POST", c = t);
    const l = Object.assign({}, this.headers);
    return n && (l.Prefer = `count=${n}`), new Ur.default({
      method: o,
      url: a,
      headers: l,
      schema: this.schemaName,
      body: c,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Rt.default = Mr;
var Ee = F && F.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(U, "__esModule", { value: !0 });
U.PostgrestError = U.PostgrestBuilder = U.PostgrestTransformBuilder = U.PostgrestFilterBuilder = U.PostgrestQueryBuilder = U.PostgrestClient = void 0;
const As = Ee(Rt);
U.PostgrestClient = As.default;
const Ts = Ee(Je);
U.PostgrestQueryBuilder = Ts.default;
const Ps = Ee(Le);
U.PostgrestFilterBuilder = Ps.default;
const xs = Ee(Ye);
U.PostgrestTransformBuilder = xs.default;
const Os = Ee(Xe);
U.PostgrestBuilder = Os.default;
const js = Ee(Qe);
U.PostgrestError = js.default;
var Br = U.default = {
  PostgrestClient: As.default,
  PostgrestQueryBuilder: Ts.default,
  PostgrestFilterBuilder: Ps.default,
  PostgrestTransformBuilder: xs.default,
  PostgrestBuilder: Os.default,
  PostgrestError: js.default
};
const {
  PostgrestClient: qr,
  PostgrestQueryBuilder: So,
  PostgrestFilterBuilder: ko,
  PostgrestTransformBuilder: Eo,
  PostgrestBuilder: Co,
  PostgrestError: Io
} = Br;
function zr() {
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
const Hr = zr(), Kr = "2.11.15", Vr = `realtime-js/${Kr}`, Wr = "1.0.0", $s = 1e4, Gr = 1e3;
var Ae;
(function(i) {
  i[i.connecting = 0] = "connecting", i[i.open = 1] = "open", i[i.closing = 2] = "closing", i[i.closed = 3] = "closed";
})(Ae || (Ae = {}));
var R;
(function(i) {
  i.closed = "closed", i.errored = "errored", i.joined = "joined", i.joining = "joining", i.leaving = "leaving";
})(R || (R = {}));
var q;
(function(i) {
  i.close = "phx_close", i.error = "phx_error", i.join = "phx_join", i.reply = "phx_reply", i.leave = "phx_leave", i.access_token = "access_token";
})(q || (q = {}));
var gt;
(function(i) {
  i.websocket = "websocket";
})(gt || (gt = {}));
var ce;
(function(i) {
  i.Connecting = "connecting", i.Open = "open", i.Closing = "closing", i.Closed = "closed";
})(ce || (ce = {}));
class Jr {
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
    const c = s.decode(e.slice(o, o + n));
    o = o + n;
    const l = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: c, payload: l };
  }
}
class Rs {
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
var I;
(function(i) {
  i.abstime = "abstime", i.bool = "bool", i.date = "date", i.daterange = "daterange", i.float4 = "float4", i.float8 = "float8", i.int2 = "int2", i.int4 = "int4", i.int4range = "int4range", i.int8 = "int8", i.int8range = "int8range", i.json = "json", i.jsonb = "jsonb", i.money = "money", i.numeric = "numeric", i.oid = "oid", i.reltime = "reltime", i.text = "text", i.time = "time", i.timestamp = "timestamp", i.timestamptz = "timestamptz", i.timetz = "timetz", i.tsrange = "tsrange", i.tstzrange = "tstzrange";
})(I || (I = {}));
const es = (i, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((n, o) => (n[o] = Yr(o, i, e, r), n), {});
}, Yr = (i, e, t, s) => {
  const r = e.find((a) => a.name === i), n = r == null ? void 0 : r.type, o = t[i];
  return n && !s.includes(n) ? Ds(n, o) : mt(o);
}, Ds = (i, e) => {
  if (i.charAt(0) === "_") {
    const t = i.slice(1, i.length);
    return en(e, t);
  }
  switch (i) {
    case I.bool:
      return Xr(e);
    case I.float4:
    case I.float8:
    case I.int2:
    case I.int4:
    case I.int8:
    case I.numeric:
    case I.oid:
      return Qr(e);
    case I.json:
    case I.jsonb:
      return Zr(e);
    case I.timestamp:
      return tn(e);
    case I.abstime:
    case I.date:
    case I.daterange:
    case I.int4range:
    case I.int8range:
    case I.money:
    case I.reltime:
    case I.text:
    case I.time:
    case I.timestamptz:
    case I.timetz:
    case I.tsrange:
    case I.tstzrange:
      return mt(e);
    default:
      return mt(e);
  }
}, mt = (i) => i, Xr = (i) => {
  switch (i) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return i;
  }
}, Qr = (i) => {
  if (typeof i == "string") {
    const e = parseFloat(i);
    if (!Number.isNaN(e))
      return e;
  }
  return i;
}, Zr = (i) => {
  if (typeof i == "string")
    try {
      return JSON.parse(i);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), i;
    }
  return i;
}, en = (i, e) => {
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
    return n.map((a) => Ds(e, a));
  }
  return i;
}, tn = (i) => typeof i == "string" ? i.replace(" ", "T") : i, Ls = (i) => {
  let e = i;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class it {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = $s) {
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
var ts;
(function(i) {
  i.SYNC = "sync", i.JOIN = "join", i.LEAVE = "leave";
})(ts || (ts = {}));
class Te {
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
      this.joinRef = this.channel._joinRef(), this.state = Te.syncState(this.state, r, n, o), this.pendingDiffs.forEach((c) => {
        this.state = Te.syncDiff(this.state, c, n, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = Te.syncDiff(this.state, r, n, o), a());
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
    const n = this.cloneDeep(e), o = this.transformState(t), a = {}, c = {};
    return this.map(n, (l, u) => {
      o[l] || (c[l] = u);
    }), this.map(o, (l, u) => {
      const d = n[l];
      if (d) {
        const h = u.map((m) => m.presence_ref), f = d.map((m) => m.presence_ref), p = u.filter((m) => f.indexOf(m.presence_ref) < 0), y = d.filter((m) => h.indexOf(m.presence_ref) < 0);
        p.length > 0 && (a[l] = p), y.length > 0 && (c[l] = y);
      } else
        a[l] = u;
    }), this.syncDiff(n, { joins: a, leaves: c }, s, r);
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
    }), this.map(n, (a, c) => {
      var l;
      const u = (l = e[a]) !== null && l !== void 0 ? l : [];
      if (e[a] = this.cloneDeep(c), u.length > 0) {
        const d = e[a].map((f) => f.presence_ref), h = u.filter((f) => d.indexOf(f.presence_ref) < 0);
        e[a].unshift(...h);
      }
      s(a, u, c);
    }), this.map(o, (a, c) => {
      let l = e[a];
      if (!l)
        return;
      const u = c.map((d) => d.presence_ref);
      l = l.filter((d) => u.indexOf(d.presence_ref) < 0), e[a] = l, r(a, l, c), l.length === 0 && delete e[a];
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
var ss;
(function(i) {
  i.ALL = "*", i.INSERT = "INSERT", i.UPDATE = "UPDATE", i.DELETE = "DELETE";
})(ss || (ss = {}));
var rs;
(function(i) {
  i.BROADCAST = "broadcast", i.PRESENCE = "presence", i.POSTGRES_CHANGES = "postgres_changes", i.SYSTEM = "system";
})(rs || (rs = {}));
var W;
(function(i) {
  i.SUBSCRIBED = "SUBSCRIBED", i.TIMED_OUT = "TIMED_OUT", i.CLOSED = "CLOSED", i.CHANNEL_ERROR = "CHANNEL_ERROR";
})(W || (W = {}));
class Dt {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = R.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new it(this, q.join, this.params, this.timeout), this.rejoinTimer = new Rs(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = R.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = R.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = R.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = R.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(q.reply, {}, (r, n) => {
      this._trigger(this._replyEventName(n), r);
    }), this.presence = new Te(this), this.broadcastEndpointURL = Ls(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == R.closed) {
      const { config: { broadcast: n, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(W.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(W.CLOSED));
      const c = {}, l = {
        broadcast: n,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((u) => u.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (c.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: l }, c)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(W.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, p = [];
          for (let y = 0; y < f; y++) {
            const m = h[y], { filter: { event: b, schema: E, table: v, filter: w } } = m, A = u && u[y];
            if (A && A.event === b && A.schema === E && A.table === v && A.filter === w)
              p.push(Object.assign(Object.assign({}, m), { id: A.id }));
            else {
              this.unsubscribe(), this.state = R.errored, e == null || e(W.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(W.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = R.errored, e == null || e(W.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(W.TIMED_OUT);
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
      const { event: n, payload: o } = e, c = {
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
        const l = await this._fetchWithTimeout(this.broadcastEndpointURL, c, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((r = l.body) === null || r === void 0 ? void 0 : r.cancel()), l.ok ? "ok" : "error";
      } catch (l) {
        return l.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((n) => {
        var o, a, c;
        const l = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((c = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || c === void 0) && c.ack) && n("ok"), l.receive("ok", () => n("ok")), l.receive("error", () => n("error")), l.receive("timeout", () => n("timed out"));
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
    this.state = R.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(q.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let s = null;
    return new Promise((r) => {
      s = new it(this, q.leave, {}, e), s.receive("ok", () => {
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
    let r = new it(this, e, t, s);
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
    const o = e.toLocaleLowerCase(), { close: a, error: c, leave: l, join: u } = q;
    if (s && [a, c, l, u].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let h = this._onMessage(o, t, s);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var p, y, m;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((m = (y = f.filter) === null || y === void 0 ? void 0 : y.event) === null || m === void 0 ? void 0 : m.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(h, s)) : (n = this.bindings[o]) === null || n === void 0 || n.filter((f) => {
      var p, y, m, b, E, v;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const w = f.id, A = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return w && ((y = t.ids) === null || y === void 0 ? void 0 : y.includes(w)) && (A === "*" || (A == null ? void 0 : A.toLocaleLowerCase()) === ((m = t.data) === null || m === void 0 ? void 0 : m.type.toLocaleLowerCase()));
        } else {
          const w = (E = (b = f == null ? void 0 : f.filter) === null || b === void 0 ? void 0 : b.event) === null || E === void 0 ? void 0 : E.toLocaleLowerCase();
          return w === "*" || w === ((v = t == null ? void 0 : t.event) === null || v === void 0 ? void 0 : v.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const p = h.data, { schema: y, table: m, commit_timestamp: b, type: E, errors: v } = p;
        h = Object.assign(Object.assign({}, {
          schema: y,
          table: m,
          commit_timestamp: b,
          eventType: E,
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
    return this.state === R.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === R.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === R.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === R.leaving;
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
      return !(((n = r.type) === null || n === void 0 ? void 0 : n.toLocaleLowerCase()) === s && Dt.isEqual(r.filter, t));
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
    this._on(q.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(q.error, {}, (t) => e(t));
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
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = R.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = es(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = es(e.columns, e.old_record)), t;
  }
}
const ns = () => {
}, sn = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class rn {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = $s, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = ns, this.ref = 0, this.logger = ns, this.conn = null, this.sendBuffer = [], this.serializer = new Jr(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (n) => {
      let o;
      return n ? o = n : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => ke).then(({ default: c }) => c(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${gt.websocket}`, this.httpEndpoint = Ls(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (n) => [1e3, 2e3, 5e3, 1e4][n - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (n, o) => o(JSON.stringify(n)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Rs(async () => {
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
      if (this.transport || (this.transport = Hr), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Wr }));
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
      case Ae.connecting:
        return ce.Connecting;
      case Ae.open:
        return ce.Open;
      case Ae.closing:
        return ce.Closing;
      default:
        return ce.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === ce.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((n) => n.topic === s);
    if (r)
      return r;
    {
      const n = new Dt(`realtime:${e}`, t, this);
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
        var c;
        (c = this.conn) === null || c === void 0 || c.send(a);
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
        version: Vr
      };
      t && s.updateJoinPayload(r), s.joinedOnce && s._isJoined() && s._push(q.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Gr, "hearbeat timeout");
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
    this.channels.forEach((e) => e._trigger(q.error));
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
      const s = new Blob([sn], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class Lt extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function j(i) {
  return typeof i == "object" && i !== null && "__isStorageError" in i;
}
class nn extends Lt {
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
class yt extends Lt {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var on = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
const Ns = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ke).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, an = () => on(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => ke)).Response : Response;
}), vt = (i) => {
  if (Array.isArray(i))
    return i.map((t) => vt(t));
  if (typeof i == "function" || i !== Object(i))
    return i;
  const e = {};
  return Object.entries(i).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (n) => n.toUpperCase().replace(/[-_]/g, ""));
    e[r] = vt(s);
  }), e;
}, cn = (i) => {
  if (typeof i != "object" || i === null)
    return !1;
  const e = Object.getPrototypeOf(i);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in i) && !(Symbol.iterator in i);
};
var he = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
const ot = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), ln = (i, e, t) => he(void 0, void 0, void 0, function* () {
  const s = yield an();
  i instanceof s && !(t != null && t.noResolveJson) ? i.json().then((r) => {
    const n = i.status || 500, o = (r == null ? void 0 : r.statusCode) || n + "";
    e(new nn(ot(r), n, o));
  }).catch((r) => {
    e(new yt(ot(r), r));
  }) : e(new yt(ot(i), i));
}), un = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" || !s ? r : (cn(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function Ne(i, e, t, s, r, n) {
  return he(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      i(t, un(e, s, r, n)).then((c) => {
        if (!c.ok)
          throw c;
        return s != null && s.noResolveJson ? c : c.json();
      }).then((c) => o(c)).catch((c) => ln(c, a, s));
    });
  });
}
function ze(i, e, t, s) {
  return he(this, void 0, void 0, function* () {
    return Ne(i, "GET", e, t, s);
  });
}
function G(i, e, t, s, r) {
  return he(this, void 0, void 0, function* () {
    return Ne(i, "POST", e, s, r, t);
  });
}
function bt(i, e, t, s, r) {
  return he(this, void 0, void 0, function* () {
    return Ne(i, "PUT", e, s, r, t);
  });
}
function dn(i, e, t, s) {
  return he(this, void 0, void 0, function* () {
    return Ne(i, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function Us(i, e, t, s, r) {
  return he(this, void 0, void 0, function* () {
    return Ne(i, "DELETE", e, s, r, t);
  });
}
var N = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
const hn = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, is = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class fn {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = Ns(r);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, r) {
    return N(this, void 0, void 0, function* () {
      try {
        let n;
        const o = Object.assign(Object.assign({}, is), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const c = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (n = new FormData(), n.append("cacheControl", o.cacheControl), c && n.append("metadata", this.encodeMetadata(c)), n.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (n = s, n.append("cacheControl", o.cacheControl), c && n.append("metadata", this.encodeMetadata(c))) : (n = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, c && (a["x-metadata"] = this.toBase64(this.encodeMetadata(c)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const l = this._removeEmptyFolders(t), u = this._getFinalPath(l), d = yield (e == "PUT" ? bt : G)(this.fetch, `${this.url}/object/${u}`, n, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: l, id: d.Id, fullPath: d.Key },
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
    return N(this, void 0, void 0, function* () {
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
    return N(this, void 0, void 0, function* () {
      const n = this._removeEmptyFolders(e), o = this._getFinalPath(n), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let c;
        const l = Object.assign({ upsert: is.upsert }, r), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(l.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (c = new FormData(), c.append("cacheControl", l.cacheControl), c.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (c = s, c.append("cacheControl", l.cacheControl)) : (c = s, u["cache-control"] = `max-age=${l.cacheControl}`, u["content-type"] = l.contentType);
        const d = yield bt(this.fetch, a.toString(), c, { headers: u });
        return {
          data: { path: n, fullPath: d.Key },
          error: null
        };
      } catch (c) {
        if (j(c))
          return { data: null, error: c };
        throw c;
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
    return N(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const r = Object.assign({}, this.headers);
        t != null && t.upsert && (r["x-upsert"] = "true");
        const n = yield G(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + n.url), a = o.searchParams.get("token");
        if (!a)
          throw new Lt("No token returned by API");
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
    return N(this, void 0, void 0, function* () {
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
    return N(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/object/move`, {
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
    return N(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield G(this.fetch, `${this.url}/object/copy`, {
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
    return N(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e), n = yield G(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
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
    return N(this, void 0, void 0, function* () {
      try {
        const r = yield G(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), n = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
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
    return N(this, void 0, void 0, function* () {
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = n ? `?${n}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield ze(this.fetch, `${this.url}/${r}/${a}${o}`, {
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
    return N(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield ze(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: vt(s), error: null };
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
    return N(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield dn(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (j(s) && s instanceof yt) {
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
    const a = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image" : "object", c = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {});
    c !== "" && r.push(c);
    let l = r.join("&");
    return l !== "" && (l = `?${l}`), {
      data: { publicUrl: encodeURI(`${this.url}/${a}/public/${s}${l}`) }
    };
  }
  /**
   * Deletes files within the same bucket
   *
   * @param paths An array of files to delete, including the path and file name. For example [`'folder/image.png'`].
   */
  remove(e) {
    return N(this, void 0, void 0, function* () {
      try {
        return { data: yield Us(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
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
    return N(this, void 0, void 0, function* () {
      try {
        const r = Object.assign(Object.assign(Object.assign({}, hn), t), { prefix: e || "" });
        return { data: yield G(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
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
const pn = "2.10.4", gn = { "X-Client-Info": `storage-js/${pn}` };
var pe = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
class mn {
  constructor(e, t = {}, s, r) {
    const n = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase.")), this.url = n.href, this.headers = Object.assign(Object.assign({}, gn), t), this.fetch = Ns(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield ze(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
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
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield ze(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
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
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/bucket`, {
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
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield bt(this.fetch, `${this.url}/bucket/${e}`, {
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
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield G(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
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
    return pe(this, void 0, void 0, function* () {
      try {
        return { data: yield Us(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (j(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class yn extends mn {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new fn(this.url, this.headers, e, this.fetch);
  }
}
const vn = "2.53.0";
let Ie = "";
typeof Deno < "u" ? Ie = "deno" : typeof document < "u" ? Ie = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? Ie = "react-native" : Ie = "node";
const bn = { "X-Client-Info": `supabase-js-${Ie}/${vn}` }, _n = {
  headers: bn
}, wn = {
  schema: "public"
}, Sn = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, kn = {};
var En = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
const Cn = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = Ss : e = fetch, (...t) => e(...t);
}, In = () => typeof Headers > "u" ? ks : Headers, An = (i, e, t) => {
  const s = Cn(t), r = In();
  return (n, o) => En(void 0, void 0, void 0, function* () {
    var a;
    const c = (a = yield e()) !== null && a !== void 0 ? a : i;
    let l = new r(o == null ? void 0 : o.headers);
    return l.has("apikey") || l.set("apikey", i), l.has("Authorization") || l.set("Authorization", `Bearer ${c}`), s(n, Object.assign(Object.assign({}, o), { headers: l }));
  });
};
var Tn = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
function Pn(i) {
  return i.endsWith("/") ? i : i + "/";
}
function xn(i, e) {
  var t, s;
  const { db: r, auth: n, realtime: o, global: a } = i, { db: c, auth: l, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, c), r),
    auth: Object.assign(Object.assign({}, l), n),
    realtime: Object.assign(Object.assign({}, u), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => Tn(this, void 0, void 0, function* () {
      return "";
    })
  };
  return i.accessToken ? h.accessToken = i.accessToken : delete h.accessToken, h;
}
const Fs = "2.71.1", be = 30 * 1e3, _t = 3, at = _t * be, On = "http://localhost:9999", jn = "supabase.auth.token", $n = { "X-Client-Info": `gotrue-js/${Fs}` }, wt = "X-Supabase-Api-Version", Ms = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, Rn = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Dn = 10 * 60 * 1e3;
class Nt extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function _(i) {
  return typeof i == "object" && i !== null && "__isAuthError" in i;
}
class Ln extends Nt {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function Nn(i) {
  return _(i) && i.name === "AuthApiError";
}
class Bs extends Nt {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class ne extends Nt {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class Z extends ne {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Un(i) {
  return _(i) && i.name === "AuthSessionMissingError";
}
class Fe extends ne {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class Me extends ne {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class Be extends ne {
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
function Fn(i) {
  return _(i) && i.name === "AuthImplicitGrantRedirectError";
}
class os extends ne {
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
class St extends ne {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function ct(i) {
  return _(i) && i.name === "AuthRetryableFetchError";
}
class as extends ne {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class kt extends ne {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const He = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), cs = ` 	
\r=`.split(""), Mn = (() => {
  const i = new Array(128);
  for (let e = 0; e < i.length; e += 1)
    i[e] = -1;
  for (let e = 0; e < cs.length; e += 1)
    i[cs[e].charCodeAt(0)] = -2;
  for (let e = 0; e < He.length; e += 1)
    i[He[e].charCodeAt(0)] = e;
  return i;
})();
function ls(i, e, t) {
  if (i !== null)
    for (e.queue = e.queue << 8 | i, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(He[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(He[s]), e.queuedBits -= 6;
    }
}
function qs(i, e, t) {
  const s = Mn[i];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(i)}"`);
  }
}
function us(i) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, n = (o) => {
    zn(o, s, t);
  };
  for (let o = 0; o < i.length; o += 1)
    qs(i.charCodeAt(o), r, n);
  return e.join("");
}
function Bn(i, e) {
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
function qn(i, e) {
  for (let t = 0; t < i.length; t += 1) {
    let s = i.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (i.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    Bn(s, e);
  }
}
function zn(i, e, t) {
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
function Hn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < i.length; r += 1)
    qs(i.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function Kn(i) {
  const e = [];
  return qn(i, (t) => e.push(t)), new Uint8Array(e);
}
function Vn(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return i.forEach((r) => ls(r, t, s)), ls(null, t, s), e.join("");
}
function Wn(i) {
  return Math.round(Date.now() / 1e3) + i;
}
function Gn() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(i) {
    const e = Math.random() * 16 | 0;
    return (i == "x" ? e : e & 3 | 8).toString(16);
  });
}
const M = () => typeof window < "u" && typeof document < "u", ie = {
  tested: !1,
  writable: !1
}, zs = () => {
  if (!M())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (ie.tested)
    return ie.writable;
  const i = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(i, i), globalThis.localStorage.removeItem(i), ie.tested = !0, ie.writable = !0;
  } catch {
    ie.tested = !0, ie.writable = !1;
  }
  return ie.writable;
};
function Jn(i) {
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
const Hs = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ke).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Yn = (i) => typeof i == "object" && i !== null && "status" in i && "ok" in i && "json" in i && typeof i.json == "function", _e = async (i, e, t) => {
  await i.setItem(e, JSON.stringify(t));
}, oe = async (i, e) => {
  const t = await i.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, Q = async (i, e) => {
  await i.removeItem(e);
};
class tt {
  constructor() {
    this.promise = new tt.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
tt.promiseConstructor = Promise;
function lt(i) {
  const e = i.split(".");
  if (e.length !== 3)
    throw new kt("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!Rn.test(e[s]))
      throw new kt("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(us(e[0])),
    payload: JSON.parse(us(e[1])),
    signature: Hn(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Xn(i) {
  return await new Promise((e) => {
    setTimeout(() => e(null), i);
  });
}
function Qn(i, e) {
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
function Zn(i) {
  return ("0" + i.toString(16)).substr(-2);
}
function ei() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let n = 0; n < 56; n++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, Zn).join("");
}
async function ti(i) {
  const t = new TextEncoder().encode(i), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((n) => String.fromCharCode(n)).join("");
}
async function si(i) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), i;
  const t = await ti(i);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function ge(i, e, t = !1) {
  const s = ei();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await _e(i, `${e}-code-verifier`, r);
  const n = await si(s);
  return [n, s === n ? "plain" : "s256"];
}
const ri = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function ni(i) {
  const e = i.headers.get(wt);
  if (!e || !e.match(ri))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function ii(i) {
  if (!i)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (i <= e)
    throw new Error("JWT has expired");
}
function oi(i) {
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
const ai = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function me(i) {
  if (!ai.test(i))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function ut() {
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
function ds(i) {
  return JSON.parse(JSON.stringify(i));
}
var ci = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
const ae = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), li = [502, 503, 504];
async function hs(i) {
  var e;
  if (!Yn(i))
    throw new St(ae(i), 0);
  if (li.includes(i.status))
    throw new St(ae(i), i.status);
  let t;
  try {
    t = await i.json();
  } catch (n) {
    throw new Bs(ae(n), n);
  }
  let s;
  const r = ni(i);
  if (r && r.getTime() >= Ms["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new as(ae(t), i.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new Z();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n, o) => n && typeof o == "string", !0))
    throw new as(ae(t), i.status, t.weak_password.reasons);
  throw new Ln(ae(t), i.status || 500, s);
}
const ui = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function S(i, e, t, s) {
  var r;
  const n = Object.assign({}, s == null ? void 0 : s.headers);
  n[wt] || (n[wt] = Ms["2024-01-01"].name), s != null && s.jwt && (n.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", c = await di(i, e, t + a, {
    headers: n,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(c) : { data: Object.assign({}, c), error: null };
}
async function di(i, e, t, s, r, n) {
  const o = ui(e, s, r, n);
  let a;
  try {
    a = await i(t, Object.assign({}, o));
  } catch (c) {
    throw console.error(c), new St(ae(c), 0);
  }
  if (a.ok || await hs(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (c) {
    await hs(c);
  }
}
function K(i) {
  var e;
  let t = null;
  gi(i) && (t = Object.assign({}, i), i.expires_at || (t.expires_at = Wn(i.expires_in)));
  const s = (e = i.user) !== null && e !== void 0 ? e : i;
  return { data: { session: t, user: s }, error: null };
}
function fs(i) {
  const e = K(i);
  return !e.error && i.weak_password && typeof i.weak_password == "object" && Array.isArray(i.weak_password.reasons) && i.weak_password.reasons.length && i.weak_password.message && typeof i.weak_password.message == "string" && i.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = i.weak_password), e;
}
function se(i) {
  var e;
  return { data: { user: (e = i.user) !== null && e !== void 0 ? e : i }, error: null };
}
function hi(i) {
  return { data: i, error: null };
}
function fi(i) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: n } = i, o = ci(i, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: r,
    verification_type: n
  }, c = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: c
    },
    error: null
  };
}
function pi(i) {
  return i;
}
function gi(i) {
  return i.access_token && i.refresh_token && i.expires_in;
}
const dt = ["global", "local", "others"];
var mi = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
class yi {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = Hs(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = dt[0]) {
    if (dt.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${dt.join(", ")}`);
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
        xform: se
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
      const { options: t } = e, s = mi(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: fi,
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
        xform: se
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
    var t, s, r, n, o, a, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (n = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && n !== void 0 ? n : ""
        },
        xform: pi
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (c = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((p) => {
        const y = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), m = JSON.parse(p.split(";")[1].split("=")[1]);
        l[`${m}Page`] = y;
      }), l.total = parseInt(h)), { data: Object.assign(Object.assign({}, d), l), error: null };
    } catch (l) {
      if (_(l))
        return { data: { users: [] }, error: l };
      throw l;
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
    me(e);
    try {
      return await S(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: se
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
    me(e);
    try {
      return await S(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: se
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
    me(e);
    try {
      return await S(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: se
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    me(e.userId);
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
    me(e.userId), me(e.id);
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
function ps(i = {}) {
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
function vi() {
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
const ye = {
  /**
   * @experimental
   */
  debug: !!(globalThis && zs() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Ks extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class bi extends Ks {
}
async function _i(i, e, t) {
  ye.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", i, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), ye.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", i);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(i, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      ye.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", i, r.name);
      try {
        return await t();
      } finally {
        ye.debug && console.log("@supabase/gotrue-js: navigatorLock: released", i, r.name);
      }
    } else {
      if (e === 0)
        throw ye.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", i), new bi(`Acquiring an exclusive Navigator LockManager lock "${i}" immediately failed`);
      if (ye.debug)
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
vi();
const wi = {
  url: On,
  storageKey: jn,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: $n,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function gs(i, e, t) {
  return await t();
}
const ve = {};
class $e {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = $e.nextInstanceID, $e.nextInstanceID += 1, this.instanceID > 0 && M() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, wi), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new yi({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = Hs(r.fetch), this.lock = r.lock || gs, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : M() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = _i : this.lock = gs, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : zs() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = ps(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = ps(this.memoryStorage)), M() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
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
    return (t = (e = ve[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    ve[this.storageKey] = Object.assign(Object.assign({}, ve[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = ve[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    ve[this.storageKey] = Object.assign(Object.assign({}, ve[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Fs}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = Jn(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), M() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: n } = await this._getSessionFromURL(t, s);
        if (n) {
          if (this._debug("#_initialize()", "error detecting session from URL", n), Fn(n)) {
            const c = (e = n.details) === null || e === void 0 ? void 0 : e.code;
            if (c === "identity_already_exists" || c === "identity_not_found" || c === "single_identity_not_deletable")
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
        error: new Bs("Unexpected error during initialization", t)
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
        xform: K
      }), { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
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
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await ge(this.storage, this.storageKey)), n = await S(this.fetch, "POST", `${this.url}/signup`, {
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
          xform: K
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
          xform: K
        });
      } else
        throw new Me("You must provide either an email or phone number and a password");
      const { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
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
          xform: fs
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
          xform: fs
        });
      } else
        throw new Me("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new Fe() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
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
    var t, s, r, n, o, a, c, l, u, d, h, f;
    let p, y;
    if ("message" in e)
      p = e.message, y = e.signature;
    else {
      const { chain: m, wallet: b, statement: E, options: v } = e;
      let w;
      if (M())
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
        if (typeof b != "object" || !(v != null && v.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        w = b;
      }
      const A = new URL((t = v == null ? void 0 : v.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in w && w.signIn) {
        const k = await w.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, v == null ? void 0 : v.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: A.host,
          uri: A.href
        }), E ? { statement: E } : null));
        let C;
        if (Array.isArray(k) && k[0] && typeof k[0] == "object")
          C = k[0];
        else if (k && typeof k == "object" && "signedMessage" in k && "signature" in k)
          C = k;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in C && "signature" in C && (typeof C.signedMessage == "string" || C.signedMessage instanceof Uint8Array) && C.signature instanceof Uint8Array)
          p = typeof C.signedMessage == "string" ? C.signedMessage : new TextDecoder().decode(C.signedMessage), y = C.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in w) || typeof w.signMessage != "function" || !("publicKey" in w) || typeof w != "object" || !w.publicKey || !("toBase58" in w.publicKey) || typeof w.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${A.host} wants you to sign in with your Solana account:`,
          w.publicKey.toBase58(),
          ...E ? ["", E, ""] : [""],
          "Version: 1",
          `URI: ${A.href}`,
          `Issued At: ${(r = (s = v == null ? void 0 : v.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n = v == null ? void 0 : v.signInWithSolana) === null || n === void 0) && n.notBefore ? [`Not Before: ${v.signInWithSolana.notBefore}`] : [],
          ...!((o = v == null ? void 0 : v.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${v.signInWithSolana.expirationTime}`] : [],
          ...!((a = v == null ? void 0 : v.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${v.signInWithSolana.chainId}`] : [],
          ...!((c = v == null ? void 0 : v.signInWithSolana) === null || c === void 0) && c.nonce ? [`Nonce: ${v.signInWithSolana.nonce}`] : [],
          ...!((l = v == null ? void 0 : v.signInWithSolana) === null || l === void 0) && l.requestId ? [`Request ID: ${v.signInWithSolana.requestId}`] : [],
          ...!((d = (u = v == null ? void 0 : v.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...v.signInWithSolana.resources.map((C) => `- ${C}`)
          ] : []
        ].join(`
`);
        const k = await w.signMessage(new TextEncoder().encode(p), "utf8");
        if (!k || !(k instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        y = k;
      }
    }
    try {
      const { data: m, error: b } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: Vn(y) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: K
      });
      if (b)
        throw b;
      return !m || !m.session || !m.user ? {
        data: { user: null, session: null },
        error: new Fe()
      } : (m.session && (await this._saveSession(m.session), await this._notifyAllSubscribers("SIGNED_IN", m.session)), { data: Object.assign({}, m), error: b });
    } catch (m) {
      if (_(m))
        return { data: { user: null, session: null }, error: m };
      throw m;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await oe(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: n, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: K
      });
      if (await Q(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !n || !n.session || !n.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new Fe()
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
        xform: K
      }), { data: c, error: l } = a;
      return l ? { data: { user: null, session: null }, error: l } : !c || !c.session || !c.user ? {
        data: { user: null, session: null },
        error: new Fe()
      } : (c.session && (await this._saveSession(c.session), await this._notifyAllSubscribers("SIGNED_IN", c.session)), { data: c, error: l });
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
        const { email: a, options: c } = e;
        let l = null, u = null;
        this.flowType === "pkce" && ([l, u] = await ge(this.storage, this.storageKey));
        const { error: d } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            email: a,
            data: (t = c == null ? void 0 : c.data) !== null && t !== void 0 ? t : {},
            create_user: (s = c == null ? void 0 : c.shouldCreateUser) !== null && s !== void 0 ? s : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            code_challenge: l,
            code_challenge_method: u
          },
          redirectTo: c == null ? void 0 : c.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: d };
      }
      if ("phone" in e) {
        const { phone: a, options: c } = e, { data: l, error: u } = await S(this.fetch, "POST", `${this.url}/otp`, {
          headers: this.headers,
          body: {
            phone: a,
            data: (r = c == null ? void 0 : c.data) !== null && r !== void 0 ? r : {},
            create_user: (n = c == null ? void 0 : c.shouldCreateUser) !== null && n !== void 0 ? n : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            channel: (o = c == null ? void 0 : c.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: l == null ? void 0 : l.message_id }, error: u };
      }
      throw new Me("You must provide either an email or phone number.");
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
        xform: K
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const c = o.session, l = o.user;
      return c != null && c.access_token && (await this._saveSession(c), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
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
      return this.flowType === "pkce" && ([n, o] = await ge(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: n, code_challenge_method: o }),
        headers: this.headers,
        xform: hi
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
          throw new Z();
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
      throw new Me("You must provide either an email or phone number and a type");
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
      const t = await oe(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < at : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await oe(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = ut();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (c, l, u) => (!o && l === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(c, l, u))
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
        xform: se
      }) : await this._useSession(async (t) => {
        var s, r, n;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new Z() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0,
          xform: se
        });
      });
    } catch (t) {
      if (_(t))
        return Un(t) && (await this._removeSession(), await Q(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
          throw new Z();
        const o = r.session;
        let a = null, c = null;
        this.flowType === "pkce" && e.email != null && ([a, c] = await ge(this.storage, this.storageKey));
        const { data: l, error: u } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: c }),
          jwt: o.access_token,
          xform: se
        });
        if (u)
          throw u;
        return o.user = l.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
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
        throw new Z();
      const t = Date.now() / 1e3;
      let s = t, r = !0, n = null;
      const { payload: o } = lt(e.access_token);
      if (o.exp && (s = o.exp, r = s <= t), r) {
        const { session: a, error: c } = await this._callRefreshToken(e.refresh_token);
        if (c)
          return { data: { user: null, session: null }, error: c };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        n = a;
      } else {
        const { data: a, error: c } = await this._getUser(e.access_token);
        if (c)
          throw c;
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
          throw new Z();
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
      if (!M())
        throw new Be("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new Be(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new os("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new Be("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new os("No code detected.");
        const { data: E, error: v } = await this._exchangeCodeForSession(e.code);
        if (v)
          throw v;
        const w = new URL(window.location.href);
        return w.searchParams.delete("code"), window.history.replaceState(window.history.state, "", w.toString()), { data: { session: E.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: n, refresh_token: o, expires_in: a, expires_at: c, token_type: l } = e;
      if (!n || !a || !o || !l)
        throw new Be("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      c && (h = parseInt(c));
      const f = h - u;
      f * 1e3 <= be && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const p = h - d;
      u - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, h, u) : u - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, h, u);
      const { data: y, error: m } = await this._getUser(n);
      if (m)
        throw m;
      const b = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: n,
        expires_in: d,
        expires_at: h,
        refresh_token: o,
        token_type: l,
        user: y.user
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
    const t = await oe(this.storage, `${this.storageKey}-code-verifier`);
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
        if (a && !(Nn(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await Q(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = Gn(), s = {
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
    this.flowType === "pkce" && ([s, r] = await ge(
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
        var o, a, c, l, u;
        const { data: d, error: h } = n;
        if (h)
          throw h;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (c = e.options) === null || c === void 0 ? void 0 : c.queryParams,
          skipBrowserRedirect: !0
        });
        return await S(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (u = (l = d.session) === null || l === void 0 ? void 0 : l.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (r)
        throw r;
      return M() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
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
      return await Qn(async (r) => (r > 0 && await Xn(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: K
      })), (r, n) => {
        const o = 200 * Math.pow(2, r);
        return n && ct(n) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < be;
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), M() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
      const r = await oe(this.storage, this.storageKey);
      if (r && this.userStorage) {
        let o = await oe(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await _e(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : ut();
      } else if (r && !r.user && !r.user) {
        const o = await oe(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await Q(this.storage, this.storageKey + "-user"), await _e(this.storage, this.storageKey, r)) : r.user = ut();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const n = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < at;
      if (this._debug(s, `session has${n ? "" : " not"} expired with margin of ${at}s`), n) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), ct(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
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
      throw new Z();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new tt();
      const { data: n, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!n.session)
        throw new Z();
      await this._saveSession(n.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", n.session);
      const a = { session: n.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (n) {
      if (this._debug(r, "error", n), _(n)) {
        const o = { session: null, error: n };
        return ct(n) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
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
        } catch (c) {
          n.push(c);
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
      !s && t.user && await _e(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const n = ds(r);
      await _e(this.storage, this.storageKey, n);
    } else {
      const r = ds(t);
      await _e(this.storage, this.storageKey, r);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await Q(this.storage, this.storageKey), await Q(this.storage, this.storageKey + "-code-verifier"), await Q(this.storage, this.storageKey + "-user"), this.userStorage && await Q(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && M() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), be);
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
              const r = Math.floor((s.expires_at * 1e3 - e) / be);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${be}ms, refresh threshold is ${_t} ticks`), r <= _t && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Ks)
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
    if (this._debug("#_handleVisibilityChange()"), !M() || !(window != null && window.addEventListener))
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
      const [n, o] = await ge(this.storage, this.storageKey), a = new URLSearchParams({
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
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: c, error: l } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return l ? { data: null, error: l } : (e.factorType === "totp" && (!((r = c == null ? void 0 : c.totp) === null || r === void 0) && r.qr_code) && (c.totp.qr_code = `data:image/svg+xml;utf-8,${c.totp.qr_code}`), { data: c, error: null });
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
      const { payload: o } = lt(r.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let c = a;
      ((s = (t = r.user.factors) === null || t === void 0 ? void 0 : t.filter((d) => d.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (c = "aal2");
      const u = o.amr || [];
      return { data: { currentLevel: a, nextLevel: c, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((a) => a.kid === e);
    if (s)
      return s;
    const r = Date.now();
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + Dn > r)
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
      const { header: r, payload: n, signature: o, raw: { header: a, payload: c } } = lt(s);
      t != null && t.allowExpired || ii(n.exp);
      const l = !r.alg || r.alg.startsWith("HS") || !r.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(r.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!l) {
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
      const u = oi(r.alg), d = await crypto.subtle.importKey("jwk", l, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, d, o, Kn(`${a}.${c}`)))
        throw new kt("Invalid JWT signature");
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
const Si = $e;
class ki extends Si {
  constructor(e) {
    super(e);
  }
}
var Ei = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        l(s.next(u));
      } catch (d) {
        o(d);
      }
    }
    function c(u) {
      try {
        l(s.throw(u));
      } catch (d) {
        o(d);
      }
    }
    function l(u) {
      u.done ? n(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(i, e || [])).next());
  });
};
class Ci {
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
    const a = Pn(e), c = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", c), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", c), this.storageUrl = new URL("storage/v1", c), this.functionsUrl = new URL("functions/v1", c);
    const l = `sb-${c.hostname.split(".")[0]}-auth-token`, u = {
      db: wn,
      realtime: kn,
      auth: Object.assign(Object.assign({}, Sn), { storageKey: l }),
      global: _n
    }, d = xn(s ?? {}, u);
    this.storageKey = (r = d.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (n = d.global.headers) !== null && n !== void 0 ? n : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = d.auth) !== null && o !== void 0 ? o : {}, this.headers, d.global.fetch), this.fetch = An(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new qr(new URL("rest/v1", c).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), this.storage = new yn(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new yr(this.functionsUrl.href, {
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
    return Ei(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: n, flowType: o, lock: a, debug: c }, l, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new ki({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), l),
      storageKey: n,
      autoRefreshToken: e,
      persistSession: t,
      detectSessionInUrl: s,
      storage: r,
      flowType: o,
      lock: a,
      debug: c,
      fetch: u,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: "Authorization" in this.headers
    });
  }
  _initRealtimeClient(e) {
    return new rn(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const Ii = (i, e, t) => new Ci(i, e, t);
function Ai() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const i = process.version.match(/^v(\d+)\./);
  return i ? parseInt(i[1], 10) <= 18 : !1;
}
Ai() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class st {
  constructor(e, t) {
    g(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = Ii(s, r);
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
   * Read back the restorable part of a cart session (products, session id,
   * our promo code) for the `?s=` id of an abandoned-cart link. The
   * function never returns the session's contact details.
   */
  async getCartRestore(e) {
    try {
      const { data: t, error: s } = await this.client.functions.invoke(
        "get-checkout-session-restore",
        {
          body: { id_short_encoded: e }
        }
      );
      if (s)
        return console.error(
          "Error calling get-checkout-session-restore function:",
          s
        ), null;
      const r = t;
      if (!r || typeof r.session_id != "string" || !Array.isArray(r.products))
        return null;
      const n = (o) => typeof o == "string" ? o : null;
      return {
        ...r,
        email: n(r.email),
        phone: n(r.phone),
        phone_country_code: n(r.phone_country_code)
      };
    } catch (t) {
      return console.error(
        "Error calling get-checkout-session-restore function:",
        t
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
          const a = this.text((o == null ? void 0 : o.rateplanId) ?? (o == null ? void 0 : o.ratePlanId)), c = (a ? t.get(a) : void 0) ?? this.text(o == null ? void 0 : o.displayName), l = this.text(o == null ? void 0 : o.currency) ?? this.text(e == null ? void 0 : e.currencyCode);
          for (const u of Array.isArray(o.ratesPerRoomConfig) ? o.ratesPerRoomConfig : []) {
            const d = this.text(u == null ? void 0 : u.hitKey);
            !d || (u == null ? void 0 : u.isLocked) === !0 || s.push({
              hitKey: d,
              roomId: n,
              ratePlanId: a,
              ratePlanName: c,
              price: this.amount(u == null ? void 0 : u.totalPrice),
              currency: l,
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
g(D, "API_BASE", "https://restapi.bookvisit.com"), g(D, "BASKET_PATH", "/baskets/basket-v1"), g(D, "SEARCH_PATH", "/accommodation/search-v1"), g(D, "ADD_ROOM_PATH", "/baskets/rooms/add-v1"), g(D, "TOKEN_COOKIE", "bv_jwt"), g(D, "TOKEN_POLL_MS", 200), g(D, "SEARCH_FILTER", {
  roomContent: "Full",
  packageContent: "Full",
  addOnContent: "Full",
  includeFullyBooked: !1,
  includeRooms: !0,
  includePackages: !1,
  includeSearchResultAlerts: !0
});
let Re = D;
class Vs {
  /**
   * The visitor's language code from browser settings ("en-US" -> "en",
   * "nb-NO" -> "nb"). Defaults to "en".
   */
  static getUserLocale() {
    return typeof navigator > "u" ? "en" : navigator.languages && navigator.languages.length > 0 ? navigator.languages[0].split("-")[0].toLowerCase() : navigator.language ? navigator.language.split("-")[0].toLowerCase() : "en";
  }
}
const rt = "assistantAnalyticsPayload", Ti = "ei_enhanced_insights", Pe = "ei_analytics", Ut = "ei_insights", Et = "ei_analytics_consent", Pi = 3500, xi = 10, Oi = 3, ji = 50, $i = 100, Ri = 8, Di = [
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
], Li = [
  "attribution_history",
  "touch_count",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_landing_page",
  "first_referrer",
  "first_date_visited",
  "enhanced_insights"
], Ni = 30 * 60 * 1e3;
function Ui(i) {
  let e = 0, t = -1 / 0;
  const s = i.filter((r) => typeof r.enteredAt == "number").sort((r, n) => r.enteredAt - n.enteredAt);
  for (const r of s)
    r.enteredAt - t > Ni && (e += 1), t = Math.max(r.enteredAt, r.enteredAt + Ct(r));
  return e;
}
function Fi() {
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
function Ct(i) {
  return typeof i.activeMs == "number" && i.activeMs > 0 ? i.activeMs : typeof i.leftAt == "number" && i.leftAt > i.enteredAt ? i.leftAt - i.enteredAt : 0;
}
let de = {}, we = null, De = !0, ms = !1, V;
const Ws = [];
function Gs(i) {
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
function Js() {
  if (V !== void 0) return V;
  V = null;
  try {
    if (de.cookieDomain)
      return V = de.cookieDomain.replace(/^\./, ""), V;
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
function xe(i, e) {
  try {
    const t = encodeURIComponent(JSON.stringify(e));
    if (t.length > Pi) return !1;
    const s = Js(), r = window.location.protocol === "https:" ? "; Secure" : "";
    return document.cookie = `${i}=${t}` + (s ? `; domain=.${s}` : "") + `; path=/; SameSite=Lax${r}`, !0;
  } catch {
    return !1;
  }
}
function It(i) {
  try {
    const e = Js();
    document.cookie = `${i}=` + (e ? `; domain=.${e}` : "") + "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
  }
}
function Ys(i) {
  const e = [];
  for (const t of Gs(i))
    try {
      const s = JSON.parse(t);
      s && typeof s == "object" && !Array.isArray(s) && e.push(s);
    } catch {
    }
  return e;
}
function Xs() {
  const i = {};
  for (const e of Ys(Ut))
    for (const [t, s] of Object.entries(e)) {
      if (!s || typeof s != "object" || Array.isArray(s))
        continue;
      const r = i[t];
      r && String(s.last_visit_at ?? "") <= String(r.last_visit_at ?? "") || (i[t] = s);
    }
  return i;
}
function Mi(i) {
  if (xe(Pe, i)) return;
  const e = Ke(i);
  for (let t = e.length - 1; t >= 2; t--) {
    const s = [e[0], ...e.slice(-(t - 1))];
    if (xe(Pe, Tt(s)))
      return;
  }
  e.length > 1 && xe(
    Pe,
    Tt([e[0], e[e.length - 1]])
  );
}
function Bi() {
  It(Pe);
}
function qi() {
  const i = Ys(Pe);
  if (i.length === 0) return null;
  const e = (r) => {
    const n = Ke(r), o = n[0], a = o && typeof o.date_visited == "string" ? o.date_visited : "";
    return { touches: n.length, at: a };
  };
  let t = i[0], s = e(t);
  for (const r of i.slice(1)) {
    const n = e(r);
    (n.touches > s.touches || n.touches === s.touches && !!n.at && (!s.at || n.at < s.at)) && (t = r, s = n);
  }
  return t;
}
function zi() {
  const i = rr();
  if (!i) return null;
  const { visits: e, time_per_page: t, ...s } = i, r = {};
  return Object.entries(t ?? {}).sort((n, o) => o[1] - n[1]).slice(0, xi).forEach(([n, o]) => {
    r[n] = o;
  }), { ...s, time_per_page: r };
}
function Hi() {
  try {
    if (typeof window > "u" || de.shareInsightsAcrossSubdomains === !1 || !nt())
      return;
    const i = zi();
    if (!i) return;
    const e = window.location.hostname, t = Xs();
    let s = Object.entries(t).filter(([n, o]) => n !== e && o && typeof o == "object").sort(
      (n, o) => {
        var a, c;
        return String(((a = n[1]) == null ? void 0 : a.last_visit_at) ?? "").localeCompare(
          String(((c = o[1]) == null ? void 0 : c.last_visit_at) ?? "")
        );
      }
    );
    s = s.slice(
      Math.max(0, s.length - (Oi - 1))
    );
    let r = i;
    for (; ; ) {
      const n = {};
      for (const [a, c] of s) n[a] = c;
      if (n[e] = r, xe(Ut, n)) return;
      if (s.length > 0) {
        s = s.slice(1);
        continue;
      }
      if (r.time_per_page) {
        const { time_per_page: a, ...c } = r;
        r = c;
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
function Ki() {
  if (typeof window > "u") return [];
  const i = Xs(), e = window.location.hostname;
  return Object.entries(i).filter(
    ([t, s]) => t !== e && s && typeof s == "object" && !Array.isArray(s)
  ).map(([, t]) => t);
}
function Vi(i, e) {
  if (e.length === 0) return i;
  const t = i ? [i, ...e] : e, s = (h) => typeof h == "number" && isFinite(h) ? h : 0;
  let r = 0, n = 0, o = 0;
  const a = [], c = {};
  let l = null, u = null;
  for (const h of t) {
    r += s(h.visit_count), n += s(h.session_count), o += s(h.total_time_seconds), typeof h.pages == "string" && h.pages.split(",").forEach((m) => {
      m && a.indexOf(m) === -1 && a.push(m);
    });
    const f = h.time_per_page;
    if (f && typeof f == "object" && !Array.isArray(f))
      for (const [m, b] of Object.entries(
        f
      ))
        c[m] = (c[m] ?? 0) + s(b);
    const p = typeof h.first_visit_at == "string" ? h.first_visit_at : null, y = typeof h.last_visit_at == "string" ? h.last_visit_at : null;
    p && (!l || p < l) && (l = p), y && (!u || y > u) && (u = y);
  }
  const d = {
    time_per_page: c,
    visit_count: r,
    unique_pages: a.length,
    total_time_seconds: o,
    pages: a.join(",")
  };
  return t.every((h) => typeof h.session_count == "number") && (d.session_count = n), l && (d.first_visit_at = l), u && (d.last_visit_at = u), i && Array.isArray(i.visits) && (d.visits = i.visits), d;
}
function Qs() {
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
function Wi() {
  if (ms || typeof window > "u") return;
  ms = !0;
  const i = () => {
    const e = Qs();
    e === !0 ? Oe(!0) : e === !1 && Oe(!1);
  };
  try {
    window.addEventListener("CookiebotOnConsentReady", i), window.addEventListener("CookiebotOnAccept", i), window.addEventListener("CookiebotOnDecline", i), window.addEventListener("OneTrustGroupsUpdated", i);
    const e = window.__tcfapi;
    typeof e == "function" && e("addEventListener", 2, (t, s) => {
      var r, n;
      !s || !t || (t.eventStatus === "tcloaded" || t.eventStatus === "useractioncomplete") && Oe(!!((n = (r = t.purpose) == null ? void 0 : r.consents) != null && n[1]));
    });
  } catch {
  }
}
function nt() {
  return Zs() ? !1 : !de.requireConsent || De;
}
function Zs() {
  return Gs(Et).indexOf("0") !== -1;
}
function er(i) {
  Ws.push(i);
}
function Oe(i) {
  const e = i !== De;
  if (De = i, i)
    It(Et), tr();
  else {
    xe(Et, 0), Bi(), It(Ut);
    try {
      sessionStorage.removeItem(rt);
    } catch {
    }
  }
  if (e)
    for (const t of Ws)
      try {
        t(i);
      } catch {
      }
}
function Gi() {
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
function At(i) {
  return Di.filter((e) => i[e] !== void 0).map((e) => e + "=" + String(i[e])).join("&");
}
function Ke(i) {
  if (!i) return [];
  const e = i.attribution_history;
  if (Array.isArray(e))
    return e.filter(
      (s) => !!s && typeof s == "object" && !Array.isArray(s)
    );
  const t = {};
  for (const [s, r] of Object.entries(i))
    Li.indexOf(s) === -1 && (t[s] = r);
  return Object.keys(t).length > 0 ? [t] : [];
}
function Ji(...i) {
  const e = /* @__PURE__ */ new Set(), t = [];
  for (const s of i)
    for (const r of s) {
      const n = String(r.date_visited ?? "") + "|" + At(r);
      e.has(n) || (e.add(n), t.push(r));
    }
  return t.sort(
    (s, r) => String(s.date_visited ?? "").localeCompare(String(r.date_visited ?? ""))
  );
}
function Yi(i) {
  return i.length <= Ri ? i : [i[0], ...i.slice(-7)];
}
function Xi(i, e) {
  if (i.length === 0) return [e];
  const t = At(e);
  return !t || t === At(i[i.length - 1]) ? i : Yi([...i, e]);
}
function Tt(i) {
  if (i.length === 0) return {};
  const e = i[0], s = { ...i[i.length - 1] }, r = (n, o) => {
    e[o] !== void 0 && (s[n] = e[o]);
  };
  return r("first_utm_source", "utm_source"), r("first_utm_medium", "utm_medium"), r("first_utm_campaign", "utm_campaign"), r("first_landing_page", "landing_page"), r("first_referrer", "referrer"), r("first_date_visited", "date_visited"), s.touch_count = i.length, s.attribution_history = i, s;
}
function tr() {
  if (!(typeof window > "u" || !we) && !Zs())
    try {
      window.sessionStorage && sessionStorage.setItem(
        rt,
        JSON.stringify(we)
      ), Mi(we);
    } catch {
    }
}
function Qi(i) {
  if (!(typeof window > "u")) {
    de = i ?? {}, V = void 0;
    try {
      const e = window.sessionStorage ? sessionStorage.getItem(rt) : null;
      let t = null;
      if (e) {
        const r = JSON.parse(e);
        r && typeof r == "object" && !Array.isArray(r) && (t = r);
      }
      const s = Xi(
        Ji(
          Ke(t),
          Ke(qi())
        ),
        Gi()
      );
      if (we = Tt(s), de.requireConsent) {
        Wi();
        const r = Qs();
        r === null ? De = !1 : Oe(r);
      } else
        De = !0, tr();
    } catch {
    }
  }
}
function sr(i) {
  let e = i.trim();
  if (!e) return "";
  const t = e.search(/[?#]/);
  return t >= 0 && (e = e.slice(0, t)), e.startsWith("/") || (e = "/" + e), e.length > 1 && e.endsWith("/") && (e = e.slice(0, -1)), e;
}
function Zi(i) {
  return sr(i).replace(/\./g, "_");
}
function rr() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const i = window.localStorage.getItem(Ti);
    if (!i) return null;
    const e = JSON.parse(i), t = Array.isArray(e == null ? void 0 : e.visits) ? e.visits.filter(
      (l) => l && typeof l.page == "string" && typeof l.enteredAt == "number"
    ) : [], s = t[0], r = t[t.length - 1];
    if (!s || !r) return null;
    const n = [];
    for (const l of t) {
      const u = sr(l.page);
      u && n.indexOf(u) === -1 && n.push(u);
    }
    const o = t.reduce((l, u) => l + Ct(u), 0), a = {};
    for (const l of t) {
      const u = Zi(l.page);
      u && (a[u] = (a[u] ?? 0) + Ct(l));
    }
    const c = {};
    return Object.entries(a).slice(0, $i).forEach(([l, u]) => {
      c[l] = Math.round(u / 1e3);
    }), {
      time_per_page: c,
      visits: t.slice(-ji),
      visit_count: t.length,
      session_count: Ui(t),
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
function eo() {
  try {
    if (!nt()) return null;
    let i = {};
    if (typeof window < "u" && window.sessionStorage) {
      const s = sessionStorage.getItem(rt);
      if (s) {
        const r = JSON.parse(s);
        r && typeof r == "object" && (i = r);
      }
    }
    Object.keys(i).length === 0 && we && (i = { ...we });
    let e = rr();
    de.shareInsightsAcrossSubdomains !== !1 && (e = Vi(
      e,
      Ki()
    )), e && (i.enhanced_insights = e);
    const t = Fi();
    return t && (i.device = t), Object.keys(i).length > 0 ? JSON.stringify(i) : null;
  } catch {
    return null;
  }
}
const Ve = "ei_stay_params", to = 7 * 24 * 60 * 60 * 1e3, so = 12 * 60 * 60 * 1e3, ro = 60, no = 864e5, io = [
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
let We = !0, re = null, ys = !1, vs = !1;
const bs = (i) => i < 10 ? "0" + i : String(i);
function qe(i, e, t) {
  if (i < 2e3 || i > 2100 || e < 1 || e > 12 || t < 1 || t > 31) return null;
  const s = new Date(Date.UTC(i, e - 1, t));
  return s.getUTCMonth() !== e - 1 || s.getUTCDate() !== t ? null : `${i}-${bs(e)}-${bs(t)}`;
}
function _s(i, e) {
  const t = i.trim();
  let s = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(t);
  if (s) {
    const h = qe(+s[1], +s[2], +s[3]);
    return h ? [h] : [];
  }
  if (s = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t), !s) return [];
  const r = +s[1], n = +s[2], o = +s[3];
  if (t.charAt(s[1].length) === ".") {
    const h = qe(o, n, r);
    return h ? [h] : [];
  }
  const c = qe(o, n, r), l = qe(o, r, n), u = [], d = e === "DMY" ? [c, l] : [l, c];
  for (const h of d)
    h && u.indexOf(h) === -1 && u.push(h);
  return u;
}
function nr(i, e) {
  const [t, s, r] = i.split("-").map(Number), [n, o, a] = e.split("-").map(Number);
  return Math.round(
    (Date.UTC(n, o - 1, a) - Date.UTC(t, s - 1, r)) / no
  );
}
const ir = (i, e) => {
  const t = nr(i, e);
  return t >= 1 && t <= ro;
}, ht = (i) => {
  if (i == null) return;
  const e = Number(i.trim());
  return Number.isInteger(e) && e >= 0 && e <= 99 ? e : void 0;
};
function oo(i) {
  let e;
  try {
    e = new URL(i);
  } catch {
    return null;
  }
  const t = e.searchParams, s = [];
  for (const [l, u, d] of io) {
    const h = t.get(l), f = t.get(u);
    if (!h || !f) continue;
    const p = _s(h, d), y = _s(f, d), m = [];
    for (const b of p)
      for (const E of y)
        ir(b, E) && m.push({ checkin: b, checkout: E });
    m.length > 0 && s.push(m);
  }
  if (s.length === 0) return null;
  let r = null;
  if (s.length > 1) {
    e: for (const l of s)
      for (const u of l)
        if (s.some(
          (h) => h !== l && h.some(
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
  }, o = ht(t.get("adults")), a = ht(t.get("children")), c = ht(t.get("guests"));
  return o !== void 0 ? n.adults = o : c !== void 0 && (n.adults = c), a !== void 0 && (n.children = a), n;
}
const or = (i, e = Date.now()) => {
  const t = Date.parse(i.captured_at);
  return Number.isFinite(t) && e - t >= 0 && e - t <= to;
};
function ao() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const i = window.localStorage.getItem(Ve);
    if (!i) return null;
    const e = JSON.parse(i);
    if (!e || typeof e != "object" || typeof e.checkin != "string" || typeof e.checkout != "string" || typeof e.captured_at != "string")
      return null;
    const t = e;
    return !or(t) || !ir(t.checkin, t.checkout) ? (window.localStorage.removeItem(Ve), null) : t;
  } catch {
    return null;
  }
}
function ar() {
  var i;
  if (!(typeof window > "u" || !re) && nt())
    try {
      (i = window.localStorage) == null || i.setItem(
        Ve,
        JSON.stringify(re)
      );
    } catch {
    }
}
function cr() {
  try {
    typeof window < "u" && window.localStorage && window.localStorage.removeItem(Ve);
  } catch {
  }
}
function Pt() {
  if (!We || typeof window > "u") return null;
  try {
    const i = oo(window.location.href);
    return i && (re = i, ar()), i;
  } catch {
    return null;
  }
}
function co(i) {
  if (We = (i == null ? void 0 : i.enabled) !== !1, !(!We || typeof window > "u")) {
    if (Pt(), !vs) {
      vs = !0;
      try {
        window.addEventListener("popstate", () => {
          Pt();
        });
      } catch {
      }
    }
    ys || (ys = !0, er((e) => {
      e ? ar() : cr();
    }));
  }
}
function lo() {
  if (!We) return null;
  const i = Pt();
  if (i) return i;
  if (re && or(re)) return re;
  const e = ao();
  return e && (re = e), e;
}
function uo() {
  re = null, cr();
}
function ho(i, e, t = so) {
  if (!e || !Array.isArray(i) || i.length === 0)
    return i;
  const s = Date.parse(e.captured_at);
  if (!Number.isFinite(s) || Date.now() - s > t)
    return i;
  let r = !1;
  const n = nr(e.checkin, e.checkout), o = i.map((a) => !a || typeof a != "object" || a.startDate || a.endDate || String(a.type ?? "").toLowerCase() === "addon" ? a : (r = !0, {
    ...a,
    startDate: e.checkin,
    endDate: e.checkout,
    nights: n,
    ei_stay_source: "url"
  }));
  return r ? o : i;
}
let ws = !1;
const z = class z {
  constructor(e) {
    g(this, "options");
    g(this, "supabaseService");
    g(this, "inputDetector");
    g(this, "productDetector");
    g(this, "totalExtractor");
    g(this, "campaign");
    g(this, "totalAverage", 0);
    g(this, "_sessionId");
    g(this, "isInitialized", !1);
    g(this, "previousContent", {});
    g(this, "previousProducts", []);
    g(this, "previousTotal", 0);
    g(this, "debounceTimer");
    g(this, "pendingContentUpdate");
    g(this, "isSubmitting", !1);
    // Lock to prevent concurrent submissions
    // Our injected autofield section and its per-field wrappers. Kept in
    // memory while off the page so typed values survive being re-added.
    g(this, "autofieldSection");
    g(this, "autofieldWrappers", []);
    g(this, "autofieldObserver");
    g(this, "boundHandleAutofieldBlur", (e) => this.handleAutofieldBlur(e));
    g(this, "boundSaveAutofieldToStorage", (e) => {
      const t = e.target, s = z.AUTOFIELD_STORAGE_KEYS[t.name];
      s && t.value && this.saveToSessionStorage(s, t.value);
    });
    this.options = e, this.supabaseService = new st(
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
      return this.totalAverage = r != null && r.average_checkout_value ? r.average_checkout_value : 0, r ? (this.campaign = r, this.inputDetector = new ft(r.input_mapping), r.type !== "bookvisit" && r.type !== "synxis" && r.type !== "elinapms" && (this.productDetector = new hr(
        r.product_mapping
      ), this.totalExtractor = new fr(
        r.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), r.type === "bookvisit" && ((s = (t = r.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0 && window.location.pathname === "/checkout" && !ws && (ws = !0, this.injectBookVisitAutofields(r.input_mapping)), this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch checkout campaign data"), !1);
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
    var s, r, n, o, a, c, l, u, d, h;
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
        const C = await this.withBasketTimeout(
          this.fetchBookVisitBasket()
        );
        C && (f = C.products, p = C.total);
      } else if (((r = this.campaign) == null ? void 0 : r.type) === "synxis") {
        const C = await this.withBasketTimeout(
          this.fetchSynxisBasket()
        );
        C && (f = C.products, p = C.total);
      } else if (((n = this.campaign) == null ? void 0 : n.type) === "elinapms") {
        const C = await this.fetchElinapmsBasket();
        C && (f = C.products, p = C.total);
      } else
        f = ((o = this.productDetector) == null ? void 0 : o.detectProducts()) || [], p = ((a = this.totalExtractor) == null ? void 0 : a.extractTotal()) || this.totalAverage;
      const y = ((c = this.options.features) == null ? void 0 : c.stayCapture) === !1 ? null : lo();
      if (f = ho(f, y), !this.hasContentChanged(
        e,
        f,
        p
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const b = typeof window < "u" ? window.location.href : "", E = this._sessionId || t, v = this.withStay(eo(), y), w = { ...e }, A = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: w,
        products: f,
        url: b,
        total: p,
        id: E,
        ...v ? { analytics: v } : {},
        ...((l = this.campaign) == null ? void 0 : l.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {},
        ...((d = this.campaign) == null ? void 0 : d.type) === "bookvisit" && this._bookvisitSessionIds ? { metadata: this._bookvisitSessionIds } : {}
      }, k = await this.supabaseService.submitCartSession(A);
      k && k.id ? (this._sessionId = k.id, (h = this.inputDetector) == null || h.setSessionId(k.id), z.saveSessionIdToStorage(k.id), this.previousContent = w, this.previousProducts = [...f], this.previousTotal = p, console.log("Cart session updated successfully:", k.id)) : console.error("Failed to submit cart session");
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
      }, z.BASKET_FETCH_TIMEOUT_MS);
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
      this.clearSessionIdFromStorage(), this._sessionId = void 0, uo(), console.log("Completed checkout cleanup finished");
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
      const r = await new Re(e).getBasket();
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
      const o = (p) => typeof p == "string" && p.trim() ? p.trim() : typeof p == "number" && isFinite(p) ? String(p) : null, a = (e == null ? void 0 : e.booking) ?? {}, c = (a == null ? void 0 : a.bookingData) ?? {}, l = o(a == null ? void 0 : a.basketId) ?? o(a == null ? void 0 : a.id) ?? o(c == null ? void 0 : c.basketId) ?? o(e == null ? void 0 : e.basketId) ?? o(e == null ? void 0 : e.id), u = o(c == null ? void 0 : c.bookingNumber) ?? o(c == null ? void 0 : c.bookingCode) ?? o(c == null ? void 0 : c.reservationNumber) ?? o(a == null ? void 0 : a.bookingNumber) ?? o(a == null ? void 0 : a.bookingCode), d = o((t = c == null ? void 0 : c.customer) == null ? void 0 : t.countryCode) ?? o((s = c == null ? void 0 : c.customer) == null ? void 0 : s.country) ?? o((r = c == null ? void 0 : c.guest) == null ? void 0 : r.countryCode) ?? o((n = a == null ? void 0 : a.customer) == null ? void 0 : n.countryCode);
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
      return !l && !u && !h ? null : {
        shoppingCartId: l,
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
      const c = typeof ((n = a.customer) == null ? void 0 : n.countryCode) == "string" ? a.customer.countryCode : typeof ((o = a.customer) == null ? void 0 : o.country) == "string" ? a.customer.country : void 0, l = a.rooms || [], u = a.roomDescriptions || [], d = a.addOnDescriptions || [];
      l.forEach((f) => {
        var w, A, k, C;
        const p = u.find(
          ($) => $.id === f.roomId
        ), y = f.totalPrice || 0, m = (A = (w = p == null ? void 0 : p.images) == null ? void 0 : w[0]) == null ? void 0 : A.uri, b = (k = p == null ? void 0 : p.images) == null ? void 0 : k.map(
          ($) => $.uri
        ), E = {
          id: f.roomId,
          name: (p == null ? void 0 : p.name) || "Room",
          price: y,
          quantity: 1,
          type: "room",
          startDate: f.startDate,
          endDate: f.endDate,
          roomConfig: f.roomConfig,
          image: m,
          images: b,
          ...c ? { guestCountry: c } : {}
        };
        if (f.priceInfo && f.priceInfo.length > 0) {
          const $ = f.priceInfo[0].ratePlanId;
          $ && (E.ratePlanId = $);
          const J = (C = a.ratePlanDescriptions) == null ? void 0 : C.find(
            (H) => H.id === $
          );
          J && (E.ratePlan = J.name);
        }
        t.push(E), (f.mandatoryAddOns || []).forEach(($) => {
          const J = $.totalPrice || 0;
          if (J > 0) {
            const H = d.find(
              (Y) => Y.id === $.addOnId
            );
            t.push({
              id: $.addOnId,
              name: (H == null ? void 0 : H.name) || "Add-on",
              price: J,
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
            (m) => m.id === f.addOnId
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
    const t = z.AUTOFIELD_SELECTORS[e];
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
    const t = Vs.getUserLocale(), s = {
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
    const t = e.includes("firstName"), s = e.includes("lastName"), r = e.includes("email"), n = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber"), c = "bv:box-border bv:flex bv:h-[40px] bv:w-full bv:pl-[14px] bv:rounded-bv_inputRoundedCorners bv:border-solid bv:bv_inputBorder bv:disabled:cursor-not-allowed bv:disabled:opacity-50 bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:placeholder:text-bv_inputColor/70 bv:focus:outline-hidden! bv:focus:ring-2 bv:bg-bv_inputBackground bv:text-bv_inputColor";
    let l = '<div data-ei-autofield-grid class="bv:m-0 bv:grid bv:gap-[10px] bv:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bv:mt-[20px] bv:bv_small:grid-cols-1">';
    return t && (l += `
                <div data-ei-autofield="firstName" style="display: contents;">
                <label for="customer-firstName" class="bv:sr-only">Fornavn</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-firstName" autocomplete="given-name" class="${c}" data-testid="customer_info_form_firstname" placeholder="Fornavn *" name="firstName">
                </div>
                </div>
            `), s && (l += `
                <div data-ei-autofield="lastName" style="display: contents;">
                <label for="customer-lastName" class="bv:sr-only">Etternavn</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-lastName" autocomplete="family-name" class="${c}" data-testid="customer_info_form_lastname" placeholder="Etternavn *" name="lastName">
                </div>
                </div>
            `), r && (l += `
                <div data-ei-autofield="email" style="display: contents;">
                <label for="customer-emailAddress" class="bv:sr-only">${o}</label>
                <div class="bv:relative bv:w-full">
                    <input id="customer-emailAddress" autocomplete="email" class="${c}" data-testid="customer_info_form_email" placeholder="${o} *" type="email" name="emailAddress">
                </div>
                </div>
            `), n && (l += `
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
                                <input id="customer-phoneNumber" inputmode="tel" pattern="[0-9]*" autocomplete="tel-national" class="${c}" data-testid="checkout_phonenumber" placeholder="${a} *" type="tel" name="phoneNumber">
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            `), l += "</div>", `
            <div data-ei-autofields data-testid="checkout_responsible_for_booking_section" class="bv:mx-0 bv:px-0 bv:pt-0 bv:pb-[40px] bv:w-full" aria-label="Ansvarlig for bestilling" role="group" style="scroll-margin-top: 20px;">
                <div class="bv:mb-[15px] bv:flex bv:items-center bv:justify-between bv:gap-[15px]">
                    <div data-orientation="horizontal" role="none" class="bv:bg-bv_dividerBorderColor bv:h-bv_dividerBorderWidth bv:w-full bv:flex-1"></div>
                    <p class="bv:bv_text bv:font-bv_bodyBoldFontWeight bv:opacity-bv_bodyMutedOpacity bv:text-bv_bodyFontSize bv:font-bv_bodyFontFamily" role="group" tabindex="-1">Ansvarlig for bestilling</p>
                    <div data-orientation="horizontal" role="none" class="bv:bg-bv_dividerBorderColor bv:h-bv_dividerBorderWidth bv:w-full bv:flex-1"></div>
                </div>
                <div class="bv:rounded-bv_cardBorderRadius bv:border-bv_cardBorderWidth bv:border-bv_cardBorderColor bv:bg-bv_cardBackground bv:text-bv_cardColor bv:shadow-bv_cardBoxShadow bv_card bv:relative bv:border-solid bv:select-none [&_.bv_card]:bv:shadow-none [&_.bv_card]:bv:bg-bv_cardInnerBackground bv:p-[25px] bv:bv_small:p-[20px]" data-testid="customer_info_section">
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
    var o, a, c, l, u, d, h, f, p, y, m, b, E, v, w, A, k, C, $, J;
    const t = [];
    let s = 0;
    const r = this.getSynxisActualTotal(), n = this._synxisSessionIds;
    try {
      const H = (e == null ? void 0 : e.ShoppingCart) || [], Y = [];
      for (const P of H) {
        const x = ((a = (o = P == null ? void 0 : P.UpdatedData) == null ? void 0 : o.itinerary) == null ? void 0 : a.reservations) || [];
        for (const fe of x)
          Y.push({
            resv: fe,
            itineraryNumber: (P == null ? void 0 : P.Itemid) || ""
          });
      }
      let Ue = Y;
      if (n != null && n.sbeRcDecoded) {
        const P = Y.filter(
          ({ resv: x }) => x.id === n.sbeRcDecoded
        );
        P.length > 0 && (Ue = P);
      }
      Ue === Y && Y.length > 1 && (Ue = [...Y].sort(
        (P, x) => x.itineraryNumber.localeCompare(P.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: P } of Ue) {
        const x = P.extrasFromShopping || {}, fe = P.stayCriteria || {}, Ft = P.guestCriteria || {}, O = x.prices || {}, Mt = ((u = (l = (c = O == null ? void 0 : O.Total) == null ? void 0 : c.Price) == null ? void 0 : l.Total) == null ? void 0 : u.AmountWithTaxesFees) || ((f = (h = (d = O == null ? void 0 : O.Total) == null ? void 0 : d.Price) == null ? void 0 : h.Total) == null ? void 0 : f.Amount) || ((y = (p = O == null ? void 0 : O.Total) == null ? void 0 : p.Price) == null ? void 0 : y.Amount) || 0, Bt = ((O == null ? void 0 : O.Daily) || []).map((X) => {
          var qt, zt, Ht, Kt, Vt, Wt, Gt, Jt, Yt, Xt;
          return {
            date: X.Date,
            amount: ((zt = (qt = X.Price) == null ? void 0 : qt.Total) == null ? void 0 : zt.Amount) || ((Ht = X.Price) == null ? void 0 : Ht.Amount) || 0,
            amountWithTax: ((Vt = (Kt = X.Price) == null ? void 0 : Kt.Total) == null ? void 0 : Vt.AmountWithTaxesFees) || 0,
            tax: ((Gt = (Wt = X.Price) == null ? void 0 : Wt.Tax) == null ? void 0 : Gt.Amount) || 0,
            fees: ((Yt = (Jt = X.Price) == null ? void 0 : Jt.Fees) == null ? void 0 : Yt.Amount) || 0,
            currency: (Xt = X.Price) == null ? void 0 : Xt.CurrencyCode,
            inventory: X.AvailableInventory
          };
        }), lr = {
          id: P.id,
          confirmationNumber: P.confirmationNumber,
          itineraryNumber: P.itineraryNumber,
          name: x.displayname || "Room",
          roomCode: fe.roomCode,
          rateCode: fe.rateCode,
          price: Mt,
          actualTotal: r,
          dailyRate: x.amount || x.amountWithTaxesFees,
          currency: x.currencyCode,
          dailyPrices: Bt,
          taxes: ((E = (b = (m = O == null ? void 0 : O.Total) == null ? void 0 : m.Price) == null ? void 0 : b.Tax) == null ? void 0 : E.Amount) || 0,
          fees: ((A = (w = (v = O == null ? void 0 : O.Total) == null ? void 0 : v.Price) == null ? void 0 : w.Fees) == null ? void 0 : A.Amount) || 0,
          startDate: (k = fe.startDate) == null ? void 0 : k.split("T")[0],
          endDate: (C = fe.endDate) == null ? void 0 : C.split("T")[0],
          nights: Bt.length || null,
          adults: Ft.numAdults || 1,
          children: Ft.numChildren || 0,
          hotelId: String(P.hotelId),
          chainId: String(P.chainId),
          bedDescription: x.bedDescription,
          bedType: x.bedType,
          bedQuantity: x.bedQuantity,
          maxRoomSize: x.maxRoomSize,
          minRoomSize: x.minRoomSize,
          guestLimit: x.guestLimit,
          inventory: x.inventory,
          bookingPolicyCode: x.bookingPolicyCode,
          cancelPolicyCode: x.cancelPolicyCode,
          status: P.status,
          type: "room",
          quantity: 1,
          addons: P.addOns || [],
          image: x.coverImage || ((J = ($ = x.imageUrls) == null ? void 0 : $[0]) == null ? void 0 : J.Path) || null
        };
        t.push(lr), s += Mt;
      }
    } catch (H) {
      console.error("SynXis: Error extracting cart API data:", H);
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
        const a = o, c = this.readElinapmsStay(a) ?? s;
        return {
          id: a.dataset.id,
          name: a.dataset.tagname,
          price: this.parseElinapmsNumber(a.dataset.tagprice),
          quantity: 1,
          type: "accommodation",
          category: a.dataset.tagcategory,
          locationId: a.dataset.accid,
          ratePlanId: a.dataset.rateruleId,
          ...c ?? {}
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
      const a = n[0], c = o[0], l = Math.round(
        (Date.UTC(+o[1], +o[2] - 1, +o[3]) - Date.UTC(+n[1], +n[2] - 1, +n[3])) / 864e5
      );
      if (l < 1 || l > 60) return null;
      const u = Number(s.dataset.nights), d = Number.isInteger(u) && u > 0 ? u : l;
      return { startDate: a, endDate: c, nights: d };
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
      const l = this.parseElinapmsNumber(e.value);
      if (l > 0) return l;
    }
    const t = document.getElementById("accommodationTotal");
    if (!t)
      return this.totalAverage;
    const s = t.querySelector(".formattedCurrency"), r = s ? this.parseElinapmsNumber(s.textContent) : 0, n = t.querySelector(".plusFees"), o = n ? this.parseElinapmsNumber(n.dataset.att) : 0;
    let a = 0;
    const c = document.getElementById("addonsTotal");
    if (c) {
      const l = c.querySelector(".formattedCurrency");
      a = l ? this.parseElinapmsNumber(l.textContent) : 0;
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
      ), c = document.querySelector(
        'input[name="firstName"]'
      ), l = document.querySelector(
        'input[name="lastName"]'
      );
      n || o || a || c || l ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(r, s)) : console.warn(
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
    const a = { ...r, [n]: s }, c = n === "email" || n.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), l = n === "phone_number" || n.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
    if (c || l || this.inputDetector.hasEmailOrPhoneNumber()) {
      const d = this.inputDetector.sessionId;
      this.debouncedHandleContentUpdate(a, d);
    }
  }
  /**
   * Set up event listeners on autofield inputs to store values in sessionStorage
   */
  setupAutofieldStorageListeners() {
    typeof document > "u" || Object.keys(z.AUTOFIELD_STORAGE_KEYS).forEach(
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
      const c = this.getFromSessionStorage("autofield_email");
      if (c) {
        const d = o.getElementById(
          "registrationManualEmail"
        );
        d && !d.value ? (d.value = c, d.dispatchEvent(
          new Event("input", { bubbles: !0 })
        ), d.dispatchEvent(
          new Event("change", { bubbles: !0 })
        ), console.log("Filled email from sessionStorage:", c)) : d || (a = !1);
      }
      const l = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), u = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (l || u) {
        const d = o.querySelector(
          'input[name="country-code"]'
        );
        if (d && l) {
          d.value = l, d.dispatchEvent(
            new Event("change", { bubbles: !0 })
          );
          const f = o.querySelector(
            '#registrationManualPhonePrefix input[type="text"]'
          );
          f && (f.value = l, f.dispatchEvent(
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
            y && (y.textContent = l);
          }
          console.log(
            "Filled phone country code from sessionStorage:",
            l
          );
        } else l && !d && (a = !1);
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
      const c = document.querySelectorAll("iframe");
      let l = !1;
      c.forEach((u) => {
        var d;
        try {
          const h = u.contentDocument || ((d = u.contentWindow) == null ? void 0 : d.document);
          h && (r(h) ? l = !0 : o = !1);
        } catch {
          this.tryPostMessageToIframe(u);
        }
      }), (a || l) && (o = !0), !o && e < t ? (e++, setTimeout(n, s)) : e >= t && !o && console.warn(
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
    var t, s, r, n, o, a, c, l, u, d;
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
      const m = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((r = e.name) == null ? void 0 : r.toLowerCase().includes("dibs")), b = ((n = e.src) == null ? void 0 : n.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((c = e.src) == null ? void 0 : c.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((l = e.name) == null ? void 0 : l.toLowerCase().includes("nets")) || ((u = e.name) == null ? void 0 : u.toLowerCase().includes("easy"));
      if (!e.contentWindow)
        return;
      const E = [
        // Format 1: Our standard format
        {
          type: "ekteintelligens-autofill",
          email: h || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        },
        // Format 2: Dibs/Nets Easy-specific formats
        ...m || b ? [
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
      E.forEach((w) => {
        try {
          e.contentWindow.postMessage(w, y);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${b ? "Nets Easy/Nexi" : m ? "Dibs" : "cross-origin"} iframe via postMessage (${E.length} formats):`,
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
  tryIframeUrlParameters(e, t, s, r) {
    if (e.src)
      try {
        const n = new URL(e.src), o = n.hostname.includes("dibspayment.eu") || n.hostname.includes("dibs."), a = n.hostname.includes("netseasy") || n.hostname.includes("nets.eu") || n.hostname.includes("nexigroup.com") || n.hostname.includes("dibspayment.eu");
        if (!o && !a)
          return;
        const c = n.searchParams.toString().length > 0;
        (t || s || r) && console.log(`${a ? "Nets Easy/Nexi" : o ? "Dibs" : "Payment"} iframe URL analysis:`, {
          currentUrl: e.src,
          hasParams: c,
          suggestedParams: {
            ...t ? { email: t } : {},
            ...s ? { phoneCountryCode: s } : {},
            ...r ? { phoneNumber: "***" } : {}
          },
          note: c ? "Iframe URL has parameters - might support additional ones" : `Iframe URL has no parameters - check ${a ? "Nets Easy/Nexi" : "Dibs"} documentation for supported params`,
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
g(z, "BASKET_FETCH_TIMEOUT_MS", 8e3), /**
 * Selectors that identify each autofield, whether rendered by BookVisit
 * itself or injected by us.
 */
g(z, "AUTOFIELD_SELECTORS", {
  firstName: '#customer-firstName, input[name="firstName"]',
  lastName: '#customer-lastName, input[name="lastName"]',
  email: '#customer-emailAddress, input[name="emailAddress"]',
  phoneNumber: '#customer-phoneNumber, input[name="phoneNumber"]'
}), /**
 * sessionStorage key for each autofield input name
 */
g(z, "AUTOFIELD_STORAGE_KEYS", {
  emailAddress: "autofield_email",
  phoneCountryCode: "autofield_phoneCountryCode",
  phoneNumber: "autofield_phoneNumber"
});
let Ge = z;
class fo {
  constructor(e) {
    g(this, "options");
    g(this, "supabaseService");
    g(this, "campaign");
    g(this, "formData", {});
    g(this, "inputListeners", []);
    g(this, "buttonListeners", []);
    g(this, "submitListener");
    g(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new st(
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
class po {
  constructor(e) {
    // @ts-ignore
    g(this, "options");
    g(this, "isInitialized", !1);
    g(this, "currentPage", "");
    g(this, "currentVisitStartTime", 0);
    /** Start of the current foreground segment; 0 while paused. */
    g(this, "segmentStart", 0);
    g(this, "data", { visits: [] });
    g(this, "storageKey", "ei_enhanced_insights");
    g(this, "popstateHandler");
    // private pushstateHandler?: () => void;
    // private replacestateHandler?: () => void;
    g(this, "beforeunloadHandler");
    g(this, "visibilityChangeHandler");
    g(this, "originalPushState");
    g(this, "originalReplaceState");
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
      Hi();
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
const ue = class ue {
  constructor(e) {
    g(this, "supabaseService");
    g(this, "isInitialized", !1);
    this.supabaseService = new st(
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
        ue.URL_PARAM
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
        ue.STORAGE_KEY
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
          ue.STORAGE_KEY,
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
g(ue, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
g(ue, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let xt = ue;
const te = class te {
  constructor() {
    g(this, "overlay");
    g(this, "banners", []);
  }
  showLoading(e, t, s) {
    if (typeof document > "u" || this.overlay)
      return;
    this.ensureStyle();
    const r = document.createElement("div");
    r.setAttribute("data-ei-restore-overlay", ""), r.setAttribute("role", "dialog"), r.setAttribute("aria-modal", "true"), r.setAttribute("aria-busy", "true"), r.style.cssText = [
      "position:fixed",
      "inset:0",
      `z-index:${te.Z_INDEX}`,
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
      `z-index:${te.Z_INDEX}`,
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
    if (document.getElementById(te.STYLE_ID))
      return;
    const e = document.createElement("style");
    e.id = te.STYLE_ID, e.textContent = "@keyframes ei-restore-spin{to{transform:rotate(360deg)}}", document.head.appendChild(e);
  }
};
g(te, "STYLE_ID", "ei-restore-style"), g(te, "Z_INDEX", "2147483646");
let Ot = te;
const B = class B {
  static get(e) {
    const t = B.locale();
    return B.TEXT[t][e];
  }
  static forNotice(e) {
    const t = (r) => B.formatMoney(r ?? 0, e.currency), s = {
      oldPrice: t(e.oldPrice),
      newPrice: t(e.newPrice),
      savings: t(e.savings),
      promoCode: e.promoCode ?? ""
    };
    return B.get(e.kind).replace(
      /\{(\w+)\}/g,
      (r, n) => s[n] ?? r
    );
  }
  static locale() {
    const e = Vs.getUserLocale(), t = B.LOCALE_ALIASES[e] ?? e;
    return B.TEXT[t] ? t : "en";
  }
  static formatMoney(e, t) {
    const s = B.locale();
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
g(B, "TEXT", {
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
}), g(B, "LOCALE_ALIASES", {
  no: "nb",
  nn: "nb"
});
let ee = B;
const L = class L {
  constructor() {
    g(this, "stopWaiting");
    /** Fields the visitor interacted with, or that held a value of theirs. */
    g(this, "visitorFields", /* @__PURE__ */ new WeakSet());
    g(this, "filledFields", /* @__PURE__ */ new WeakSet());
  }
  /** The usable parts of a stored contact, or null when there are none. */
  static clean(e, t, s) {
    const r = {}, n = e == null ? void 0 : e.trim();
    n && L.EMAIL_PATTERN.test(n) && (r.email = n);
    const o = t == null ? void 0 : t.replace(/[^\d+]/g, "");
    if (o && o.replace(/\D/g, "").length >= 4) {
      r.phone = o;
      const a = s == null ? void 0 : s.replace(/\D/g, "");
      a && (r.phoneCountryCode = a);
    }
    return r.email || r.phone ? r : null;
  }
  fill(e) {
    var c;
    (c = this.stopWaiting) == null || c.call(this);
    const t = this.targets(e), s = (l) => {
      l.target && this.visitorFields.add(l.target);
    };
    document.addEventListener("pointerdown", s, !0), document.addEventListener("keydown", s, !0);
    const r = () => t.forEach((l) => this.fillTarget(l, e));
    r();
    const n = setInterval(r, L.CHECK_EVERY_MS), o = setTimeout(() => a(), L.WAIT_MS), a = () => {
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
      const a = this.find(L.EMAIL_FIELD);
      a && this.setIfEmpty(a, t.email);
      return;
    }
    const { countryCode: s, number: r } = this.splitPhone(t), n = this.find(L.NATIONAL_FIELD);
    if (n) {
      const a = this.find(L.COUNTRY_CODE_FIELD);
      a && s && this.setIfEmpty(a, s), this.setIfEmpty(n, r);
      return;
    }
    const o = this.find(L.PHONE_FIELD);
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
g(L, "WAIT_MS", 2e4), g(L, "CHECK_EVERY_MS", 250), g(L, "EMAIL_PATTERN", /^[^\s@]+@[^\s@]+\.[^\s@]+$/), g(L, "EMAIL_FIELD", 'input[type="email"]'), g(L, "COUNTRY_CODE_FIELD", 'input[autocomplete="tel-country-code"]'), g(L, "NATIONAL_FIELD", 'input[autocomplete="tel-national"]'), g(L, "PHONE_FIELD", 'input[type="tel"]');
let je = L;
const T = class T {
  constructor(e) {
    g(this, "options");
    g(this, "supabaseService");
    g(this, "overlay", new Ot());
    g(this, "controller");
    g(this, "isInitialized", !1);
    g(this, "lastOutcome");
    g(this, "prefill", new je());
    this.options = e, this.supabaseService = new st(
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
      ee.get("restoring"),
      ee.get("close"),
      () => s.abort()
    );
    const a = setTimeout(() => {
      n = !0, s.abort(), this.overlay.hideLoading();
    }, T.TIMEOUT_MS);
    let c = [];
    try {
      const l = await this.restore(
        e,
        t,
        s.signal,
        r
      );
      return c = l.notices, l.continueTo && (this.storePendingNotices(c), this.storePendingContact(l.contact), c = [], o = !0, this.navigate(l.continueTo)), l.outcome;
    } catch (l) {
      return s.signal.aborted ? n ? (c = [{ kind: "failed" }], r.current === "token" ? "no_token" : "timeout") : "cancelled" : (console.error("Cart restore failed:", l), c = [{ kind: "failed" }], "failed");
    } finally {
      o || (clearTimeout(a), this.overlay.hideLoading()), c.forEach(
        (l) => this.overlay.showBanner(
          ee.forNotice(l),
          ee.get("close")
        )
      ), this.controller === s && (this.controller = void 0);
    }
  }
  async restore(e, t, s, r) {
    var p;
    const n = {
      outcome: "failed",
      notices: [{ kind: "failed" }]
    };
    r.current = "spec";
    const o = await this.abortable(
      this.supabaseService.getCartRestore(e),
      s
    ), a = o ? this.getRestorableRooms(o) : null;
    if (!o || !a)
      return { ...n, outcome: "invalid_link" };
    if (a.some((y) => y.startDate < this.today()))
      return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
    const c = new Re(t);
    if (r.current = "token", !await this.abortable(c.waitForToken(s), s))
      return { ...n, outcome: "no_token" };
    r.current = "basket";
    const u = await this.abortable(c.getBasket(s), s);
    if (!u)
      return n;
    if (Re.basketHasRooms(u))
      return { outcome: "basket_exists", notices: [] };
    Ge.saveSessionIdToStorage(o.session_id), r.current = "search";
    const d = ((p = o.promo_code) == null ? void 0 : p.trim()) || void 0, h = [];
    for (const y of this.groupByStay(a)) {
      const m = {
        startDate: y[0].startDate,
        endDate: y[0].endDate,
        roomConfigs: y.map((w) => this.toRoomConfig(w))
      }, [b, E] = await this.abortable(
        Promise.all([
          c.search(m, s),
          d ? c.search({ ...m, promoCode: d }, s) : Promise.resolve(null)
        ]),
        s
      );
      if (!b)
        return n;
      const v = this.matchRooms(y, b, E);
      if (!v)
        return { outcome: "unavailable", notices: [{ kind: "unavailable" }] };
      h.push(...v);
    }
    r.current = "add";
    for (const [y, m] of h.entries())
      if (!await this.abortable(
        c.addRoom(m.hitKey, m.resultId, y > 0, s),
        s
      ))
        return n;
    const f = this.buildNotices(h, d);
    return {
      outcome: f.some((y) => y.kind === "priceChanged") ? "restored_price_changed" : "restored",
      notices: f,
      continueTo: this.continueUrl(),
      contact: je.clean(o.email, o.phone, o.phone_country_code) ?? void 0
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
        return typeof r.id == "string" && r.id.length > 0 && T.DATE_PATTERN.test(r.startDate ?? "") && T.DATE_PATTERN.test(r.endDate ?? "") && r.endDate > r.startDate && Number.isInteger((n = r.roomConfig) == null ? void 0 : n.adults) && r.roomConfig.adults > 0;
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
      const c = this.findHit(t.hits, a, r);
      if (!c)
        return null;
      r.add(c.hitKey);
      const l = s ? this.findHit(s.hits, a, n) : null;
      l && n.add(l.hitKey), o.push({
        room: a,
        hitKey: (l == null ? void 0 : l.hitKey) ?? c.hitKey,
        resultId: l && s ? s.resultId : t.resultId,
        plainPrice: c.price,
        promoPrice: (l == null ? void 0 : l.price) ?? null,
        currency: c.currency ?? (l == null ? void 0 : l.currency) ?? null
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
      var c;
      return s.has(a.hitKey) || a.roomId !== t.id || a.roomConfig && !this.sameGuests(a.roomConfig, n) ? !1 : t.ratePlanId ? a.ratePlanId === t.ratePlanId : !!r && ((c = a.ratePlanName) == null ? void 0 : c.trim().toLowerCase()) === r;
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
        (c, l) => c + Math.round(l.room.price),
        0
      ), a = e.reduce(
        (c, l) => c + l.plainPrice,
        0
      );
      o !== a && s.push({ kind: "priceChanged", oldPrice: o, newPrice: a, currency: r });
    }
    if (t) {
      const o = e.reduce(
        (a, c) => c.plainPrice !== null && c.promoPrice !== null && c.promoPrice < c.plainPrice ? a + (c.plainPrice - c.promoPrice) : a,
        0
      );
      o > 0 && s.push({ kind: "promoApplied", promoCode: t, savings: o, currency: r });
    }
    return s;
  }
  /**
   * Checkout page on this site, keeping the language prefix (`/no/…`) and
   * every query param except `s`.
   */
  continueUrl() {
    var r;
    const e = new URLSearchParams(window.location.search);
    e.delete(T.URL_PARAM);
    const t = e.toString();
    return `${((r = T.LANGUAGE_PREFIX.exec(window.location.pathname)) == null ? void 0 : r[0]) ?? ""}${T.CONTINUE_PATH}${t ? `?${t}` : ""}`;
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
        T.URL_PARAM
      );
      return e && e.trim() ? e.trim() : null;
    } catch {
      return null;
    }
  }
  getAttemptedIds() {
    try {
      const e = JSON.parse(
        sessionStorage.getItem(T.ATTEMPTED_KEY) ?? "[]"
      );
      return Array.isArray(e) ? e : [];
    } catch {
      return [];
    }
  }
  markAttempted(e) {
    try {
      sessionStorage.setItem(
        T.ATTEMPTED_KEY,
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
          T.NOTICES_KEY,
          JSON.stringify(e)
        );
      } catch (t) {
        console.warn("Failed to persist cart restore notices:", t);
      }
  }
  storePendingContact(e) {
    if (e)
      try {
        sessionStorage.setItem(T.CONTACT_KEY, JSON.stringify(e));
      } catch (t) {
        console.warn("Failed to persist cart restore contact:", t);
      }
  }
  /** Fill the contact saved by a restore into the checkout form. */
  fillPendingContact() {
    let e = null;
    try {
      e = sessionStorage.getItem(T.CONTACT_KEY), sessionStorage.removeItem(T.CONTACT_KEY);
    } catch {
      return;
    }
    let t = null;
    try {
      t = e ? JSON.parse(e) : null;
    } catch {
      return;
    }
    const s = t ? je.clean(t.email, t.phone, t.phoneCountryCode) : null;
    s && this.prefill.fill(s);
  }
  showPendingNotices() {
    let e = [];
    try {
      const t = sessionStorage.getItem(T.NOTICES_KEY);
      sessionStorage.removeItem(T.NOTICES_KEY);
      const s = t ? JSON.parse(t) : [];
      e = Array.isArray(s) ? s : [];
    } catch {
      return;
    }
    e.forEach(
      (t) => this.overlay.showBanner(
        ee.forNotice(t),
        ee.get("close")
      )
    );
  }
};
g(T, "URL_PARAM", "s"), g(T, "ATTEMPTED_KEY", "ei_cart_restore_attempted_ids"), g(T, "NOTICES_KEY", "ei_cart_restore_notices"), g(T, "CONTACT_KEY", "ei_cart_restore_contact"), g(T, "TIMEOUT_MS", 8e3), g(T, "CONTINUE_PATH", "/checkout"), g(T, "DATE_PATTERN", /^\d{4}-\d{2}-\d{2}$/), g(T, "LANGUAGE_PREFIX", /^\/[a-z]{2}(?=\/)/);
let jt = T;
class go {
  constructor(e) {
    g(this, "options");
    g(this, "tools", /* @__PURE__ */ new Map());
    g(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s, r, n, o;
    if (this._isInitialized)
      return !0;
    try {
      Qi({
        cookieDomain: this.options.cookieDomain,
        requireConsent: this.options.requireConsent,
        shareInsightsAcrossSubdomains: this.options.shareInsightsAcrossSubdomains
      }), co({
        enabled: !!((e = this.options.features) != null && e.abandonedCart) && ((t = this.options.features) == null ? void 0 : t.stayCapture) !== !1
      });
      const a = new xt(this.options);
      if (await a.initialize(), this.tools.set("linkTracking", a), (s = this.options.features) != null && s.cartRestore) {
        const c = new jt(this.options);
        await c.initialize(), this.tools.set("cartRestore", c);
      }
      if ((r = this.options.features) != null && r.abandonedCart) {
        const c = new Ge(this.options);
        await c.initialize(), this.tools.set("abandonedCart", c);
      }
      if ((n = this.options.features) != null && n.organizationPipeline) {
        const c = new fo(
          this.options
        );
        await c.initialize(), this.tools.set(
          "organizationPipeline",
          c
        );
      }
      if ((o = this.options.features) != null && o.enhancedInsights) {
        const c = async () => {
          if (this.tools.has("enhancedInsights")) return;
          const l = new po(
            this.options
          );
          await l.initialize(), this.tools.set("enhancedInsights", l);
        };
        nt() && await c(), this.options.requireConsent && er((l) => {
          if (l)
            c();
          else {
            const u = this.tools.get("enhancedInsights");
            u && (u.destroy(), u.clearData(), this.tools.delete("enhancedInsights"));
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
  /**
   * Grant or revoke analytics-persistence consent. Wire this to the CMP's
   * consent callback when the SDK is configured with `requireConsent: true`
   * (Cookiebot, OneTrust and TCF-compliant CMPs are also auto-detected).
   * Revoking clears the persisted payload and cookie.
   */
  setConsent(e) {
    Oe(e);
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
typeof window < "u" && (window.EkteIntelligensSDK = go);
export {
  go as EkteIntelligensSDK
};
