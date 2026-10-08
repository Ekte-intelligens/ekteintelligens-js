var Zs = Object.defineProperty;
var er = (n, e, t) => e in n ? Zs(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var m = (n, e, t) => er(n, typeof e != "symbol" ? e + "" : e, t);
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
let rt = re;
class tr {
  constructor(e) {
    m(this, "productMapping");
    this.productMapping = this.cleanProductMapping(e);
  }
  cleanProductMapping(e) {
    if (!e) return e;
    if (e.fields) {
      const t = { ...e }, s = {};
      for (const [r, i] of Object.entries(
        e.fields
      ))
        s[r] = this.cleanSelector(
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
    const s = Object.values(t), r = this.findCommonParentSelector(s);
    if (r && document.querySelectorAll(r).forEach((o) => {
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
    const r = [
      "body",
      "main",
      "#content",
      "#main",
      ".main",
      ".content"
    ];
    for (const i of r)
      if (document.querySelectorAll(i).length > 0)
        return i;
    return null;
  }
  extractProductFromFieldsMapping(e, t) {
    try {
      const s = {};
      for (const [r, i] of Object.entries(t)) {
        let o = this.extractValue(e, i);
        if (o === null && i.startsWith("data-")) {
          const a = document.querySelectorAll(
            `[${i}]`
          );
          a.length > 0 && (o = a[0].getAttribute(
            i
          ));
        }
        o !== null && (r.toLowerCase().includes("price") ? s[r] = this.extractPrice(
          e,
          i
        ) : r.toLowerCase().includes("quantity") ? s[r] = this.extractQuantity(
          e,
          i
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
    var s, r, i;
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
      return o && ((i = o.textContent) == null ? void 0 : i.trim()) || null;
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
    const i = parseFloat(r);
    return isNaN(i) ? 0 : i;
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
        document.querySelectorAll(s).forEach((i) => t.add(i));
      } catch (r) {
        console.warn(`Invalid selector: ${s}`, r);
      }
    return Array.from(t);
  }
}
class sr {
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
      let r = s.replace(/[^\d.,]/g, "");
      const i = r.includes(","), o = r.includes(".");
      if (i && o) {
        const c = r.lastIndexOf(","), l = r.lastIndexOf(".");
        c > l ? r.substring(c + 1).length === 2 ? (r = r.replace(/\./g, ""), r = r.replace(",", ".")) : r = r.replace(/,/g, "") : r = r.replace(/,/g, "");
      } else if (i && !o) {
        const c = r.match(/,/g);
        if ((c ? c.length : 0) > 1)
          r = r.replace(/,/g, "");
        else {
          const u = r.match(/,(\d+)$/);
          u && u[1].length === 3 ? r = r.replace(",", "") : r = r.replace(",", ".");
        }
      } else if (!i && o) {
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
const rr = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ve).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class St extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class nr extends St {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class qt extends St {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class zt extends St {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var nt;
(function(n) {
  n.Any = "any", n.ApNortheast1 = "ap-northeast-1", n.ApNortheast2 = "ap-northeast-2", n.ApSouth1 = "ap-south-1", n.ApSoutheast1 = "ap-southeast-1", n.ApSoutheast2 = "ap-southeast-2", n.CaCentral1 = "ca-central-1", n.EuCentral1 = "eu-central-1", n.EuWest1 = "eu-west-1", n.EuWest2 = "eu-west-2", n.EuWest3 = "eu-west-3", n.SaEast1 = "sa-east-1", n.UsEast1 = "us-east-1", n.UsWest1 = "us-west-1", n.UsWest2 = "us-west-2";
})(nt || (nt = {}));
var ir = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
class or {
  constructor(e, { headers: t = {}, customFetch: s, region: r = nt.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = rr(s);
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
    return ir(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: i, body: o } = t;
        let a = {}, { region: c } = t;
        c || (c = this.region);
        const l = new URL(`${this.url}/${e}`);
        c && c !== "any" && (a["x-region"] = c, l.searchParams.set("forceFunctionRegion", c));
        let u;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", u = o) : typeof FormData < "u" && o instanceof FormData ? u = o : (a["Content-Type"] = "application/json", u = JSON.stringify(o)));
        const d = yield this.fetch(l.toString(), {
          method: i || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: u
        }).catch((v) => {
          throw new nr(v);
        }), h = d.headers.get("x-relay-error");
        if (h && h === "true")
          throw new qt(d);
        if (!d.ok)
          throw new zt(d);
        let f = ((s = d.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield d.json() : f === "application/octet-stream" ? p = yield d.blob() : f === "text/event-stream" ? p = d : f === "multipart/form-data" ? p = yield d.formData() : p = yield d.text(), { data: p, error: null, response: d };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof zt || r instanceof qt ? r.context : void 0
        };
      }
    });
  }
}
var L = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function ar(n) {
  if (n.__esModule) return n;
  var e = n.default;
  if (typeof e == "function") {
    var t = function s() {
      return this instanceof s ? Reflect.construct(e, arguments, this.constructor) : e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(n).forEach(function(s) {
    var r = Object.getOwnPropertyDescriptor(n, s);
    Object.defineProperty(t, s, r.get ? r : {
      enumerable: !0,
      get: function() {
        return n[s];
      }
    });
  }), t;
}
var D = {}, kt = {}, Me = {}, Ae = {}, Be = {}, qe = {}, cr = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, me = cr();
const lr = me.fetch, hs = me.fetch.bind(me), fs = me.Headers, ur = me.Request, dr = me.Response, ve = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: fs,
  Request: ur,
  Response: dr,
  default: hs,
  fetch: lr
}, Symbol.toStringTag, { value: "Module" })), hr = /* @__PURE__ */ ar(ve);
var ze = {};
Object.defineProperty(ze, "__esModule", { value: !0 });
let fr = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
ze.default = fr;
var ps = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(qe, "__esModule", { value: !0 });
const pr = ps(hr), gr = ps(ze);
let mr = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = pr.default : this.fetch = fetch;
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
    }).then(async (i) => {
      var o, a, c;
      let l = null, u = null, d = null, h = i.status, f = i.statusText;
      if (i.ok) {
        if (this.method !== "HEAD") {
          const w = await i.text();
          w === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = w : u = JSON.parse(w));
        }
        const v = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), g = (a = i.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        v && g && g.length > 1 && (d = parseInt(g[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (l = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, d = null, h = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const v = await i.text();
        try {
          l = JSON.parse(v), Array.isArray(l) && i.status === 404 && (u = [], l = null, h = 200, f = "OK");
        } catch {
          i.status === 404 && v === "" ? (h = 204, f = "No Content") : l = {
            message: v
          };
        }
        if (l && this.isMaybeSingle && (!((c = l == null ? void 0 : l.details) === null || c === void 0) && c.includes("0 rows")) && (l = null, h = 200, f = "OK"), l && this.shouldThrowOnError)
          throw new gr.default(l);
      }
      return {
        error: l,
        data: u,
        count: d,
        status: h,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (r = r.catch((i) => {
      var o, a, c;
      return {
        error: {
          message: `${(o = i == null ? void 0 : i.name) !== null && o !== void 0 ? o : "FetchError"}: ${i == null ? void 0 : i.message}`,
          details: `${(a = i == null ? void 0 : i.stack) !== null && a !== void 0 ? a : ""}`,
          hint: "",
          code: `${(c = i == null ? void 0 : i.code) !== null && c !== void 0 ? c : ""}`
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
qe.default = mr;
var vr = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Be, "__esModule", { value: !0 });
const yr = vr(qe);
let br = class extends yr.default {
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
  order(e, { ascending: t = !0, nullsFirst: s, foreignTable: r, referencedTable: i = r } = {}) {
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
    const i = typeof r > "u" ? "offset" : `${r}.offset`, o = typeof r > "u" ? "limit" : `${r}.limit`;
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
  explain({ analyze: e = !1, verbose: t = !1, settings: s = !1, buffers: r = !1, wal: i = !1, format: o = "text" } = {}) {
    var a;
    const c = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      r ? "buffers" : null,
      i ? "wal" : null
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
Be.default = br;
var _r = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Ae, "__esModule", { value: !0 });
const wr = _r(Be);
let Sr = class extends wr.default {
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
    let i = "";
    r === "plain" ? i = "pl" : r === "phrase" ? i = "ph" : r === "websearch" && (i = "w");
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
Ae.default = Sr;
var kr = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Me, "__esModule", { value: !0 });
const be = kr(Ae);
let Er = class {
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
    let i = !1;
    const o = (e ?? "*").split("").map((a) => /\s/.test(a) && !i ? "" : (a === '"' && (i = !i), a)).join("");
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new be.default({
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
    const r = "POST", i = [];
    if (this.headers.Prefer && i.push(this.headers.Prefer), t && i.push(`count=${t}`), s || i.push("missing=default"), this.headers.Prefer = i.join(","), Array.isArray(e)) {
      const o = e.reduce((a, c) => a.concat(Object.keys(c)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new be.default({
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
  upsert(e, { onConflict: t, ignoreDuplicates: s = !1, count: r, defaultToNull: i = !0 } = {}) {
    const o = "POST", a = [`resolution=${s ? "ignore" : "merge"}-duplicates`];
    if (t !== void 0 && this.url.searchParams.set("on_conflict", t), this.headers.Prefer && a.push(this.headers.Prefer), r && a.push(`count=${r}`), i || a.push("missing=default"), this.headers.Prefer = a.join(","), Array.isArray(e)) {
      const c = e.reduce((l, u) => l.concat(Object.keys(u)), []);
      if (c.length > 0) {
        const l = [...new Set(c)].map((u) => `"${u}"`);
        this.url.searchParams.set("columns", l.join(","));
      }
    }
    return new be.default({
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
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new be.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new be.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
Me.default = Er;
var Ve = {}, He = {};
Object.defineProperty(He, "__esModule", { value: !0 });
He.version = void 0;
He.version = "0.0.0-automated";
Object.defineProperty(Ve, "__esModule", { value: !0 });
Ve.DEFAULT_HEADERS = void 0;
const Cr = He;
Ve.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${Cr.version}` };
var gs = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(kt, "__esModule", { value: !0 });
const Ir = gs(Me), Tr = gs(Ae), Ar = Ve;
let Pr = class ms {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, Ar.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new Ir.default(t, {
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
    return new ms(this.url, {
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
  rpc(e, t = {}, { head: s = !1, get: r = !1, count: i } = {}) {
    let o;
    const a = new URL(`${this.url}/rpc/${e}`);
    let c;
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([u, d]) => d !== void 0).map(([u, d]) => [u, Array.isArray(d) ? `{${d.join(",")}}` : `${d}`]).forEach(([u, d]) => {
      a.searchParams.append(u, d);
    })) : (o = "POST", c = t);
    const l = Object.assign({}, this.headers);
    return i && (l.Prefer = `count=${i}`), new Tr.default({
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
kt.default = Pr;
var ye = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(D, "__esModule", { value: !0 });
D.PostgrestError = D.PostgrestBuilder = D.PostgrestTransformBuilder = D.PostgrestFilterBuilder = D.PostgrestQueryBuilder = D.PostgrestClient = void 0;
const vs = ye(kt);
D.PostgrestClient = vs.default;
const ys = ye(Me);
D.PostgrestQueryBuilder = ys.default;
const bs = ye(Ae);
D.PostgrestFilterBuilder = bs.default;
const _s = ye(Be);
D.PostgrestTransformBuilder = _s.default;
const ws = ye(qe);
D.PostgrestBuilder = ws.default;
const Ss = ye(ze);
D.PostgrestError = Ss.default;
var xr = D.default = {
  PostgrestClient: vs.default,
  PostgrestQueryBuilder: ys.default,
  PostgrestFilterBuilder: bs.default,
  PostgrestTransformBuilder: _s.default,
  PostgrestBuilder: ws.default,
  PostgrestError: Ss.default
};
const {
  PostgrestClient: Or,
  PostgrestQueryBuilder: uo,
  PostgrestFilterBuilder: ho,
  PostgrestTransformBuilder: fo,
  PostgrestBuilder: po,
  PostgrestError: go
} = xr;
function jr() {
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
const $r = jr(), Rr = "2.11.15", Dr = `realtime-js/${Rr}`, Lr = "1.0.0", ks = 1e4, Nr = 1e3;
var we;
(function(n) {
  n[n.connecting = 0] = "connecting", n[n.open = 1] = "open", n[n.closing = 2] = "closing", n[n.closed = 3] = "closed";
})(we || (we = {}));
var j;
(function(n) {
  n.closed = "closed", n.errored = "errored", n.joined = "joined", n.joining = "joining", n.leaving = "leaving";
})(j || (j = {}));
var U;
(function(n) {
  n.close = "phx_close", n.error = "phx_error", n.join = "phx_join", n.reply = "phx_reply", n.leave = "phx_leave", n.access_token = "access_token";
})(U || (U = {}));
var it;
(function(n) {
  n.websocket = "websocket";
})(it || (it = {}));
var se;
(function(n) {
  n.Connecting = "connecting", n.Open = "open", n.Closing = "closing", n.Closed = "closed";
})(se || (se = {}));
class Ur {
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
    const r = t.getUint8(1), i = t.getUint8(2);
    let o = this.HEADER_LENGTH + 2;
    const a = s.decode(e.slice(o, o + r));
    o = o + r;
    const c = s.decode(e.slice(o, o + i));
    o = o + i;
    const l = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: c, payload: l };
  }
}
class Es {
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
(function(n) {
  n.abstime = "abstime", n.bool = "bool", n.date = "date", n.daterange = "daterange", n.float4 = "float4", n.float8 = "float8", n.int2 = "int2", n.int4 = "int4", n.int4range = "int4range", n.int8 = "int8", n.int8range = "int8range", n.json = "json", n.jsonb = "jsonb", n.money = "money", n.numeric = "numeric", n.oid = "oid", n.reltime = "reltime", n.text = "text", n.time = "time", n.timestamp = "timestamp", n.timestamptz = "timestamptz", n.timetz = "timetz", n.tsrange = "tsrange", n.tstzrange = "tstzrange";
})(I || (I = {}));
const Vt = (n, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((i, o) => (i[o] = Fr(o, n, e, r), i), {});
}, Fr = (n, e, t, s) => {
  const r = e.find((a) => a.name === n), i = r == null ? void 0 : r.type, o = t[n];
  return i && !s.includes(i) ? Cs(i, o) : ot(o);
}, Cs = (n, e) => {
  if (n.charAt(0) === "_") {
    const t = n.slice(1, n.length);
    return zr(e, t);
  }
  switch (n) {
    case I.bool:
      return Mr(e);
    case I.float4:
    case I.float8:
    case I.int2:
    case I.int4:
    case I.int8:
    case I.numeric:
    case I.oid:
      return Br(e);
    case I.json:
    case I.jsonb:
      return qr(e);
    case I.timestamp:
      return Vr(e);
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
      return ot(e);
    default:
      return ot(e);
  }
}, ot = (n) => n, Mr = (n) => {
  switch (n) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return n;
  }
}, Br = (n) => {
  if (typeof n == "string") {
    const e = parseFloat(n);
    if (!Number.isNaN(e))
      return e;
  }
  return n;
}, qr = (n) => {
  if (typeof n == "string")
    try {
      return JSON.parse(n);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), n;
    }
  return n;
}, zr = (n, e) => {
  if (typeof n != "string")
    return n;
  const t = n.length - 1, s = n[t];
  if (n[0] === "{" && s === "}") {
    let i;
    const o = n.slice(1, t);
    try {
      i = JSON.parse("[" + o + "]");
    } catch {
      i = o ? o.split(",") : [];
    }
    return i.map((a) => Cs(e, a));
  }
  return n;
}, Vr = (n) => typeof n == "string" ? n.replace(" ", "T") : n, Is = (n) => {
  let e = n;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class Je {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = ks) {
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
var Ht;
(function(n) {
  n.SYNC = "sync", n.JOIN = "join", n.LEAVE = "leave";
})(Ht || (Ht = {}));
class Se {
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
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.joinRef = this.channel._joinRef(), this.state = Se.syncState(this.state, r, i, o), this.pendingDiffs.forEach((c) => {
        this.state = Se.syncDiff(this.state, c, i, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = Se.syncDiff(this.state, r, i, o), a());
    }), this.onJoin((r, i, o) => {
      this.channel._trigger("presence", {
        event: "join",
        key: r,
        currentPresences: i,
        newPresences: o
      });
    }), this.onLeave((r, i, o) => {
      this.channel._trigger("presence", {
        event: "leave",
        key: r,
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
  static syncState(e, t, s, r) {
    const i = this.cloneDeep(e), o = this.transformState(t), a = {}, c = {};
    return this.map(i, (l, u) => {
      o[l] || (c[l] = u);
    }), this.map(o, (l, u) => {
      const d = i[l];
      if (d) {
        const h = u.map((g) => g.presence_ref), f = d.map((g) => g.presence_ref), p = u.filter((g) => f.indexOf(g.presence_ref) < 0), v = d.filter((g) => h.indexOf(g.presence_ref) < 0);
        p.length > 0 && (a[l] = p), v.length > 0 && (c[l] = v);
      } else
        a[l] = u;
    }), this.syncDiff(i, { joins: a, leaves: c }, s, r);
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
    const { joins: i, leaves: o } = {
      joins: this.transformState(t.joins),
      leaves: this.transformState(t.leaves)
    };
    return s || (s = () => {
    }), r || (r = () => {
    }), this.map(i, (a, c) => {
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
      return "metas" in r ? t[s] = r.metas.map((i) => (i.presence_ref = i.phx_ref, delete i.phx_ref, delete i.phx_ref_prev, i)) : t[s] = r, t;
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
var Wt;
(function(n) {
  n.ALL = "*", n.INSERT = "INSERT", n.UPDATE = "UPDATE", n.DELETE = "DELETE";
})(Wt || (Wt = {}));
var Kt;
(function(n) {
  n.BROADCAST = "broadcast", n.PRESENCE = "presence", n.POSTGRES_CHANGES = "postgres_changes", n.SYSTEM = "system";
})(Kt || (Kt = {}));
var q;
(function(n) {
  n.SUBSCRIBED = "SUBSCRIBED", n.TIMED_OUT = "TIMED_OUT", n.CLOSED = "CLOSED", n.CHANNEL_ERROR = "CHANNEL_ERROR";
})(q || (q = {}));
class Et {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = j.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Je(this, U.join, this.params, this.timeout), this.rejoinTimer = new Es(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = j.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = j.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(U.reply, {}, (r, i) => {
      this._trigger(this._replyEventName(i), r);
    }), this.presence = new Se(this), this.broadcastEndpointURL = Is(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == j.closed) {
      const { config: { broadcast: i, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(q.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(q.CLOSED));
      const c = {}, l = {
        broadcast: i,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((u) => u.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (c.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: l }, c)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var d;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(q.SUBSCRIBED);
          return;
        } else {
          const h = this.bindings.postgres_changes, f = (d = h == null ? void 0 : h.length) !== null && d !== void 0 ? d : 0, p = [];
          for (let v = 0; v < f; v++) {
            const g = h[v], { filter: { event: w, schema: C, table: y, filter: _ } } = g, T = u && u[v];
            if (T && T.event === w && T.schema === C && T.table === y && T.filter === _)
              p.push(Object.assign(Object.assign({}, g), { id: T.id }));
            else {
              this.unsubscribe(), this.state = j.errored, e == null || e(q.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(q.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = j.errored, e == null || e(q.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(q.TIMED_OUT);
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
      const { event: i, payload: o } = e, c = {
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
        const l = await this._fetchWithTimeout(this.broadcastEndpointURL, c, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((r = l.body) === null || r === void 0 ? void 0 : r.cancel()), l.ok ? "ok" : "error";
      } catch (l) {
        return l.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((i) => {
        var o, a, c;
        const l = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((c = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || c === void 0) && c.ack) && i("ok"), l.receive("ok", () => i("ok")), l.receive("error", () => i("error")), l.receive("timeout", () => i("timed out"));
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
      s = new Je(this, U.leave, {}, e), s.receive("ok", () => {
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
    const r = new AbortController(), i = setTimeout(() => r.abort(), s), o = await this.socket.fetch(e, Object.assign(Object.assign({}, t), { signal: r.signal }));
    return clearTimeout(i), o;
  }
  /** @internal */
  _push(e, t, s = this.timeout) {
    if (!this.joinedOnce)
      throw `tried to push '${e}' to '${this.topic}' before joining. Use channel.subscribe() before pushing events`;
    let r = new Je(this, e, t, s);
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
    var r, i;
    const o = e.toLocaleLowerCase(), { close: a, error: c, leave: l, join: u } = U;
    if (s && [a, c, l, u].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let h = this._onMessage(o, t, s);
    if (t && !h)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var p, v, g;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((g = (v = f.filter) === null || v === void 0 ? void 0 : v.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(h, s)) : (i = this.bindings[o]) === null || i === void 0 || i.filter((f) => {
      var p, v, g, w, C, y;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const _ = f.id, T = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return _ && ((v = t.ids) === null || v === void 0 ? void 0 : v.includes(_)) && (T === "*" || (T == null ? void 0 : T.toLocaleLowerCase()) === ((g = t.data) === null || g === void 0 ? void 0 : g.type.toLocaleLowerCase()));
        } else {
          const _ = (C = (w = f == null ? void 0 : f.filter) === null || w === void 0 ? void 0 : w.event) === null || C === void 0 ? void 0 : C.toLocaleLowerCase();
          return _ === "*" || _ === ((y = t == null ? void 0 : t.event) === null || y === void 0 ? void 0 : y.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof h == "object" && "ids" in h) {
        const p = h.data, { schema: v, table: g, commit_timestamp: w, type: C, errors: y } = p;
        h = Object.assign(Object.assign({}, {
          schema: v,
          table: g,
          commit_timestamp: w,
          eventType: C,
          new: {},
          old: {},
          errors: y
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
    const r = e.toLocaleLowerCase(), i = {
      type: r,
      filter: t,
      callback: s
    };
    return this.bindings[r] ? this.bindings[r].push(i) : this.bindings[r] = [i], this;
  }
  /** @internal */
  _off(e, t) {
    const s = e.toLocaleLowerCase();
    return this.bindings[s] = this.bindings[s].filter((r) => {
      var i;
      return !(((i = r.type) === null || i === void 0 ? void 0 : i.toLocaleLowerCase()) === s && Et.isEqual(r.filter, t));
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
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = Vt(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = Vt(e.columns, e.old_record)), t;
  }
}
const Gt = () => {
}, Hr = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Wr {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = ks, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Gt, this.ref = 0, this.logger = Gt, this.conn = null, this.sendBuffer = [], this.serializer = new Ur(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (i) => {
      let o;
      return i ? o = i : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => ve).then(({ default: c }) => c(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${it.websocket}`, this.httpEndpoint = Is(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (i) => [1e3, 2e3, 5e3, 1e4][i - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (i, o) => o(JSON.stringify(i)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Es(async () => {
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
      if (this.transport || (this.transport = $r), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: Lr }));
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
      case we.connecting:
        return se.Connecting;
      case we.open:
        return se.Open;
      case we.closing:
        return se.Closing;
      default:
        return se.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === se.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((i) => i.topic === s);
    if (r)
      return r;
    {
      const i = new Et(`realtime:${e}`, t, this);
      return this.channels.push(i), i;
    }
  }
  /**
   * Push out a message if the socket is connected.
   *
   * If the socket is not connected, the message gets enqueued within a local buffer, and sent out when a connection is next established.
   */
  push(e) {
    const { topic: t, event: s, payload: r, ref: i } = e, o = () => {
      this.encode(e, (a) => {
        var c;
        (c = this.conn) === null || c === void 0 || c.send(a);
      });
    };
    this.log("push", `${t} ${s} (${i})`, r), this.isConnected() ? o() : this.sendBuffer.push(o);
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
        version: Dr
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Nr, "hearbeat timeout");
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
      let { topic: s, event: r, payload: i, ref: o } = t;
      s === "phoenix" && r === "phx_reply" && this.heartbeatCallback(t.payload.status == "ok" ? "ok" : "error"), o && o === this.pendingHeartbeatRef && (this.pendingHeartbeatRef = null), this.log("receive", `${i.status || ""} ${s} ${r} ${o && "(" + o + ")" || ""}`, i), Array.from(this.channels).filter((a) => a._isMember(s)).forEach((a) => a._trigger(r, i, o)), this.stateChangeCallbacks.message.forEach((a) => a(t));
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
      const s = new Blob([Hr], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class Ct extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function O(n) {
  return typeof n == "object" && n !== null && "__isStorageError" in n;
}
class Kr extends Ct {
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
class at extends Ct {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var Gr = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
const Ts = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ve).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Jr = () => Gr(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => ve)).Response : Response;
}), ct = (n) => {
  if (Array.isArray(n))
    return n.map((t) => ct(t));
  if (typeof n == "function" || n !== Object(n))
    return n;
  const e = {};
  return Object.entries(n).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (i) => i.toUpperCase().replace(/[-_]/g, ""));
    e[r] = ct(s);
  }), e;
}, Yr = (n) => {
  if (typeof n != "object" || n === null)
    return !1;
  const e = Object.getPrototypeOf(n);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in n) && !(Symbol.iterator in n);
};
var oe = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
const Ye = (n) => n.msg || n.message || n.error_description || n.error || JSON.stringify(n), Xr = (n, e, t) => oe(void 0, void 0, void 0, function* () {
  const s = yield Jr();
  n instanceof s && !(t != null && t.noResolveJson) ? n.json().then((r) => {
    const i = n.status || 500, o = (r == null ? void 0 : r.statusCode) || i + "";
    e(new Kr(Ye(r), i, o));
  }).catch((r) => {
    e(new at(Ye(r), r));
  }) : e(new at(Ye(n), n));
}), Qr = (n, e, t, s) => {
  const r = { method: n, headers: (e == null ? void 0 : e.headers) || {} };
  return n === "GET" || !s ? r : (Yr(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function Pe(n, e, t, s, r, i) {
  return oe(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      n(t, Qr(e, s, r, i)).then((c) => {
        if (!c.ok)
          throw c;
        return s != null && s.noResolveJson ? c : c.json();
      }).then((c) => o(c)).catch((c) => Xr(c, a, s));
    });
  });
}
function De(n, e, t, s) {
  return oe(this, void 0, void 0, function* () {
    return Pe(n, "GET", e, t, s);
  });
}
function z(n, e, t, s, r) {
  return oe(this, void 0, void 0, function* () {
    return Pe(n, "POST", e, s, r, t);
  });
}
function lt(n, e, t, s, r) {
  return oe(this, void 0, void 0, function* () {
    return Pe(n, "PUT", e, s, r, t);
  });
}
function Zr(n, e, t, s) {
  return oe(this, void 0, void 0, function* () {
    return Pe(n, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function As(n, e, t, s, r) {
  return oe(this, void 0, void 0, function* () {
    return Pe(n, "DELETE", e, s, r, t);
  });
}
var R = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
const en = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Jt = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class tn {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = Ts(r);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, r) {
    return R(this, void 0, void 0, function* () {
      try {
        let i;
        const o = Object.assign(Object.assign({}, Jt), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const c = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (i = new FormData(), i.append("cacheControl", o.cacheControl), c && i.append("metadata", this.encodeMetadata(c)), i.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (i = s, i.append("cacheControl", o.cacheControl), c && i.append("metadata", this.encodeMetadata(c))) : (i = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, c && (a["x-metadata"] = this.toBase64(this.encodeMetadata(c)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const l = this._removeEmptyFolders(t), u = this._getFinalPath(l), d = yield (e == "PUT" ? lt : z)(this.fetch, `${this.url}/object/${u}`, i, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: l, id: d.Id, fullPath: d.Key },
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
  uploadToSignedUrl(e, t, s, r) {
    return R(this, void 0, void 0, function* () {
      const i = this._removeEmptyFolders(e), o = this._getFinalPath(i), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let c;
        const l = Object.assign({ upsert: Jt.upsert }, r), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(l.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (c = new FormData(), c.append("cacheControl", l.cacheControl), c.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (c = s, c.append("cacheControl", l.cacheControl)) : (c = s, u["cache-control"] = `max-age=${l.cacheControl}`, u["content-type"] = l.contentType);
        const d = yield lt(this.fetch, a.toString(), c, { headers: u });
        return {
          data: { path: i, fullPath: d.Key },
          error: null
        };
      } catch (c) {
        if (O(c))
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
    return R(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const r = Object.assign({}, this.headers);
        t != null && t.upsert && (r["x-upsert"] = "true");
        const i = yield z(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + i.url), a = o.searchParams.get("token");
        if (!a)
          throw new Ct("No token returned by API");
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
        return { data: yield z(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (O(r))
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
    return R(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield z(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (r) {
        if (O(r))
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
    return R(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e), i = yield z(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return i = { signedUrl: encodeURI(`${this.url}${i.signedURL}${o}`) }, { data: i, error: null };
      } catch (r) {
        if (O(r))
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
    return R(this, void 0, void 0, function* () {
      try {
        const r = yield z(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), i = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: r.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${i}`) : null })),
          error: null
        };
      } catch (r) {
        if (O(r))
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
    return R(this, void 0, void 0, function* () {
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", i = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = i ? `?${i}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield De(this.fetch, `${this.url}/${r}/${a}${o}`, {
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
        const s = yield De(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: ct(s), error: null };
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
        return yield Zr(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (O(s) && s instanceof at) {
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
    const s = this._getFinalPath(e), r = [], i = t != null && t.download ? `download=${t.download === !0 ? "" : t.download}` : "";
    i !== "" && r.push(i);
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
    return R(this, void 0, void 0, function* () {
      try {
        return { data: yield As(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
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
        const r = Object.assign(Object.assign(Object.assign({}, en), t), { prefix: e || "" });
        return { data: yield z(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
      } catch (r) {
        if (O(r))
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
const sn = "2.10.4", rn = { "X-Client-Info": `storage-js/${sn}` };
var ce = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
class nn {
  constructor(e, t = {}, s, r) {
    const i = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(i.hostname) && !i.hostname.includes("storage.supabase.") && (i.hostname = i.hostname.replace("supabase.", "storage.supabase.")), this.url = i.href, this.headers = Object.assign(Object.assign({}, rn), t), this.fetch = Ts(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield De(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
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
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield De(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
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
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield z(this.fetch, `${this.url}/bucket`, {
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
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield lt(this.fetch, `${this.url}/bucket/${e}`, {
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
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield z(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
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
    return ce(this, void 0, void 0, function* () {
      try {
        return { data: yield As(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (O(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class on extends nn {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new tn(this.url, this.headers, e, this.fetch);
  }
}
const an = "2.53.0";
let _e = "";
typeof Deno < "u" ? _e = "deno" : typeof document < "u" ? _e = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? _e = "react-native" : _e = "node";
const cn = { "X-Client-Info": `supabase-js-${_e}/${an}` }, ln = {
  headers: cn
}, un = {
  schema: "public"
}, dn = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, hn = {};
var fn = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
const pn = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = hs : e = fetch, (...t) => e(...t);
}, gn = () => typeof Headers > "u" ? fs : Headers, mn = (n, e, t) => {
  const s = pn(t), r = gn();
  return (i, o) => fn(void 0, void 0, void 0, function* () {
    var a;
    const c = (a = yield e()) !== null && a !== void 0 ? a : n;
    let l = new r(o == null ? void 0 : o.headers);
    return l.has("apikey") || l.set("apikey", n), l.has("Authorization") || l.set("Authorization", `Bearer ${c}`), s(i, Object.assign(Object.assign({}, o), { headers: l }));
  });
};
var vn = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
function yn(n) {
  return n.endsWith("/") ? n : n + "/";
}
function bn(n, e) {
  var t, s;
  const { db: r, auth: i, realtime: o, global: a } = n, { db: c, auth: l, realtime: u, global: d } = e, h = {
    db: Object.assign(Object.assign({}, c), r),
    auth: Object.assign(Object.assign({}, l), i),
    realtime: Object.assign(Object.assign({}, u), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, d), a), { headers: Object.assign(Object.assign({}, (t = d == null ? void 0 : d.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => vn(this, void 0, void 0, function* () {
      return "";
    })
  };
  return n.accessToken ? h.accessToken = n.accessToken : delete h.accessToken, h;
}
const Ps = "2.71.1", fe = 30 * 1e3, ut = 3, Xe = ut * fe, _n = "http://localhost:9999", wn = "supabase.auth.token", Sn = { "X-Client-Info": `gotrue-js/${Ps}` }, dt = "X-Supabase-Api-Version", xs = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, kn = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, En = 10 * 60 * 1e3;
class It extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function b(n) {
  return typeof n == "object" && n !== null && "__isAuthError" in n;
}
class Cn extends It {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function In(n) {
  return b(n) && n.name === "AuthApiError";
}
class Os extends It {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class Q extends It {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class J extends Q {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function Tn(n) {
  return b(n) && n.name === "AuthSessionMissingError";
}
class Oe extends Q {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class je extends Q {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class $e extends Q {
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
function An(n) {
  return b(n) && n.name === "AuthImplicitGrantRedirectError";
}
class Yt extends Q {
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
class ht extends Q {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function Qe(n) {
  return b(n) && n.name === "AuthRetryableFetchError";
}
class Xt extends Q {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class ft extends Q {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Le = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Qt = ` 	
\r=`.split(""), Pn = (() => {
  const n = new Array(128);
  for (let e = 0; e < n.length; e += 1)
    n[e] = -1;
  for (let e = 0; e < Qt.length; e += 1)
    n[Qt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Le.length; e += 1)
    n[Le[e].charCodeAt(0)] = e;
  return n;
})();
function Zt(n, e, t) {
  if (n !== null)
    for (e.queue = e.queue << 8 | n, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Le[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Le[s]), e.queuedBits -= 6;
    }
}
function js(n, e, t) {
  const s = Pn[n];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(n)}"`);
  }
}
function es(n) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, i = (o) => {
    jn(o, s, t);
  };
  for (let o = 0; o < n.length; o += 1)
    js(n.charCodeAt(o), r, i);
  return e.join("");
}
function xn(n, e) {
  if (n <= 127) {
    e(n);
    return;
  } else if (n <= 2047) {
    e(192 | n >> 6), e(128 | n & 63);
    return;
  } else if (n <= 65535) {
    e(224 | n >> 12), e(128 | n >> 6 & 63), e(128 | n & 63);
    return;
  } else if (n <= 1114111) {
    e(240 | n >> 18), e(128 | n >> 12 & 63), e(128 | n >> 6 & 63), e(128 | n & 63);
    return;
  }
  throw new Error(`Unrecognized Unicode codepoint: ${n.toString(16)}`);
}
function On(n, e) {
  for (let t = 0; t < n.length; t += 1) {
    let s = n.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (n.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    xn(s, e);
  }
}
function jn(n, e, t) {
  if (e.utf8seq === 0) {
    if (n <= 127) {
      t(n);
      return;
    }
    for (let s = 1; s < 6; s += 1)
      if (!(n >> 7 - s & 1)) {
        e.utf8seq = s;
        break;
      }
    if (e.utf8seq === 2)
      e.codepoint = n & 31;
    else if (e.utf8seq === 3)
      e.codepoint = n & 15;
    else if (e.utf8seq === 4)
      e.codepoint = n & 7;
    else
      throw new Error("Invalid UTF-8 sequence");
    e.utf8seq -= 1;
  } else if (e.utf8seq > 0) {
    if (n <= 127)
      throw new Error("Invalid UTF-8 sequence");
    e.codepoint = e.codepoint << 6 | n & 63, e.utf8seq -= 1, e.utf8seq === 0 && t(e.codepoint);
  }
}
function $n(n) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < n.length; r += 1)
    js(n.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function Rn(n) {
  const e = [];
  return On(n, (t) => e.push(t)), new Uint8Array(e);
}
function Dn(n) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return n.forEach((r) => Zt(r, t, s)), Zt(null, t, s), e.join("");
}
function Ln(n) {
  return Math.round(Date.now() / 1e3) + n;
}
function Nn() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(n) {
    const e = Math.random() * 16 | 0;
    return (n == "x" ? e : e & 3 | 8).toString(16);
  });
}
const N = () => typeof window < "u" && typeof document < "u", Z = {
  tested: !1,
  writable: !1
}, $s = () => {
  if (!N())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (Z.tested)
    return Z.writable;
  const n = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(n, n), globalThis.localStorage.removeItem(n), Z.tested = !0, Z.writable = !0;
  } catch {
    Z.tested = !0, Z.writable = !1;
  }
  return Z.writable;
};
function Un(n) {
  const e = {}, t = new URL(n);
  if (t.hash && t.hash[0] === "#")
    try {
      new URLSearchParams(t.hash.substring(1)).forEach((r, i) => {
        e[i] = r;
      });
    } catch {
    }
  return t.searchParams.forEach((s, r) => {
    e[r] = s;
  }), e;
}
const Rs = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => ve).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Fn = (n) => typeof n == "object" && n !== null && "status" in n && "ok" in n && "json" in n && typeof n.json == "function", pe = async (n, e, t) => {
  await n.setItem(e, JSON.stringify(t));
}, ee = async (n, e) => {
  const t = await n.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, G = async (n, e) => {
  await n.removeItem(e);
};
class We {
  constructor() {
    this.promise = new We.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
We.promiseConstructor = Promise;
function Ze(n) {
  const e = n.split(".");
  if (e.length !== 3)
    throw new ft("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!kn.test(e[s]))
      throw new ft("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(es(e[0])),
    payload: JSON.parse(es(e[1])),
    signature: $n(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Mn(n) {
  return await new Promise((e) => {
    setTimeout(() => e(null), n);
  });
}
function Bn(n, e) {
  return new Promise((s, r) => {
    (async () => {
      for (let i = 0; i < 1 / 0; i++)
        try {
          const o = await n(i);
          if (!e(i, null, o)) {
            s(o);
            return;
          }
        } catch (o) {
          if (!e(i, o)) {
            r(o);
            return;
          }
        }
    })();
  });
}
function qn(n) {
  return ("0" + n.toString(16)).substr(-2);
}
function zn() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let i = 0; i < 56; i++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, qn).join("");
}
async function Vn(n) {
  const t = new TextEncoder().encode(n), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((i) => String.fromCharCode(i)).join("");
}
async function Hn(n) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), n;
  const t = await Vn(n);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function le(n, e, t = !1) {
  const s = zn();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await pe(n, `${e}-code-verifier`, r);
  const i = await Hn(s);
  return [i, s === i ? "plain" : "s256"];
}
const Wn = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function Kn(n) {
  const e = n.headers.get(dt);
  if (!e || !e.match(Wn))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function Gn(n) {
  if (!n)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (n <= e)
    throw new Error("JWT has expired");
}
function Jn(n) {
  switch (n) {
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
const Yn = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function ue(n) {
  if (!Yn.test(n))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function et() {
  const n = {};
  return new Proxy(n, {
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
function ts(n) {
  return JSON.parse(JSON.stringify(n));
}
var Xn = function(n, e) {
  var t = {};
  for (var s in n) Object.prototype.hasOwnProperty.call(n, s) && e.indexOf(s) < 0 && (t[s] = n[s]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(n); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(n, s[r]) && (t[s[r]] = n[s[r]]);
  return t;
};
const te = (n) => n.msg || n.message || n.error_description || n.error || JSON.stringify(n), Qn = [502, 503, 504];
async function ss(n) {
  var e;
  if (!Fn(n))
    throw new ht(te(n), 0);
  if (Qn.includes(n.status))
    throw new ht(te(n), n.status);
  let t;
  try {
    t = await n.json();
  } catch (i) {
    throw new Os(te(i), i);
  }
  let s;
  const r = Kn(n);
  if (r && r.getTime() >= xs["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new Xt(te(t), n.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new J();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((i, o) => i && typeof o == "string", !0))
    throw new Xt(te(t), n.status, t.weak_password.reasons);
  throw new Cn(te(t), n.status || 500, s);
}
const Zn = (n, e, t, s) => {
  const r = { method: n, headers: (e == null ? void 0 : e.headers) || {} };
  return n === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function S(n, e, t, s) {
  var r;
  const i = Object.assign({}, s == null ? void 0 : s.headers);
  i[dt] || (i[dt] = xs["2024-01-01"].name), s != null && s.jwt && (i.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", c = await ei(n, e, t + a, {
    headers: i,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(c) : { data: Object.assign({}, c), error: null };
}
async function ei(n, e, t, s, r, i) {
  const o = Zn(e, s, r, i);
  let a;
  try {
    a = await n(t, Object.assign({}, o));
  } catch (c) {
    throw console.error(c), new ht(te(c), 0);
  }
  if (a.ok || await ss(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (c) {
    await ss(c);
  }
}
function M(n) {
  var e;
  let t = null;
  ni(n) && (t = Object.assign({}, n), n.expires_at || (t.expires_at = Ln(n.expires_in)));
  const s = (e = n.user) !== null && e !== void 0 ? e : n;
  return { data: { session: t, user: s }, error: null };
}
function rs(n) {
  const e = M(n);
  return !e.error && n.weak_password && typeof n.weak_password == "object" && Array.isArray(n.weak_password.reasons) && n.weak_password.reasons.length && n.weak_password.message && typeof n.weak_password.message == "string" && n.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = n.weak_password), e;
}
function Y(n) {
  var e;
  return { data: { user: (e = n.user) !== null && e !== void 0 ? e : n }, error: null };
}
function ti(n) {
  return { data: n, error: null };
}
function si(n) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: i } = n, o = Xn(n, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: r,
    verification_type: i
  }, c = Object.assign({}, o);
  return {
    data: {
      properties: a,
      user: c
    },
    error: null
  };
}
function ri(n) {
  return n;
}
function ni(n) {
  return n.access_token && n.refresh_token && n.expires_in;
}
const tt = ["global", "local", "others"];
var ii = function(n, e) {
  var t = {};
  for (var s in n) Object.prototype.hasOwnProperty.call(n, s) && e.indexOf(s) < 0 && (t[s] = n[s]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(n); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(n, s[r]) && (t[s[r]] = n[s[r]]);
  return t;
};
class oi {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = Rs(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = tt[0]) {
    if (tt.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${tt.join(", ")}`);
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
      const { options: t } = e, s = ii(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: si,
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
    var t, s, r, i, o, a, c;
    try {
      const l = { nextPage: null, lastPage: 0, total: 0 }, u = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (i = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: ri
      });
      if (u.error)
        throw u.error;
      const d = await u.json(), h = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (c = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && c !== void 0 ? c : [];
      return f.length > 0 && (f.forEach((p) => {
        const v = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        l[`${g}Page`] = v;
      }), l.total = parseInt(h)), { data: Object.assign(Object.assign({}, d), l), error: null };
    } catch (l) {
      if (b(l))
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
    ue(e);
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
    ue(e);
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
    ue(e);
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
    ue(e.userId);
    try {
      const { data: t, error: s } = await S(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (r) => ({ data: { factors: r }, error: null })
      });
      return { data: t, error: s };
    } catch (t) {
      if (b(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    ue(e.userId), ue(e.id);
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
function ns(n = {}) {
  return {
    getItem: (e) => n[e] || null,
    setItem: (e, t) => {
      n[e] = t;
    },
    removeItem: (e) => {
      delete n[e];
    }
  };
}
function ai() {
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
const de = {
  /**
   * @experimental
   */
  debug: !!(globalThis && $s() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class Ds extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class ci extends Ds {
}
async function li(n, e, t) {
  de.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", n, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), de.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", n);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(n, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      de.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", n, r.name);
      try {
        return await t();
      } finally {
        de.debug && console.log("@supabase/gotrue-js: navigatorLock: released", n, r.name);
      }
    } else {
      if (e === 0)
        throw de.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", n), new ci(`Acquiring an exclusive Navigator LockManager lock "${n}" immediately failed`);
      if (de.debug)
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
ai();
const ui = {
  url: _n,
  storageKey: wn,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: Sn,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function is(n, e, t) {
  return await t();
}
const he = {};
class Ie {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = Ie.nextInstanceID, Ie.nextInstanceID += 1, this.instanceID > 0 && N() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, ui), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new oi({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = Rs(r.fetch), this.lock = r.lock || is, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : N() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = li : this.lock = is, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : $s() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = ns(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = ns(this.memoryStorage)), N() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
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
    return (t = (e = he[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    he[this.storageKey] = Object.assign(Object.assign({}, he[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = he[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    he[this.storageKey] = Object.assign(Object.assign({}, he[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Ps}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = Un(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), N() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: i } = await this._getSessionFromURL(t, s);
        if (i) {
          if (this._debug("#_initialize()", "error detecting session from URL", i), An(i)) {
            const c = (e = i.details) === null || e === void 0 ? void 0 : e.code;
            if (c === "identity_already_exists" || c === "identity_not_found" || c === "single_identity_not_deletable")
              return { error: i };
          }
          return await this._removeSession(), { error: i };
        }
        const { session: o, redirectType: a } = r;
        return this._debug("#_initialize()", "detected session in URL", o, "redirect type", a), await this._saveSession(o), setTimeout(async () => {
          a === "recovery" ? await this._notifyAllSubscribers("PASSWORD_RECOVERY", o) : await this._notifyAllSubscribers("SIGNED_IN", o);
        }, 0), { error: null };
      }
      return await this._recoverAndRefresh(), { error: null };
    } catch (t) {
      return b(t) ? { error: t } : {
        error: new Os("Unexpected error during initialization", t)
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
      const i = await S(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (r = e == null ? void 0 : e.options) === null || r === void 0 ? void 0 : r.captchaToken }
        },
        xform: M
      }), { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
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
    var t, s, r;
    try {
      let i;
      if ("email" in e) {
        const { email: u, password: d, options: h } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await le(this.storage, this.storageKey)), i = await S(this.fetch, "POST", `${this.url}/signup`, {
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
          xform: M
        });
      } else if ("phone" in e) {
        const { phone: u, password: d, options: h } = e;
        i = await S(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: d,
            data: (s = h == null ? void 0 : h.data) !== null && s !== void 0 ? s : {},
            channel: (r = h == null ? void 0 : h.channel) !== null && r !== void 0 ? r : "sms",
            gotrue_meta_security: { captcha_token: h == null ? void 0 : h.captchaToken }
          },
          xform: M
        });
      } else
        throw new je("You must provide either an email or phone number and a password");
      const { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const c = o.session, l = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
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
          xform: rs
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
          xform: rs
        });
      } else
        throw new je("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new Oe() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: r
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
    var t, s, r, i;
    return await this._handleProviderSignIn(e.provider, {
      redirectTo: (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo,
      scopes: (s = e.options) === null || s === void 0 ? void 0 : s.scopes,
      queryParams: (r = e.options) === null || r === void 0 ? void 0 : r.queryParams,
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
    var t, s, r, i, o, a, c, l, u, d, h, f;
    let p, v;
    if ("message" in e)
      p = e.message, v = e.signature;
    else {
      const { chain: g, wallet: w, statement: C, options: y } = e;
      let _;
      if (N())
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
        if (typeof w != "object" || !(y != null && y.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        _ = w;
      }
      const T = new URL((t = y == null ? void 0 : y.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in _ && _.signIn) {
        const k = await _.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, y == null ? void 0 : y.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: T.host,
          uri: T.href
        }), C ? { statement: C } : null));
        let E;
        if (Array.isArray(k) && k[0] && typeof k[0] == "object")
          E = k[0];
        else if (k && typeof k == "object" && "signedMessage" in k && "signature" in k)
          E = k;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in E && "signature" in E && (typeof E.signedMessage == "string" || E.signedMessage instanceof Uint8Array) && E.signature instanceof Uint8Array)
          p = typeof E.signedMessage == "string" ? E.signedMessage : new TextDecoder().decode(E.signedMessage), v = E.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in _) || typeof _.signMessage != "function" || !("publicKey" in _) || typeof _ != "object" || !_.publicKey || !("toBase58" in _.publicKey) || typeof _.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${T.host} wants you to sign in with your Solana account:`,
          _.publicKey.toBase58(),
          ...C ? ["", C, ""] : [""],
          "Version: 1",
          `URI: ${T.href}`,
          `Issued At: ${(r = (s = y == null ? void 0 : y.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((i = y == null ? void 0 : y.signInWithSolana) === null || i === void 0) && i.notBefore ? [`Not Before: ${y.signInWithSolana.notBefore}`] : [],
          ...!((o = y == null ? void 0 : y.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${y.signInWithSolana.expirationTime}`] : [],
          ...!((a = y == null ? void 0 : y.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${y.signInWithSolana.chainId}`] : [],
          ...!((c = y == null ? void 0 : y.signInWithSolana) === null || c === void 0) && c.nonce ? [`Nonce: ${y.signInWithSolana.nonce}`] : [],
          ...!((l = y == null ? void 0 : y.signInWithSolana) === null || l === void 0) && l.requestId ? [`Request ID: ${y.signInWithSolana.requestId}`] : [],
          ...!((d = (u = y == null ? void 0 : y.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || d === void 0) && d.length ? [
            "Resources",
            ...y.signInWithSolana.resources.map((E) => `- ${E}`)
          ] : []
        ].join(`
`);
        const k = await _.signMessage(new TextEncoder().encode(p), "utf8");
        if (!k || !(k instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        v = k;
      }
    }
    try {
      const { data: g, error: w } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: Dn(v) }, !((h = e.options) === null || h === void 0) && h.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: M
      });
      if (w)
        throw w;
      return !g || !g.session || !g.user ? {
        data: { user: null, session: null },
        error: new Oe()
      } : (g.session && (await this._saveSession(g.session), await this._notifyAllSubscribers("SIGNED_IN", g.session)), { data: Object.assign({}, g), error: w });
    } catch (g) {
      if (b(g))
        return { data: { user: null, session: null }, error: g };
      throw g;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await ee(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: i, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: M
      });
      if (await G(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !i || !i.session || !i.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new Oe()
      } : (i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", i.session)), { data: Object.assign(Object.assign({}, i), { redirectType: r ?? null }), error: o });
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
      const { options: t, provider: s, token: r, access_token: i, nonce: o } = e, a = await S(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: r,
          access_token: i,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: M
      }), { data: c, error: l } = a;
      return l ? { data: { user: null, session: null }, error: l } : !c || !c.session || !c.user ? {
        data: { user: null, session: null },
        error: new Oe()
      } : (c.session && (await this._saveSession(c.session), await this._notifyAllSubscribers("SIGNED_IN", c.session)), { data: c, error: l });
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
    var t, s, r, i, o;
    try {
      if ("email" in e) {
        const { email: a, options: c } = e;
        let l = null, u = null;
        this.flowType === "pkce" && ([l, u] = await le(this.storage, this.storageKey));
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
            create_user: (i = c == null ? void 0 : c.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: c == null ? void 0 : c.captchaToken },
            channel: (o = c == null ? void 0 : c.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: l == null ? void 0 : l.message_id }, error: u };
      }
      throw new je("You must provide either an email or phone number.");
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
      let r, i;
      "options" in e && (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, i = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: i } }),
        redirectTo: r,
        xform: M
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const c = o.session, l = o.user;
      return c != null && c.access_token && (await this._saveSession(c), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", c)), { data: { user: l, session: c }, error: null };
    } catch (r) {
      if (b(r))
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
      let i = null, o = null;
      return this.flowType === "pkce" && ([i, o] = await le(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: i, code_challenge_method: o }),
        headers: this.headers,
        xform: ti
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
          throw new J();
        const { error: r } = await S(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: r };
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
        const { email: s, type: r, options: i } = e, { error: o } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            email: s,
            type: r,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          },
          redirectTo: i == null ? void 0 : i.emailRedirectTo
        });
        return { data: { user: null, session: null }, error: o };
      } else if ("phone" in e) {
        const { phone: s, type: r, options: i } = e, { data: o, error: a } = await S(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: s,
            type: r,
            gotrue_meta_security: { captcha_token: i == null ? void 0 : i.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new je("You must provide either an email or phone number and a type");
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
      const t = await ee(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < Xe : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await ee(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = et();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (c, l, u) => (!o && l === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(c, l, u))
          });
        }
        return { data: { session: e }, error: null };
      }
      const { session: r, error: i } = await this._callRefreshToken(e.refresh_token);
      return i ? { data: { session: null }, error: i } : { data: { session: r }, error: null };
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
        var s, r, i;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new J() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (i = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && i !== void 0 ? i : void 0,
          xform: Y
        });
      });
    } catch (t) {
      if (b(t))
        return Tn(t) && (await this._removeSession(), await G(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
        const { data: r, error: i } = s;
        if (i)
          throw i;
        if (!r.session)
          throw new J();
        const o = r.session;
        let a = null, c = null;
        this.flowType === "pkce" && e.email != null && ([a, c] = await le(this.storage, this.storageKey));
        const { data: l, error: u } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: c }),
          jwt: o.access_token,
          xform: Y
        });
        if (u)
          throw u;
        return o.user = l.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
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
        throw new J();
      const t = Date.now() / 1e3;
      let s = t, r = !0, i = null;
      const { payload: o } = Ze(e.access_token);
      if (o.exp && (s = o.exp, r = s <= t), r) {
        const { session: a, error: c } = await this._callRefreshToken(e.refresh_token);
        if (c)
          return { data: { user: null, session: null }, error: c };
        if (!a)
          return { data: { user: null, session: null }, error: null };
        i = a;
      } else {
        const { data: a, error: c } = await this._getUser(e.access_token);
        if (c)
          throw c;
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
          throw new J();
        const { session: r, error: i } = await this._callRefreshToken(e.refresh_token);
        return i ? { data: { user: null, session: null }, error: i } : r ? { data: { user: r.user, session: r }, error: null } : { data: { user: null, session: null }, error: null };
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
      if (!N())
        throw new $e("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new $e(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Yt("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new $e("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Yt("No code detected.");
        const { data: C, error: y } = await this._exchangeCodeForSession(e.code);
        if (y)
          throw y;
        const _ = new URL(window.location.href);
        return _.searchParams.delete("code"), window.history.replaceState(window.history.state, "", _.toString()), { data: { session: C.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: i, refresh_token: o, expires_in: a, expires_at: c, token_type: l } = e;
      if (!i || !a || !o || !l)
        throw new $e("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), d = parseInt(a);
      let h = u + d;
      c && (h = parseInt(c));
      const f = h - u;
      f * 1e3 <= fe && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${d}s`);
      const p = h - d;
      u - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, h, u) : u - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, h, u);
      const { data: v, error: g } = await this._getUser(i);
      if (g)
        throw g;
      const w = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: i,
        expires_in: d,
        expires_at: h,
        refresh_token: o,
        token_type: l,
        user: v.user
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
    const t = await ee(this.storage, `${this.storageKey}-code-verifier`);
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
      const { data: r, error: i } = t;
      if (i)
        return { error: i };
      const o = (s = r.session) === null || s === void 0 ? void 0 : s.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(In(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
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
    const t = Nn(), s = {
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
        const { data: { session: i }, error: o } = t;
        if (o)
          throw o;
        await ((s = this.stateChangeEmitters.get(e)) === null || s === void 0 ? void 0 : s.callback("INITIAL_SESSION", i)), this._debug("INITIAL_SESSION", "callback id", e, "session", i);
      } catch (i) {
        await ((r = this.stateChangeEmitters.get(e)) === null || r === void 0 ? void 0 : r.callback("INITIAL_SESSION", null)), this._debug("INITIAL_SESSION", "callback id", e, "error", i), console.error(i);
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
    this.flowType === "pkce" && ([s, r] = await le(
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
      const { data: s, error: r } = await this._useSession(async (i) => {
        var o, a, c, l, u;
        const { data: d, error: h } = i;
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
      return N() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
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
        var s, r;
        const { data: i, error: o } = t;
        if (o)
          throw o;
        return await S(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (r = (s = i.session) === null || s === void 0 ? void 0 : s.access_token) !== null && r !== void 0 ? r : void 0
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
      return await Bn(async (r) => (r > 0 && await Mn(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: M
      })), (r, i) => {
        const o = 200 * Math.pow(2, r);
        return i && Qe(i) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < fe;
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), N() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
      const r = await ee(this.storage, this.storageKey);
      if (r && this.userStorage) {
        let o = await ee(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await pe(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : et();
      } else if (r && !r.user && !r.user) {
        const o = await ee(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await G(this.storage, this.storageKey + "-user"), await pe(this.storage, this.storageKey, r)) : r.user = et();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const i = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < Xe;
      if (this._debug(s, `session has${i ? "" : " not"} expired with margin of ${Xe}s`), i) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), Qe(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
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
      throw new J();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new We();
      const { data: i, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!i.session)
        throw new J();
      await this._saveSession(i.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", i.session);
      const a = { session: i.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (i) {
      if (this._debug(r, "error", i), b(i)) {
        const o = { session: null, error: i };
        return Qe(i) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
      }
      throw (s = this.refreshingDeferred) === null || s === void 0 || s.reject(i), i;
    } finally {
      this.refreshingDeferred = null, this._debug(r, "end");
    }
  }
  async _notifyAllSubscribers(e, t, s = !0) {
    const r = `#_notifyAllSubscribers(${e})`;
    this._debug(r, "begin", t, `broadcast = ${s}`);
    try {
      this.broadcastChannel && s && this.broadcastChannel.postMessage({ event: e, session: t });
      const i = [], o = Array.from(this.stateChangeEmitters.values()).map(async (a) => {
        try {
          await a.callback(e, t);
        } catch (c) {
          i.push(c);
        }
      });
      if (await Promise.all(o), i.length > 0) {
        for (let a = 0; a < i.length; a += 1)
          console.error(i[a]);
        throw i[0];
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
      !s && t.user && await pe(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const i = ts(r);
      await pe(this.storage, this.storageKey, i);
    } else {
      const r = ts(t);
      await pe(this.storage, this.storageKey, r);
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
      e && N() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), fe);
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
              const r = Math.floor((s.expires_at * 1e3 - e) / fe);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${fe}ms, refresh threshold is ${ut} ticks`), r <= ut && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof Ds)
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
    if (this._debug("#_handleVisibilityChange()"), !N() || !(window != null && window.addEventListener))
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
      const [i, o] = await le(this.storage, this.storageKey), a = new URLSearchParams({
        code_challenge: `${encodeURIComponent(i)}`,
        code_challenge_method: `${encodeURIComponent(o)}`
      });
      r.push(a.toString());
    }
    if (s != null && s.queryParams) {
      const i = new URLSearchParams(s.queryParams);
      r.push(i.toString());
    }
    return s != null && s.skipBrowserRedirect && r.push(`skip_http_redirect=${s.skipBrowserRedirect}`), `${e}?${r.join("&")}`;
  }
  async _unenroll(e) {
    try {
      return await this._useSession(async (t) => {
        var s;
        const { data: r, error: i } = t;
        return i ? { data: null, error: i } : await S(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
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
        var s, r;
        const { data: i, error: o } = t;
        if (o)
          return { data: null, error: o };
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: c, error: l } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return l ? { data: null, error: l } : (e.factorType === "totp" && (!((r = c == null ? void 0 : c.totp) === null || r === void 0) && r.qr_code) && (c.totp.qr_code = `data:image/svg+xml;utf-8,${c.totp.qr_code}`), { data: c, error: null });
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
          const { data: r, error: i } = t;
          if (i)
            return { data: null, error: i };
          const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
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
          const { data: r, error: i } = t;
          return i ? { data: null, error: i } : await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
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
    const s = (e == null ? void 0 : e.factors) || [], r = s.filter((o) => o.factor_type === "totp" && o.status === "verified"), i = s.filter((o) => o.factor_type === "phone" && o.status === "verified");
    return {
      data: {
        all: s,
        totp: r,
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
      const { data: { session: r }, error: i } = e;
      if (i)
        return { data: null, error: i };
      if (!r)
        return {
          data: { currentLevel: null, nextLevel: null, currentAuthenticationMethods: [] },
          error: null
        };
      const { payload: o } = Ze(r.access_token);
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
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + En > r)
      return s;
    const { data: i, error: o } = await S(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
      headers: this.headers
    });
    if (o)
      throw o;
    return !i.keys || i.keys.length === 0 || (this.jwks = i, this.jwks_cached_at = r, s = i.keys.find((a) => a.kid === e), !s) ? null : s;
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
      const { header: r, payload: i, signature: o, raw: { header: a, payload: c } } = Ze(s);
      t != null && t.allowExpired || Gn(i.exp);
      const l = !r.alg || r.alg.startsWith("HS") || !r.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(r.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!l) {
        const { error: f } = await this.getUser(s);
        if (f)
          throw f;
        return {
          data: {
            claims: i,
            header: r,
            signature: o
          },
          error: null
        };
      }
      const u = Jn(r.alg), d = await crypto.subtle.importKey("jwk", l, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, d, o, Rn(`${a}.${c}`)))
        throw new ft("Invalid JWT signature");
      return {
        data: {
          claims: i,
          header: r,
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
Ie.nextInstanceID = 0;
const di = Ie;
class hi extends di {
  constructor(e) {
    super(e);
  }
}
var fi = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      u.done ? i(u.value) : r(u.value).then(a, c);
    }
    l((s = s.apply(n, e || [])).next());
  });
};
class pi {
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
    var r, i, o;
    if (this.supabaseUrl = e, this.supabaseKey = t, !e)
      throw new Error("supabaseUrl is required.");
    if (!t)
      throw new Error("supabaseKey is required.");
    const a = yn(e), c = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", c), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", c), this.storageUrl = new URL("storage/v1", c), this.functionsUrl = new URL("functions/v1", c);
    const l = `sb-${c.hostname.split(".")[0]}-auth-token`, u = {
      db: un,
      realtime: hn,
      auth: Object.assign(Object.assign({}, dn), { storageKey: l }),
      global: ln
    }, d = bn(s ?? {}, u);
    this.storageKey = (r = d.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (i = d.global.headers) !== null && i !== void 0 ? i : {}, d.accessToken ? (this.accessToken = d.accessToken, this.auth = new Proxy({}, {
      get: (h, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = d.auth) !== null && o !== void 0 ? o : {}, this.headers, d.global.fetch), this.fetch = mn(t, this._getAccessToken.bind(this), d.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, d.realtime)), this.rest = new Or(new URL("rest/v1", c).href, {
      headers: this.headers,
      schema: d.db.schema,
      fetch: this.fetch
    }), this.storage = new on(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), d.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new or(this.functionsUrl.href, {
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
    return fi(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: i, flowType: o, lock: a, debug: c }, l, u) {
    const d = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new hi({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, d), l),
      storageKey: i,
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
    return new Wr(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const gi = (n, e, t) => new pi(n, e, t);
function mi() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const n = process.version.match(/^v(\d+)\./);
  return n ? parseInt(n[1], 10) <= 18 : !1;
}
mi() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class Tt {
  constructor(e, t) {
    m(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = gi(s, r);
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
      const { data: r, error: i } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: { ...e, config: s }
        }
      );
      return i ? (console.error(
        "Error calling cart-checkout-session function:",
        i
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
const Ke = "assistantAnalyticsPayload", vi = "ei_enhanced_insights", ke = "ei_analytics", At = "ei_insights", pt = "ei_analytics_consent", yi = 3500, bi = 10, _i = 3, wi = 50, Si = 100, ki = 8, Ei = [
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
], Ci = [
  "attribution_history",
  "touch_count",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
  "first_landing_page",
  "first_referrer",
  "first_date_visited",
  "enhanced_insights"
], Ii = 30 * 60 * 1e3;
function Ti(n) {
  let e = 0, t = -1 / 0;
  const s = n.filter((r) => typeof r.enteredAt == "number").sort((r, i) => r.enteredAt - i.enteredAt);
  for (const r of s)
    r.enteredAt - t > Ii && (e += 1), t = Math.max(r.enteredAt, r.enteredAt + gt(r));
  return e;
}
function Ai() {
  try {
    if (typeof navigator > "u") return null;
    const n = String(navigator.userAgent ?? "");
    if (/ipad|tablet|playbook|silk/i.test(n) || /android(?!.*mobile)/i.test(n)) return "tablet";
    const e = navigator.userAgentData;
    return e && typeof e.mobile == "boolean" ? e.mobile ? "mobile" : "desktop" : /mobi|iphone|ipod|android|windows phone|opera mini/i.test(n) ? "mobile" : n ? "desktop" : null;
  } catch {
    return null;
  }
}
function gt(n) {
  return typeof n.activeMs == "number" && n.activeMs > 0 ? n.activeMs : typeof n.leftAt == "number" && n.leftAt > n.enteredAt ? n.leftAt - n.enteredAt : 0;
}
let ie = {}, ge = null, Te = !0, os = !1, B;
const Ls = [];
function Ns(n) {
  if (typeof document > "u") return [];
  const e = n + "=", t = [];
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
function Us() {
  if (B !== void 0) return B;
  B = null;
  try {
    if (ie.cookieDomain)
      return B = ie.cookieDomain.replace(/^\./, ""), B;
    const n = window.location.hostname;
    if (!n || /^[\d.]+$/.test(n) || n === "localhost")
      return null;
    const e = n.split("."), t = "ei_domain_probe";
    for (let s = e.length - 2; s >= 0; s--) {
      const r = e.slice(s).join(".");
      if (document.cookie = `${t}=1; domain=.${r}; path=/; SameSite=Lax`, document.cookie.indexOf(`${t}=1`) !== -1)
        return document.cookie = `${t}=; domain=.${r}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`, B = r, B;
    }
  } catch {
  }
  return B;
}
function Ee(n, e) {
  try {
    const t = encodeURIComponent(JSON.stringify(e));
    if (t.length > yi) return !1;
    const s = Us(), r = window.location.protocol === "https:" ? "; Secure" : "";
    return document.cookie = `${n}=${t}` + (s ? `; domain=.${s}` : "") + `; path=/; SameSite=Lax${r}`, !0;
  } catch {
    return !1;
  }
}
function mt(n) {
  try {
    const e = Us();
    document.cookie = `${n}=` + (e ? `; domain=.${e}` : "") + "; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch {
  }
}
function Fs(n) {
  const e = [];
  for (const t of Ns(n))
    try {
      const s = JSON.parse(t);
      s && typeof s == "object" && !Array.isArray(s) && e.push(s);
    } catch {
    }
  return e;
}
function Ms() {
  const n = {};
  for (const e of Fs(At))
    for (const [t, s] of Object.entries(e)) {
      if (!s || typeof s != "object" || Array.isArray(s))
        continue;
      const r = n[t];
      r && String(s.last_visit_at ?? "") <= String(r.last_visit_at ?? "") || (n[t] = s);
    }
  return n;
}
function Pi(n) {
  if (Ee(ke, n)) return;
  const e = Ne(n);
  for (let t = e.length - 1; t >= 2; t--) {
    const s = [e[0], ...e.slice(-(t - 1))];
    if (Ee(ke, yt(s)))
      return;
  }
  e.length > 1 && Ee(
    ke,
    yt([e[0], e[e.length - 1]])
  );
}
function xi() {
  mt(ke);
}
function Oi() {
  const n = Fs(ke);
  if (n.length === 0) return null;
  const e = (r) => {
    const i = Ne(r), o = i[0], a = o && typeof o.date_visited == "string" ? o.date_visited : "";
    return { touches: i.length, at: a };
  };
  let t = n[0], s = e(t);
  for (const r of n.slice(1)) {
    const i = e(r);
    (i.touches > s.touches || i.touches === s.touches && !!i.at && (!s.at || i.at < s.at)) && (t = r, s = i);
  }
  return t;
}
function ji() {
  const n = Ws();
  if (!n) return null;
  const { visits: e, time_per_page: t, ...s } = n, r = {};
  return Object.entries(t ?? {}).sort((i, o) => o[1] - i[1]).slice(0, bi).forEach(([i, o]) => {
    r[i] = o;
  }), { ...s, time_per_page: r };
}
function $i() {
  try {
    if (typeof window > "u" || ie.shareInsightsAcrossSubdomains === !1 || !Ge())
      return;
    const n = ji();
    if (!n) return;
    const e = window.location.hostname, t = Ms();
    let s = Object.entries(t).filter(([i, o]) => i !== e && o && typeof o == "object").sort(
      (i, o) => {
        var a, c;
        return String(((a = i[1]) == null ? void 0 : a.last_visit_at) ?? "").localeCompare(
          String(((c = o[1]) == null ? void 0 : c.last_visit_at) ?? "")
        );
      }
    );
    s = s.slice(
      Math.max(0, s.length - (_i - 1))
    );
    let r = n;
    for (; ; ) {
      const i = {};
      for (const [a, c] of s) i[a] = c;
      if (i[e] = r, Ee(At, i)) return;
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
function Ri() {
  if (typeof window > "u") return [];
  const n = Ms(), e = window.location.hostname;
  return Object.entries(n).filter(
    ([t, s]) => t !== e && s && typeof s == "object" && !Array.isArray(s)
  ).map(([, t]) => t);
}
function Di(n, e) {
  if (e.length === 0) return n;
  const t = n ? [n, ...e] : e, s = (h) => typeof h == "number" && isFinite(h) ? h : 0;
  let r = 0, i = 0, o = 0;
  const a = [], c = {};
  let l = null, u = null;
  for (const h of t) {
    r += s(h.visit_count), i += s(h.session_count), o += s(h.total_time_seconds), typeof h.pages == "string" && h.pages.split(",").forEach((g) => {
      g && a.indexOf(g) === -1 && a.push(g);
    });
    const f = h.time_per_page;
    if (f && typeof f == "object" && !Array.isArray(f))
      for (const [g, w] of Object.entries(
        f
      ))
        c[g] = (c[g] ?? 0) + s(w);
    const p = typeof h.first_visit_at == "string" ? h.first_visit_at : null, v = typeof h.last_visit_at == "string" ? h.last_visit_at : null;
    p && (!l || p < l) && (l = p), v && (!u || v > u) && (u = v);
  }
  const d = {
    time_per_page: c,
    visit_count: r,
    unique_pages: a.length,
    total_time_seconds: o,
    pages: a.join(",")
  };
  return t.every((h) => typeof h.session_count == "number") && (d.session_count = i), l && (d.first_visit_at = l), u && (d.last_visit_at = u), n && Array.isArray(n.visits) && (d.visits = n.visits), d;
}
function Bs() {
  try {
    const n = window, e = n.Cookiebot;
    if (e && e.consent && typeof e.consent.statistics == "boolean" && e.hasResponse)
      return !!(e.consent.statistics || e.consent.marketing);
    if (typeof n.OnetrustActiveGroups == "string" && n.OnetrustActiveGroups)
      return /C0002|C0004/.test(n.OnetrustActiveGroups);
  } catch {
  }
  return null;
}
function Li() {
  if (os || typeof window > "u") return;
  os = !0;
  const n = () => {
    const e = Bs();
    e === !0 ? Ce(!0) : e === !1 && Ce(!1);
  };
  try {
    window.addEventListener("CookiebotOnConsentReady", n), window.addEventListener("CookiebotOnAccept", n), window.addEventListener("CookiebotOnDecline", n), window.addEventListener("OneTrustGroupsUpdated", n);
    const e = window.__tcfapi;
    typeof e == "function" && e("addEventListener", 2, (t, s) => {
      var r, i;
      !s || !t || (t.eventStatus === "tcloaded" || t.eventStatus === "useractioncomplete") && Ce(!!((i = (r = t.purpose) == null ? void 0 : r.consents) != null && i[1]));
    });
  } catch {
  }
}
function Ge() {
  return qs() ? !1 : !ie.requireConsent || Te;
}
function qs() {
  return Ns(pt).indexOf("0") !== -1;
}
function zs(n) {
  Ls.push(n);
}
function Ce(n) {
  const e = n !== Te;
  if (Te = n, n)
    mt(pt), Vs();
  else {
    Ee(pt, 0), xi(), mt(At);
    try {
      sessionStorage.removeItem(Ke);
    } catch {
    }
  }
  if (e)
    for (const t of Ls)
      try {
        t(n);
      } catch {
      }
}
function Ni() {
  const n = {};
  for (const [e, t] of new URL(
    window.location.href
  ).searchParams.entries())
    n[e] = t;
  return {
    ...n,
    landing_page: window.location.origin + window.location.pathname,
    date_visited: (/* @__PURE__ */ new Date()).toISOString(),
    referrer: document.referrer
  };
}
function vt(n) {
  return Ei.filter((e) => n[e] !== void 0).map((e) => e + "=" + String(n[e])).join("&");
}
function Ne(n) {
  if (!n) return [];
  const e = n.attribution_history;
  if (Array.isArray(e))
    return e.filter(
      (s) => !!s && typeof s == "object" && !Array.isArray(s)
    );
  const t = {};
  for (const [s, r] of Object.entries(n))
    Ci.indexOf(s) === -1 && (t[s] = r);
  return Object.keys(t).length > 0 ? [t] : [];
}
function Ui(...n) {
  const e = /* @__PURE__ */ new Set(), t = [];
  for (const s of n)
    for (const r of s) {
      const i = String(r.date_visited ?? "") + "|" + vt(r);
      e.has(i) || (e.add(i), t.push(r));
    }
  return t.sort(
    (s, r) => String(s.date_visited ?? "").localeCompare(String(r.date_visited ?? ""))
  );
}
function Fi(n) {
  return n.length <= ki ? n : [n[0], ...n.slice(-7)];
}
function Mi(n, e) {
  if (n.length === 0) return [e];
  const t = vt(e);
  return !t || t === vt(n[n.length - 1]) ? n : Fi([...n, e]);
}
function yt(n) {
  if (n.length === 0) return {};
  const e = n[0], s = { ...n[n.length - 1] }, r = (i, o) => {
    e[o] !== void 0 && (s[i] = e[o]);
  };
  return r("first_utm_source", "utm_source"), r("first_utm_medium", "utm_medium"), r("first_utm_campaign", "utm_campaign"), r("first_landing_page", "landing_page"), r("first_referrer", "referrer"), r("first_date_visited", "date_visited"), s.touch_count = n.length, s.attribution_history = n, s;
}
function Vs() {
  if (!(typeof window > "u" || !ge) && !qs())
    try {
      window.sessionStorage && sessionStorage.setItem(
        Ke,
        JSON.stringify(ge)
      ), Pi(ge);
    } catch {
    }
}
function Bi(n) {
  if (!(typeof window > "u")) {
    ie = n ?? {}, B = void 0;
    try {
      const e = window.sessionStorage ? sessionStorage.getItem(Ke) : null;
      let t = null;
      if (e) {
        const r = JSON.parse(e);
        r && typeof r == "object" && !Array.isArray(r) && (t = r);
      }
      const s = Mi(
        Ui(
          Ne(t),
          Ne(Oi())
        ),
        Ni()
      );
      if (ge = yt(s), ie.requireConsent) {
        Li();
        const r = Bs();
        r === null ? Te = !1 : Ce(r);
      } else
        Te = !0, Vs();
    } catch {
    }
  }
}
function Hs(n) {
  let e = n.trim();
  if (!e) return "";
  const t = e.search(/[?#]/);
  return t >= 0 && (e = e.slice(0, t)), e.startsWith("/") || (e = "/" + e), e.length > 1 && e.endsWith("/") && (e = e.slice(0, -1)), e;
}
function qi(n) {
  return Hs(n).replace(/\./g, "_");
}
function Ws() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const n = window.localStorage.getItem(vi);
    if (!n) return null;
    const e = JSON.parse(n), t = Array.isArray(e == null ? void 0 : e.visits) ? e.visits.filter(
      (l) => l && typeof l.page == "string" && typeof l.enteredAt == "number"
    ) : [], s = t[0], r = t[t.length - 1];
    if (!s || !r) return null;
    const i = [];
    for (const l of t) {
      const u = Hs(l.page);
      u && i.indexOf(u) === -1 && i.push(u);
    }
    const o = t.reduce((l, u) => l + gt(u), 0), a = {};
    for (const l of t) {
      const u = qi(l.page);
      u && (a[u] = (a[u] ?? 0) + gt(l));
    }
    const c = {};
    return Object.entries(a).slice(0, Si).forEach(([l, u]) => {
      c[l] = Math.round(u / 1e3);
    }), {
      time_per_page: c,
      visits: t.slice(-wi),
      visit_count: t.length,
      session_count: Ti(t),
      unique_pages: i.length,
      total_time_seconds: Math.round(o / 1e3),
      pages: i.join(","),
      first_visit_at: new Date(s.enteredAt).toISOString(),
      last_visit_at: new Date(r.enteredAt).toISOString()
    };
  } catch {
    return null;
  }
}
function zi() {
  try {
    if (!Ge()) return null;
    let n = {};
    if (typeof window < "u" && window.sessionStorage) {
      const s = sessionStorage.getItem(Ke);
      if (s) {
        const r = JSON.parse(s);
        r && typeof r == "object" && (n = r);
      }
    }
    Object.keys(n).length === 0 && ge && (n = { ...ge });
    let e = Ws();
    ie.shareInsightsAcrossSubdomains !== !1 && (e = Di(
      e,
      Ri()
    )), e && (n.enhanced_insights = e);
    const t = Ai();
    return t && (n.device = t), Object.keys(n).length > 0 ? JSON.stringify(n) : null;
  } catch {
    return null;
  }
}
const Ue = "ei_stay_params", Vi = 7 * 24 * 60 * 60 * 1e3, Hi = 12 * 60 * 60 * 1e3, Wi = 60, Ki = 864e5, Gi = [
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
let Fe = !0, X = null, as = !1, cs = !1;
const ls = (n) => n < 10 ? "0" + n : String(n);
function Re(n, e, t) {
  if (n < 2e3 || n > 2100 || e < 1 || e > 12 || t < 1 || t > 31) return null;
  const s = new Date(Date.UTC(n, e - 1, t));
  return s.getUTCMonth() !== e - 1 || s.getUTCDate() !== t ? null : `${n}-${ls(e)}-${ls(t)}`;
}
function us(n, e) {
  const t = n.trim();
  let s = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:T.*)?$/.exec(t);
  if (s) {
    const h = Re(+s[1], +s[2], +s[3]);
    return h ? [h] : [];
  }
  if (s = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t), !s) return [];
  const r = +s[1], i = +s[2], o = +s[3];
  if (t.charAt(s[1].length) === ".") {
    const h = Re(o, i, r);
    return h ? [h] : [];
  }
  const c = Re(o, i, r), l = Re(o, r, i), u = [], d = e === "DMY" ? [c, l] : [l, c];
  for (const h of d)
    h && u.indexOf(h) === -1 && u.push(h);
  return u;
}
function Ks(n, e) {
  const [t, s, r] = n.split("-").map(Number), [i, o, a] = e.split("-").map(Number);
  return Math.round(
    (Date.UTC(i, o - 1, a) - Date.UTC(t, s - 1, r)) / Ki
  );
}
const Gs = (n, e) => {
  const t = Ks(n, e);
  return t >= 1 && t <= Wi;
}, st = (n) => {
  if (n == null) return;
  const e = Number(n.trim());
  return Number.isInteger(e) && e >= 0 && e <= 99 ? e : void 0;
};
function Ji(n) {
  let e;
  try {
    e = new URL(n);
  } catch {
    return null;
  }
  const t = e.searchParams, s = [];
  for (const [l, u, d] of Gi) {
    const h = t.get(l), f = t.get(u);
    if (!h || !f) continue;
    const p = us(h, d), v = us(f, d), g = [];
    for (const w of p)
      for (const C of v)
        Gs(w, C) && g.push({ checkin: w, checkout: C });
    g.length > 0 && s.push(g);
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
  const i = {
    checkin: r.checkin,
    checkout: r.checkout,
    captured_at: (/* @__PURE__ */ new Date()).toISOString(),
    url: e.origin + e.pathname
  }, o = st(t.get("adults")), a = st(t.get("children")), c = st(t.get("guests"));
  return o !== void 0 ? i.adults = o : c !== void 0 && (i.adults = c), a !== void 0 && (i.children = a), i;
}
const Js = (n, e = Date.now()) => {
  const t = Date.parse(n.captured_at);
  return Number.isFinite(t) && e - t >= 0 && e - t <= Vi;
};
function Yi() {
  try {
    if (typeof window > "u" || !window.localStorage) return null;
    const n = window.localStorage.getItem(Ue);
    if (!n) return null;
    const e = JSON.parse(n);
    if (!e || typeof e != "object" || typeof e.checkin != "string" || typeof e.checkout != "string" || typeof e.captured_at != "string")
      return null;
    const t = e;
    return !Js(t) || !Gs(t.checkin, t.checkout) ? (window.localStorage.removeItem(Ue), null) : t;
  } catch {
    return null;
  }
}
function Ys() {
  var n;
  if (!(typeof window > "u" || !X) && Ge())
    try {
      (n = window.localStorage) == null || n.setItem(
        Ue,
        JSON.stringify(X)
      );
    } catch {
    }
}
function Xs() {
  try {
    typeof window < "u" && window.localStorage && window.localStorage.removeItem(Ue);
  } catch {
  }
}
function bt() {
  if (!Fe || typeof window > "u") return null;
  try {
    const n = Ji(window.location.href);
    return n && (X = n, Ys()), n;
  } catch {
    return null;
  }
}
function Xi(n) {
  if (Fe = (n == null ? void 0 : n.enabled) !== !1, !(!Fe || typeof window > "u")) {
    if (bt(), !cs) {
      cs = !0;
      try {
        window.addEventListener("popstate", () => {
          bt();
        });
      } catch {
      }
    }
    as || (as = !0, zs((e) => {
      e ? Ys() : Xs();
    }));
  }
}
function Qi() {
  if (!Fe) return null;
  const n = bt();
  if (n) return n;
  if (X && Js(X)) return X;
  const e = Yi();
  return e && (X = e), e;
}
function Zi() {
  X = null, Xs();
}
function eo(n, e, t = Hi) {
  if (!e || !Array.isArray(n) || n.length === 0)
    return n;
  const s = Date.parse(e.captured_at);
  if (!Number.isFinite(s) || Date.now() - s > t)
    return n;
  let r = !1;
  const i = Ks(e.checkin, e.checkout), o = n.map((a) => !a || typeof a != "object" || a.startDate || a.endDate || String(a.type ?? "").toLowerCase() === "addon" ? a : (r = !0, {
    ...a,
    startDate: e.checkin,
    endDate: e.checkout,
    nights: i,
    ei_stay_source: "url"
  }));
  return r ? o : n;
}
let ds = !1;
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
    m(this, "boundHandleAutofieldBlur", (e) => this.handleAutofieldBlur(e));
    m(this, "boundSaveAutofieldToStorage", (e) => {
      const t = e.target, s = V.AUTOFIELD_STORAGE_KEYS[t.name];
      s && t.value && this.saveToSessionStorage(s, t.value);
    });
    this.options = e, this.supabaseService = new Tt(
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
      return this.totalAverage = r != null && r.average_checkout_value ? r.average_checkout_value : 0, r ? (this.campaign = r, this.inputDetector = new rt(r.input_mapping), r.type !== "bookvisit" && r.type !== "synxis" && r.type !== "elinapms" && (this.productDetector = new tr(
        r.product_mapping
      ), this.totalExtractor = new sr(
        r.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), r.type === "bookvisit" && ((s = (t = r.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0 && window.location.pathname === "/checkout" && !ds && (ds = !0, this.injectBookVisitAutofields(r.input_mapping)), this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch checkout campaign data"), !1);
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
    var s, r, i, o, a, c, l, u, d, h;
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
      } else if (((r = this.campaign) == null ? void 0 : r.type) === "synxis") {
        const E = await this.withBasketTimeout(
          this.fetchSynxisBasket()
        );
        E && (f = E.products, p = E.total);
      } else if (((i = this.campaign) == null ? void 0 : i.type) === "elinapms") {
        const E = await this.fetchElinapmsBasket();
        E && (f = E.products, p = E.total);
      } else
        f = ((o = this.productDetector) == null ? void 0 : o.detectProducts()) || [], p = ((a = this.totalExtractor) == null ? void 0 : a.extractTotal()) || this.totalAverage;
      const v = ((c = this.options.features) == null ? void 0 : c.stayCapture) === !1 ? null : Qi();
      if (f = eo(f, v), !this.hasContentChanged(
        e,
        f,
        p
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const w = typeof window < "u" ? window.location.href : "", C = this._sessionId || t, y = this.withStay(zi(), v), _ = { ...e }, T = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: _,
        products: f,
        url: w,
        total: p,
        id: C,
        ...y ? { analytics: y } : {},
        ...((l = this.campaign) == null ? void 0 : l.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {},
        ...((d = this.campaign) == null ? void 0 : d.type) === "bookvisit" && this._bookvisitSessionIds ? { metadata: this._bookvisitSessionIds } : {}
      }, k = await this.supabaseService.submitCartSession(T);
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
    const s = new Promise((r) => {
      t = setTimeout(() => {
        console.warn("Basket fetch timed out, continuing without it"), r(null);
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
    const r = JSON.stringify(e) !== JSON.stringify(this.previousContent), i = JSON.stringify(t) !== JSON.stringify(this.previousProducts), o = s !== this.previousTotal;
    return r || i || o;
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
      this.clearSessionIdFromStorage(), this._sessionId = void 0, Zi(), console.log("Completed checkout cleanup finished");
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
      const a = await o.json(), c = this.getBookVisitSessionIds(a);
      return c && (this._bookvisitSessionIds = c), this.extractBookVisitProductsAndTotal(a);
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
    var t, s, r, i;
    try {
      const o = (p) => typeof p == "string" && p.trim() ? p.trim() : typeof p == "number" && isFinite(p) ? String(p) : null, a = (e == null ? void 0 : e.booking) ?? {}, c = (a == null ? void 0 : a.bookingData) ?? {}, l = o(a == null ? void 0 : a.basketId) ?? o(a == null ? void 0 : a.id) ?? o(c == null ? void 0 : c.basketId) ?? o(e == null ? void 0 : e.basketId) ?? o(e == null ? void 0 : e.id), u = o(c == null ? void 0 : c.bookingNumber) ?? o(c == null ? void 0 : c.bookingCode) ?? o(c == null ? void 0 : c.reservationNumber) ?? o(a == null ? void 0 : a.bookingNumber) ?? o(a == null ? void 0 : a.bookingCode), d = o((t = c == null ? void 0 : c.customer) == null ? void 0 : t.countryCode) ?? o((s = c == null ? void 0 : c.customer) == null ? void 0 : s.country) ?? o((r = c == null ? void 0 : c.guest) == null ? void 0 : r.countryCode) ?? o((i = a == null ? void 0 : a.customer) == null ? void 0 : i.countryCode);
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
    var r, i, o;
    const t = [];
    let s = 0;
    try {
      const a = (r = e == null ? void 0 : e.booking) == null ? void 0 : r.bookingData;
      if (!a)
        return { products: t, total: s };
      s = a.totalPrice || 0;
      const c = typeof ((i = a.customer) == null ? void 0 : i.countryCode) == "string" ? a.customer.countryCode : typeof ((o = a.customer) == null ? void 0 : o.country) == "string" ? a.customer.country : void 0, l = a.rooms || [], u = a.roomDescriptions || [], d = a.addOnDescriptions || [];
      l.forEach((f) => {
        var _, T, k, E;
        const p = u.find(
          ($) => $.id === f.roomId
        ), v = f.totalPrice || 0, g = (T = (_ = p == null ? void 0 : p.images) == null ? void 0 : _[0]) == null ? void 0 : T.uri, w = (k = p == null ? void 0 : p.images) == null ? void 0 : k.map(
          ($) => $.uri
        ), C = {
          id: f.roomId,
          name: (p == null ? void 0 : p.name) || "Room",
          price: v,
          quantity: 1,
          type: "room",
          startDate: f.startDate,
          endDate: f.endDate,
          roomConfig: f.roomConfig,
          image: g,
          images: w,
          ...c ? { guestCountry: c } : {}
        };
        if (f.priceInfo && f.priceInfo.length > 0) {
          const $ = f.priceInfo[0].ratePlanId, H = (E = a.ratePlanDescriptions) == null ? void 0 : E.find(
            (F) => F.id === $
          );
          H && (C.ratePlan = H.name);
        }
        t.push(C), (f.mandatoryAddOns || []).forEach(($) => {
          const H = $.totalPrice || 0;
          if (H > 0) {
            const F = d.find(
              (W) => W.id === $.addOnId
            );
            t.push({
              id: $.addOnId,
              name: (F == null ? void 0 : F.name) || "Add-on",
              price: H,
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
          const v = d.find(
            (g) => g.id === f.addOnId
          );
          t.push({
            id: f.addOnId,
            name: (v == null ? void 0 : v.name) || "Add-on",
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
    let i = null;
    for (const o of this.autofieldWrappers) {
      const a = !this.nativeAutofieldExists(
        o.dataset.eiAutofield ?? ""
      );
      a && o.parentElement !== r ? (r.insertBefore(
        o,
        i ? i.nextSibling : r.firstChild
      ), s = !0) : !a && o.parentElement === r && (o.remove(), s = !0), a && (i = o);
    }
    i && e.parentElement !== t ? (t.insertAdjacentElement("afterbegin", e), s = !0) : !i && e.parentElement && (e.remove(), s = !0), s && this.setupAutofieldListenersWithRetry();
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
      for (const i of t) {
        const o = i.toLowerCase();
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
      for (const i of t) {
        const o = i.toLowerCase();
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
    const t = e.includes("firstName"), s = e.includes("lastName"), r = e.includes("email"), i = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber"), c = "bv:box-border bv:flex bv:h-[40px] bv:w-full bv:pl-[14px] bv:rounded-bv_inputRoundedCorners bv:border-solid bv:bv_inputBorder bv:disabled:cursor-not-allowed bv:disabled:opacity-50 bv:font-bv_bodyFontFamily bv:text-bv_bodyFontSize bv:placeholder:text-bv_inputColor/70 bv:focus:outline-hidden! bv:focus:ring-2 bv:bg-bv_inputBackground bv:text-bv_inputColor";
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
            `), i && (l += `
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
    var o, a, c, l, u, d, h, f, p, v, g, w, C, y, _, T, k, E, $, H;
    const t = [];
    let s = 0;
    const r = this.getSynxisActualTotal(), i = this._synxisSessionIds;
    try {
      const F = (e == null ? void 0 : e.ShoppingCart) || [], W = [];
      for (const A of F) {
        const P = ((a = (o = A == null ? void 0 : A.UpdatedData) == null ? void 0 : o.itinerary) == null ? void 0 : a.reservations) || [];
        for (const ae of P)
          W.push({
            resv: ae,
            itineraryNumber: (A == null ? void 0 : A.Itemid) || ""
          });
      }
      let xe = W;
      if (i != null && i.sbeRcDecoded) {
        const A = W.filter(
          ({ resv: P }) => P.id === i.sbeRcDecoded
        );
        A.length > 0 && (xe = A);
      }
      xe === W && W.length > 1 && (xe = [...W].sort(
        (A, P) => P.itineraryNumber.localeCompare(A.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: A } of xe) {
        const P = A.extrasFromShopping || {}, ae = A.stayCriteria || {}, Pt = A.guestCriteria || {}, x = P.prices || {}, xt = ((u = (l = (c = x == null ? void 0 : x.Total) == null ? void 0 : c.Price) == null ? void 0 : l.Total) == null ? void 0 : u.AmountWithTaxesFees) || ((f = (h = (d = x == null ? void 0 : x.Total) == null ? void 0 : d.Price) == null ? void 0 : h.Total) == null ? void 0 : f.Amount) || ((v = (p = x == null ? void 0 : x.Total) == null ? void 0 : p.Price) == null ? void 0 : v.Amount) || 0, Ot = ((x == null ? void 0 : x.Daily) || []).map((K) => {
          var jt, $t, Rt, Dt, Lt, Nt, Ut, Ft, Mt, Bt;
          return {
            date: K.Date,
            amount: (($t = (jt = K.Price) == null ? void 0 : jt.Total) == null ? void 0 : $t.Amount) || ((Rt = K.Price) == null ? void 0 : Rt.Amount) || 0,
            amountWithTax: ((Lt = (Dt = K.Price) == null ? void 0 : Dt.Total) == null ? void 0 : Lt.AmountWithTaxesFees) || 0,
            tax: ((Ut = (Nt = K.Price) == null ? void 0 : Nt.Tax) == null ? void 0 : Ut.Amount) || 0,
            fees: ((Mt = (Ft = K.Price) == null ? void 0 : Ft.Fees) == null ? void 0 : Mt.Amount) || 0,
            currency: (Bt = K.Price) == null ? void 0 : Bt.CurrencyCode,
            inventory: K.AvailableInventory
          };
        }), Qs = {
          id: A.id,
          confirmationNumber: A.confirmationNumber,
          itineraryNumber: A.itineraryNumber,
          name: P.displayname || "Room",
          roomCode: ae.roomCode,
          rateCode: ae.rateCode,
          price: xt,
          actualTotal: r,
          dailyRate: P.amount || P.amountWithTaxesFees,
          currency: P.currencyCode,
          dailyPrices: Ot,
          taxes: ((C = (w = (g = x == null ? void 0 : x.Total) == null ? void 0 : g.Price) == null ? void 0 : w.Tax) == null ? void 0 : C.Amount) || 0,
          fees: ((T = (_ = (y = x == null ? void 0 : x.Total) == null ? void 0 : y.Price) == null ? void 0 : _.Fees) == null ? void 0 : T.Amount) || 0,
          startDate: (k = ae.startDate) == null ? void 0 : k.split("T")[0],
          endDate: (E = ae.endDate) == null ? void 0 : E.split("T")[0],
          nights: Ot.length || null,
          adults: Pt.numAdults || 1,
          children: Pt.numChildren || 0,
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
          image: P.coverImage || ((H = ($ = P.imageUrls) == null ? void 0 : $[0]) == null ? void 0 : H.Path) || null
        };
        t.push(Qs), s += xt;
      }
    } catch (F) {
      console.error("SynXis: Error extracting cart API data:", F);
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
    let i;
    s === -1 && r === -1 ? i = t : s > r ? i = t.replace(/,/g, "") : i = t.replace(/\./g, "").replace(",", ".");
    const o = parseFloat(i);
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
      const i = r.Cart || [];
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
      }), i = this.extractElinapmsTotal();
      return { products: r, total: i };
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
      const r = /^(\d{4})-(\d{2})-(\d{2})/, i = r.exec(s.dataset.startdate ?? ""), o = r.exec(s.dataset.enddate ?? "");
      if (!i || !o) return null;
      const a = i[0], c = o[0], l = Math.round(
        (Date.UTC(+o[1], +o[2] - 1, +o[3]) - Date.UTC(+i[1], +i[2] - 1, +i[3])) / 864e5
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
    const s = t.querySelector(".formattedCurrency"), r = s ? this.parseElinapmsNumber(s.textContent) : 0, i = t.querySelector(".plusFees"), o = i ? this.parseElinapmsNumber(i.dataset.att) : 0;
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
    const i = parseFloat(t);
    return isNaN(i) ? 0 : i;
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
      const i = document.querySelector(
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
      i || o || a || c || l ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(r, s)) : console.warn(
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
    let i = t.name;
    const o = this.inputDetector.inputMapping;
    (u = o == null ? void 0 : o.field_mappings) != null && u[i] ? i = o.field_mappings[i] : i === "emailAddress" ? i = "email" : i === "phoneNumber" ? i = "phone_number" : i === "firstName" ? i = "first_name" : i === "lastName" && (i = "last_name");
    const a = { ...r, [i]: s }, c = i === "email" || i.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), l = i === "phone_number" || i.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
    if (c || l || this.inputDetector.hasEmailOrPhoneNumber()) {
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
            const v = p.querySelector(
              ".css-1yh68ch-singleValue"
            );
            v && (v.textContent = l);
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
    }, i = () => {
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
      }), (a || l) && (o = !0), !o && e < t ? (e++, setTimeout(i, s)) : e >= t && !o && console.warn(
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
    var t, s, r, i, o, a, c, l, u, d;
    try {
      const h = this.getFromSessionStorage("autofield_email"), f = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), p = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (!h && !f && !p)
        return;
      let v = "*";
      if (e.src)
        try {
          v = new URL(e.src).origin;
        } catch {
        }
      const g = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((r = e.name) == null ? void 0 : r.toLowerCase().includes("dibs")), w = ((i = e.src) == null ? void 0 : i.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((c = e.src) == null ? void 0 : c.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((l = e.name) == null ? void 0 : l.toLowerCase().includes("nets")) || ((u = e.name) == null ? void 0 : u.toLowerCase().includes("easy"));
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
          e.contentWindow.postMessage(_, v);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${w ? "Nets Easy/Nexi" : g ? "Dibs" : "cross-origin"} iframe via postMessage (${C.length} formats):`,
        {
          iframeSrc: ((d = e.src) == null ? void 0 : d.substring(0, 100)) || "unknown",
          email: h ? "***" : null,
          phoneCountryCode: f,
          phoneNumber: p ? "***" : null,
          targetOrigin: v
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
        const i = new URL(e.src), o = i.hostname.includes("dibspayment.eu") || i.hostname.includes("dibs."), a = i.hostname.includes("netseasy") || i.hostname.includes("nets.eu") || i.hostname.includes("nexigroup.com") || i.hostname.includes("dibspayment.eu");
        if (!o && !a)
          return;
        const c = i.searchParams.toString().length > 0;
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
            const i = r;
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
      s !== e && (e = s, this.checkAndFillPaymentPageFields());
    }, 500);
    this._urlCheckInterval = t;
  }
};
m(V, "BASKET_FETCH_TIMEOUT_MS", 8e3), /**
 * Selectors that identify each autofield, whether rendered by BookVisit
 * itself or injected by us.
 */
m(V, "AUTOFIELD_SELECTORS", {
  firstName: '#customer-firstName, input[name="firstName"]',
  lastName: '#customer-lastName, input[name="lastName"]',
  email: '#customer-emailAddress, input[name="emailAddress"]',
  phoneNumber: '#customer-phoneNumber, input[name="phoneNumber"]'
}), /**
 * sessionStorage key for each autofield input name
 */
m(V, "AUTOFIELD_STORAGE_KEYS", {
  emailAddress: "autofield_email",
  phoneCountryCode: "autofield_phoneCountryCode",
  phoneNumber: "autofield_phoneNumber"
});
let _t = V;
class to {
  constructor(e) {
    m(this, "options");
    m(this, "supabaseService");
    m(this, "campaign");
    m(this, "formData", {});
    m(this, "inputListeners", []);
    m(this, "buttonListeners", []);
    m(this, "submitListener");
    m(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new Tt(
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
          const i = s.true_value || "on", o = this.isCheckboxChecked(r), a = this.getCheckboxValue(r);
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
      const i = (o) => {
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
          r.addEventListener("change", i);
        this.handleInputChange(t, r, s);
      } else
        r.addEventListener("blur", i), r.addEventListener("change", i);
      this.inputListeners.push({ element: r, fieldName: t, handler: i });
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
      const i = (o) => {
        o.preventDefault(), this.handleButtonToggle(t, s.default_value);
      };
      r.addEventListener("click", i), this.buttonListeners.push({ element: r, fieldName: t, handler: i });
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
      const i = s.true_value || "on", o = this.isCheckboxChecked(t), a = this.getCheckboxValue(t);
      o && a === i ? this.formData[e] = !0 : this.formData[e] = !1;
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
class so {
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
      $i();
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
const ne = class ne {
  constructor(e) {
    m(this, "supabaseService");
    m(this, "isInitialized", !1);
    this.supabaseService = new Tt(
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
        ne.URL_PARAM
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
        ne.STORAGE_KEY
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
          ne.STORAGE_KEY,
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
m(ne, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
m(ne, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let wt = ne;
class ro {
  constructor(e) {
    m(this, "options");
    m(this, "tools", /* @__PURE__ */ new Map());
    m(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s, r, i;
    if (this._isInitialized)
      return !0;
    try {
      Bi({
        cookieDomain: this.options.cookieDomain,
        requireConsent: this.options.requireConsent,
        shareInsightsAcrossSubdomains: this.options.shareInsightsAcrossSubdomains
      }), Xi({
        enabled: !!((e = this.options.features) != null && e.abandonedCart) && ((t = this.options.features) == null ? void 0 : t.stayCapture) !== !1
      });
      const o = new wt(this.options);
      if (await o.initialize(), this.tools.set("linkTracking", o), (s = this.options.features) != null && s.abandonedCart) {
        const a = new _t(this.options);
        await a.initialize(), this.tools.set("abandonedCart", a);
      }
      if ((r = this.options.features) != null && r.organizationPipeline) {
        const a = new to(
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
          const c = new so(
            this.options
          );
          await c.initialize(), this.tools.set("enhancedInsights", c);
        };
        Ge() && await a(), this.options.requireConsent && zs((c) => {
          if (c)
            a();
          else {
            const l = this.tools.get("enhancedInsights");
            l && (l.destroy(), l.clearData(), this.tools.delete("enhancedInsights"));
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
    Ce(e);
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
typeof window < "u" && (window.EkteIntelligensSDK = ro);
export {
  ro as EkteIntelligensSDK
};
