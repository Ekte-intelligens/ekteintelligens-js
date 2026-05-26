var ns = Object.defineProperty;
var os = (n, e, t) => e in n ? ns(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var m = (n, e, t) => os(n, typeof e != "symbol" ? e + "" : e, t);
class as {
  constructor(e) {
    m(this, "inputMapping");
    m(this, "content", {});
    m(this, "sessionId");
    m(this, "hasEmailOrPhone", !1);
    m(this, "onContentUpdate");
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
      t.addEventListener("blur", this.handleInputBlur.bind(this));
    });
  }
  stopListening() {
    this.getTargetInputs().forEach((t) => {
      t.removeEventListener("blur", this.handleInputBlur.bind(this));
    });
  }
  getTargetInputs() {
    const e = (t) => t.filter((s) => !this.isInputExcluded(s));
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
    if (this.isInputExcluded(t)) return;
    const s = this.getFieldName(t), r = t.value.trim();
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
}
class ls {
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
class cs {
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
        const l = r.lastIndexOf(","), u = r.lastIndexOf(".");
        l > u ? r.substring(l + 1).length === 2 ? (r = r.replace(/\./g, ""), r = r.replace(",", ".")) : r = r.replace(/,/g, "") : r = r.replace(/,/g, "");
      } else if (i && !o) {
        const l = r.match(/,/g);
        if ((l ? l.length : 0) > 1)
          r = r.replace(/,/g, "");
        else {
          const c = r.match(/,(\d+)$/);
          c && c[1].length === 3 ? r = r.replace(",", "") : r = r.replace(",", ".");
        }
      } else if (!i && o) {
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
const us = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => le).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class Ge extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class hs extends Ge {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class vt extends Ge {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class mt extends Ge {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var Ne;
(function(n) {
  n.Any = "any", n.ApNortheast1 = "ap-northeast-1", n.ApNortheast2 = "ap-northeast-2", n.ApSouth1 = "ap-south-1", n.ApSoutheast1 = "ap-southeast-1", n.ApSoutheast2 = "ap-southeast-2", n.CaCentral1 = "ca-central-1", n.EuCentral1 = "eu-central-1", n.EuWest1 = "eu-west-1", n.EuWest2 = "eu-west-2", n.EuWest3 = "eu-west-3", n.SaEast1 = "sa-east-1", n.UsEast1 = "us-east-1", n.UsWest1 = "us-west-1", n.UsWest2 = "us-west-2";
})(Ne || (Ne = {}));
var ds = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
class fs {
  constructor(e, { headers: t = {}, customFetch: s, region: r = Ne.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = us(s);
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
    return ds(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: i, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region);
        const u = new URL(`${this.url}/${e}`);
        l && l !== "any" && (a["x-region"] = l, u.searchParams.set("forceFunctionRegion", l));
        let c;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", c = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", c = o) : typeof FormData < "u" && o instanceof FormData ? c = o : (a["Content-Type"] = "application/json", c = JSON.stringify(o)));
        const h = yield this.fetch(u.toString(), {
          method: i || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: c
        }).catch((b) => {
          throw new hs(b);
        }), d = h.headers.get("x-relay-error");
        if (d && d === "true")
          throw new vt(h);
        if (!h.ok)
          throw new mt(h);
        let f = ((s = h.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield h.json() : f === "application/octet-stream" ? p = yield h.blob() : f === "text/event-stream" ? p = h : f === "multipart/form-data" ? p = yield h.formData() : p = yield h.text(), { data: p, error: null, response: h };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof mt || r instanceof vt ? r.context : void 0
        };
      }
    });
  }
}
var L = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function ps(n) {
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
var R = {}, Qe = {}, ke = {}, ge = {}, Ee = {}, Ce = {}, gs = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, ae = gs();
const vs = ae.fetch, Rt = ae.fetch.bind(ae), Lt = ae.Headers, ms = ae.Request, bs = ae.Response, le = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: Lt,
  Request: ms,
  Response: bs,
  default: Rt,
  fetch: vs
}, Symbol.toStringTag, { value: "Module" })), ys = /* @__PURE__ */ ps(le);
var Te = {};
Object.defineProperty(Te, "__esModule", { value: !0 });
let _s = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
Te.default = _s;
var Dt = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Ce, "__esModule", { value: !0 });
const ws = Dt(ys), Ss = Dt(Te);
let ks = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = ws.default : this.fetch = fetch;
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
      var o, a, l;
      let u = null, c = null, h = null, d = i.status, f = i.statusText;
      if (i.ok) {
        if (this.method !== "HEAD") {
          const y = await i.text();
          y === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? c = y : c = JSON.parse(y));
        }
        const b = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), g = (a = i.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        b && g && g.length > 1 && (h = parseInt(g[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(c) && (c.length > 1 ? (u = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${c.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, c = null, h = null, d = 406, f = "Not Acceptable") : c.length === 1 ? c = c[0] : c = null);
      } else {
        const b = await i.text();
        try {
          u = JSON.parse(b), Array.isArray(u) && i.status === 404 && (c = [], u = null, d = 200, f = "OK");
        } catch {
          i.status === 404 && b === "" ? (d = 204, f = "No Content") : u = {
            message: b
          };
        }
        if (u && this.isMaybeSingle && (!((l = u == null ? void 0 : u.details) === null || l === void 0) && l.includes("0 rows")) && (u = null, d = 200, f = "OK"), u && this.shouldThrowOnError)
          throw new Ss.default(u);
      }
      return {
        error: u,
        data: c,
        count: h,
        status: d,
        statusText: f
      };
    });
    return this.shouldThrowOnError || (r = r.catch((i) => {
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
Ce.default = ks;
var Es = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Ee, "__esModule", { value: !0 });
const Cs = Es(Ce);
let Ts = class extends Cs.default {
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
    const l = [
      e ? "analyze" : null,
      t ? "verbose" : null,
      s ? "settings" : null,
      r ? "buffers" : null,
      i ? "wal" : null
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
Ee.default = Ts;
var Is = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(ge, "__esModule", { value: !0 });
const xs = Is(Ee);
let Ps = class extends xs.default {
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
ge.default = Ps;
var As = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(ke, "__esModule", { value: !0 });
const ue = As(ge);
let Os = class {
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
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new ue.default({
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
      const o = e.reduce((a, l) => a.concat(Object.keys(l)), []);
      if (o.length > 0) {
        const a = [...new Set(o)].map((l) => `"${l}"`);
        this.url.searchParams.set("columns", a.join(","));
      }
    }
    return new ue.default({
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
      const l = e.reduce((u, c) => u.concat(Object.keys(c)), []);
      if (l.length > 0) {
        const u = [...new Set(l)].map((c) => `"${c}"`);
        this.url.searchParams.set("columns", u.join(","));
      }
    }
    return new ue.default({
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
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new ue.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new ue.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
ke.default = Os;
var Ie = {}, xe = {};
Object.defineProperty(xe, "__esModule", { value: !0 });
xe.version = void 0;
xe.version = "0.0.0-automated";
Object.defineProperty(Ie, "__esModule", { value: !0 });
Ie.DEFAULT_HEADERS = void 0;
const js = xe;
Ie.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${js.version}` };
var Ut = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(Qe, "__esModule", { value: !0 });
const $s = Ut(ke), Rs = Ut(ge), Ls = Ie;
let Ds = class Nt {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, Ls.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new $s.default(t, {
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
    return new Nt(this.url, {
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
    let l;
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([c, h]) => h !== void 0).map(([c, h]) => [c, Array.isArray(h) ? `{${h.join(",")}}` : `${h}`]).forEach(([c, h]) => {
      a.searchParams.append(c, h);
    })) : (o = "POST", l = t);
    const u = Object.assign({}, this.headers);
    return i && (u.Prefer = `count=${i}`), new Rs.default({
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
Qe.default = Ds;
var ce = L && L.__importDefault || function(n) {
  return n && n.__esModule ? n : { default: n };
};
Object.defineProperty(R, "__esModule", { value: !0 });
R.PostgrestError = R.PostgrestBuilder = R.PostgrestTransformBuilder = R.PostgrestFilterBuilder = R.PostgrestQueryBuilder = R.PostgrestClient = void 0;
const Ft = ce(Qe);
R.PostgrestClient = Ft.default;
const Bt = ce(ke);
R.PostgrestQueryBuilder = Bt.default;
const qt = ce(ge);
R.PostgrestFilterBuilder = qt.default;
const Mt = ce(Ee);
R.PostgrestTransformBuilder = Mt.default;
const zt = ce(Ce);
R.PostgrestBuilder = zt.default;
const Wt = ce(Te);
R.PostgrestError = Wt.default;
var Us = R.default = {
  PostgrestClient: Ft.default,
  PostgrestQueryBuilder: Bt.default,
  PostgrestFilterBuilder: qt.default,
  PostgrestTransformBuilder: Mt.default,
  PostgrestBuilder: zt.default,
  PostgrestError: Wt.default
};
const {
  PostgrestClient: Ns,
  PostgrestQueryBuilder: $i,
  PostgrestFilterBuilder: Ri,
  PostgrestTransformBuilder: Li,
  PostgrestBuilder: Di,
  PostgrestError: Ui
} = Us;
function Fs() {
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
const Bs = Fs(), qs = "2.11.15", Ms = `realtime-js/${qs}`, zs = "1.0.0", Ht = 1e4, Ws = 1e3;
var de;
(function(n) {
  n[n.connecting = 0] = "connecting", n[n.open = 1] = "open", n[n.closing = 2] = "closing", n[n.closed = 3] = "closed";
})(de || (de = {}));
var j;
(function(n) {
  n.closed = "closed", n.errored = "errored", n.joined = "joined", n.joining = "joining", n.leaving = "leaving";
})(j || (j = {}));
var U;
(function(n) {
  n.close = "phx_close", n.error = "phx_error", n.join = "phx_join", n.reply = "phx_reply", n.leave = "phx_leave", n.access_token = "access_token";
})(U || (U = {}));
var Fe;
(function(n) {
  n.websocket = "websocket";
})(Fe || (Fe = {}));
var G;
(function(n) {
  n.Connecting = "connecting", n.Open = "open", n.Closing = "closing", n.Closed = "closed";
})(G || (G = {}));
class Hs {
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
    const l = s.decode(e.slice(o, o + i));
    o = o + i;
    const u = JSON.parse(s.decode(e.slice(o, e.byteLength)));
    return { ref: null, topic: a, event: l, payload: u };
  }
}
class Vt {
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
(function(n) {
  n.abstime = "abstime", n.bool = "bool", n.date = "date", n.daterange = "daterange", n.float4 = "float4", n.float8 = "float8", n.int2 = "int2", n.int4 = "int4", n.int4range = "int4range", n.int8 = "int8", n.int8range = "int8range", n.json = "json", n.jsonb = "jsonb", n.money = "money", n.numeric = "numeric", n.oid = "oid", n.reltime = "reltime", n.text = "text", n.time = "time", n.timestamp = "timestamp", n.timestamptz = "timestamptz", n.timetz = "timetz", n.tsrange = "tsrange", n.tstzrange = "tstzrange";
})(E || (E = {}));
const bt = (n, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((i, o) => (i[o] = Vs(o, n, e, r), i), {});
}, Vs = (n, e, t, s) => {
  const r = e.find((a) => a.name === n), i = r == null ? void 0 : r.type, o = t[n];
  return i && !s.includes(i) ? Kt(i, o) : Be(o);
}, Kt = (n, e) => {
  if (n.charAt(0) === "_") {
    const t = n.slice(1, n.length);
    return Qs(e, t);
  }
  switch (n) {
    case E.bool:
      return Ks(e);
    case E.float4:
    case E.float8:
    case E.int2:
    case E.int4:
    case E.int8:
    case E.numeric:
    case E.oid:
      return Js(e);
    case E.json:
    case E.jsonb:
      return Gs(e);
    case E.timestamp:
      return Xs(e);
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
      return Be(e);
    default:
      return Be(e);
  }
}, Be = (n) => n, Ks = (n) => {
  switch (n) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return n;
  }
}, Js = (n) => {
  if (typeof n == "string") {
    const e = parseFloat(n);
    if (!Number.isNaN(e))
      return e;
  }
  return n;
}, Gs = (n) => {
  if (typeof n == "string")
    try {
      return JSON.parse(n);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), n;
    }
  return n;
}, Qs = (n, e) => {
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
    return i.map((a) => Kt(e, a));
  }
  return n;
}, Xs = (n) => typeof n == "string" ? n.replace(" ", "T") : n, Jt = (n) => {
  let e = n;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class Oe {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = Ht) {
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
var yt;
(function(n) {
  n.SYNC = "sync", n.JOIN = "join", n.LEAVE = "leave";
})(yt || (yt = {}));
class fe {
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
      this.joinRef = this.channel._joinRef(), this.state = fe.syncState(this.state, r, i, o), this.pendingDiffs.forEach((l) => {
        this.state = fe.syncDiff(this.state, l, i, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: i, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = fe.syncDiff(this.state, r, i, o), a());
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
    const i = this.cloneDeep(e), o = this.transformState(t), a = {}, l = {};
    return this.map(i, (u, c) => {
      o[u] || (l[u] = c);
    }), this.map(o, (u, c) => {
      const h = i[u];
      if (h) {
        const d = c.map((g) => g.presence_ref), f = h.map((g) => g.presence_ref), p = c.filter((g) => f.indexOf(g.presence_ref) < 0), b = h.filter((g) => d.indexOf(g.presence_ref) < 0);
        p.length > 0 && (a[u] = p), b.length > 0 && (l[u] = b);
      } else
        a[u] = c;
    }), this.syncDiff(i, { joins: a, leaves: l }, s, r);
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
    }), this.map(i, (a, l) => {
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
var _t;
(function(n) {
  n.ALL = "*", n.INSERT = "INSERT", n.UPDATE = "UPDATE", n.DELETE = "DELETE";
})(_t || (_t = {}));
var wt;
(function(n) {
  n.BROADCAST = "broadcast", n.PRESENCE = "presence", n.POSTGRES_CHANGES = "postgres_changes", n.SYSTEM = "system";
})(wt || (wt = {}));
var F;
(function(n) {
  n.SUBSCRIBED = "SUBSCRIBED", n.TIMED_OUT = "TIMED_OUT", n.CLOSED = "CLOSED", n.CHANNEL_ERROR = "CHANNEL_ERROR";
})(F || (F = {}));
class Xe {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = j.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Oe(this, U.join, this.params, this.timeout), this.rejoinTimer = new Vt(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = j.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = j.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = j.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(U.reply, {}, (r, i) => {
      this._trigger(this._replyEventName(i), r);
    }), this.presence = new fe(this), this.broadcastEndpointURL = Jt(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == j.closed) {
      const { config: { broadcast: i, presence: o, private: a } } = this.params;
      this._onError((c) => e == null ? void 0 : e(F.CHANNEL_ERROR, c)), this._onClose(() => e == null ? void 0 : e(F.CLOSED));
      const l = {}, u = {
        broadcast: i,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((c) => c.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: u }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: c }) => {
        var h;
        if (this.socket.setAuth(), c === void 0) {
          e == null || e(F.SUBSCRIBED);
          return;
        } else {
          const d = this.bindings.postgres_changes, f = (h = d == null ? void 0 : d.length) !== null && h !== void 0 ? h : 0, p = [];
          for (let b = 0; b < f; b++) {
            const g = d[b], { filter: { event: y, schema: w, table: v, filter: k } } = g, x = c && c[b];
            if (x && x.event === y && x.schema === w && x.table === v && x.filter === k)
              p.push(Object.assign(Object.assign({}, g), { id: x.id }));
            else {
              this.unsubscribe(), this.state = j.errored, e == null || e(F.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(F.SUBSCRIBED);
          return;
        }
      }).receive("error", (c) => {
        this.state = j.errored, e == null || e(F.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(c).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(F.TIMED_OUT);
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
        const u = await this._fetchWithTimeout(this.broadcastEndpointURL, l, (s = t.timeout) !== null && s !== void 0 ? s : this.timeout);
        return await ((r = u.body) === null || r === void 0 ? void 0 : r.cancel()), u.ok ? "ok" : "error";
      } catch (u) {
        return u.name === "AbortError" ? "timed out" : "error";
      }
    } else
      return new Promise((i) => {
        var o, a, l;
        const u = this._push(e.type, e, t.timeout || this.timeout);
        e.type === "broadcast" && !(!((l = (a = (o = this.params) === null || o === void 0 ? void 0 : o.config) === null || a === void 0 ? void 0 : a.broadcast) === null || l === void 0) && l.ack) && i("ok"), u.receive("ok", () => i("ok")), u.receive("error", () => i("error")), u.receive("timeout", () => i("timed out"));
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
      s = new Oe(this, U.leave, {}, e), s.receive("ok", () => {
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
    let r = new Oe(this, e, t, s);
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
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: u, join: c } = U;
    if (s && [a, l, u, c].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let d = this._onMessage(o, t, s);
    if (t && !d)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var p, b, g;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((g = (b = f.filter) === null || b === void 0 ? void 0 : b.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(d, s)) : (i = this.bindings[o]) === null || i === void 0 || i.filter((f) => {
      var p, b, g, y, w, v;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const k = f.id, x = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return k && ((b = t.ids) === null || b === void 0 ? void 0 : b.includes(k)) && (x === "*" || (x == null ? void 0 : x.toLocaleLowerCase()) === ((g = t.data) === null || g === void 0 ? void 0 : g.type.toLocaleLowerCase()));
        } else {
          const k = (w = (y = f == null ? void 0 : f.filter) === null || y === void 0 ? void 0 : y.event) === null || w === void 0 ? void 0 : w.toLocaleLowerCase();
          return k === "*" || k === ((v = t == null ? void 0 : t.event) === null || v === void 0 ? void 0 : v.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof d == "object" && "ids" in d) {
        const p = d.data, { schema: b, table: g, commit_timestamp: y, type: w, errors: v } = p;
        d = Object.assign(Object.assign({}, {
          schema: b,
          table: g,
          commit_timestamp: y,
          eventType: w,
          new: {},
          old: {},
          errors: v
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
      return !(((i = r.type) === null || i === void 0 ? void 0 : i.toLocaleLowerCase()) === s && Xe.isEqual(r.filter, t));
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
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = bt(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = bt(e.columns, e.old_record)), t;
  }
}
const St = () => {
}, Ys = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Zs {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = Ht, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = St, this.ref = 0, this.logger = St, this.conn = null, this.sendBuffer = [], this.serializer = new Hs(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (i) => {
      let o;
      return i ? o = i : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => le).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${Fe.websocket}`, this.httpEndpoint = Jt(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (i) => [1e3, 2e3, 5e3, 1e4][i - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (i, o) => o(JSON.stringify(i)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new Vt(async () => {
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
      if (this.transport || (this.transport = Bs), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: zs }));
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
      case de.connecting:
        return G.Connecting;
      case de.open:
        return G.Open;
      case de.closing:
        return G.Closing;
      default:
        return G.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === G.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((i) => i.topic === s);
    if (r)
      return r;
    {
      const i = new Xe(`realtime:${e}`, t, this);
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
        var l;
        (l = this.conn) === null || l === void 0 || l.send(a);
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
        version: Ms
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(Ws, "hearbeat timeout");
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
      const s = new Blob([Ys], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class Ye extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function A(n) {
  return typeof n == "object" && n !== null && "__isStorageError" in n;
}
class er extends Ye {
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
class qe extends Ye {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var tr = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
const Gt = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => le).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, sr = () => tr(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => le)).Response : Response;
}), Me = (n) => {
  if (Array.isArray(n))
    return n.map((t) => Me(t));
  if (typeof n == "function" || n !== Object(n))
    return n;
  const e = {};
  return Object.entries(n).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (i) => i.toUpperCase().replace(/[-_]/g, ""));
    e[r] = Me(s);
  }), e;
}, rr = (n) => {
  if (typeof n != "object" || n === null)
    return !1;
  const e = Object.getPrototypeOf(n);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in n) && !(Symbol.iterator in n);
};
var X = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
const je = (n) => n.msg || n.message || n.error_description || n.error || JSON.stringify(n), ir = (n, e, t) => X(void 0, void 0, void 0, function* () {
  const s = yield sr();
  n instanceof s && !(t != null && t.noResolveJson) ? n.json().then((r) => {
    const i = n.status || 500, o = (r == null ? void 0 : r.statusCode) || i + "";
    e(new er(je(r), i, o));
  }).catch((r) => {
    e(new qe(je(r), r));
  }) : e(new qe(je(n), n));
}), nr = (n, e, t, s) => {
  const r = { method: n, headers: (e == null ? void 0 : e.headers) || {} };
  return n === "GET" || !s ? r : (rr(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function ve(n, e, t, s, r, i) {
  return X(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      n(t, nr(e, s, r, i)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => ir(l, a, s));
    });
  });
}
function we(n, e, t, s) {
  return X(this, void 0, void 0, function* () {
    return ve(n, "GET", e, t, s);
  });
}
function B(n, e, t, s, r) {
  return X(this, void 0, void 0, function* () {
    return ve(n, "POST", e, s, r, t);
  });
}
function ze(n, e, t, s, r) {
  return X(this, void 0, void 0, function* () {
    return ve(n, "PUT", e, s, r, t);
  });
}
function or(n, e, t, s) {
  return X(this, void 0, void 0, function* () {
    return ve(n, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function Qt(n, e, t, s, r) {
  return X(this, void 0, void 0, function* () {
    return ve(n, "DELETE", e, s, r, t);
  });
}
var $ = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
const ar = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, kt = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class lr {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = Gt(r);
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
        let i;
        const o = Object.assign(Object.assign({}, kt), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (i = new FormData(), i.append("cacheControl", o.cacheControl), l && i.append("metadata", this.encodeMetadata(l)), i.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (i = s, i.append("cacheControl", o.cacheControl), l && i.append("metadata", this.encodeMetadata(l))) : (i = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const u = this._removeEmptyFolders(t), c = this._getFinalPath(u), h = yield (e == "PUT" ? ze : B)(this.fetch, `${this.url}/object/${c}`, i, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: u, id: h.Id, fullPath: h.Key },
          error: null
        };
      } catch (i) {
        if (A(i))
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
      const i = this._removeEmptyFolders(e), o = this._getFinalPath(i), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const u = Object.assign({ upsert: kt.upsert }, r), c = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(u.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", u.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", u.cacheControl)) : (l = s, c["cache-control"] = `max-age=${u.cacheControl}`, c["content-type"] = u.contentType);
        const h = yield ze(this.fetch, a.toString(), l, { headers: c });
        return {
          data: { path: i, fullPath: h.Key },
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
        const i = yield B(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + i.url), a = o.searchParams.get("token");
        if (!a)
          throw new Ye("No token returned by API");
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
        return { data: yield B(this.fetch, `${this.url}/object/move`, {
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
        return { data: { path: (yield B(this.fetch, `${this.url}/object/copy`, {
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
        let r = this._getFinalPath(e), i = yield B(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return i = { signedUrl: encodeURI(`${this.url}${i.signedURL}${o}`) }, { data: i, error: null };
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
        const r = yield B(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), i = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: r.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${i}`) : null })),
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
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", i = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = i ? `?${i}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield we(this.fetch, `${this.url}/${r}/${a}${o}`, {
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
        const s = yield we(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: Me(s), error: null };
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
        return yield or(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (A(s) && s instanceof qe) {
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
        return { data: yield Qt(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
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
        const r = Object.assign(Object.assign(Object.assign({}, ar), t), { prefix: e || "" });
        return { data: yield B(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
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
const cr = "2.10.4", ur = { "X-Client-Info": `storage-js/${cr}` };
var ee = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
class hr {
  constructor(e, t = {}, s, r) {
    const i = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(i.hostname) && !i.hostname.includes("storage.supabase.") && (i.hostname = i.hostname.replace("supabase.", "storage.supabase.")), this.url = i.href, this.headers = Object.assign(Object.assign({}, ur), t), this.fetch = Gt(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield we(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
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
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield we(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
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
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield B(this.fetch, `${this.url}/bucket`, {
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
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield ze(this.fetch, `${this.url}/bucket/${e}`, {
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
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield B(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
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
    return ee(this, void 0, void 0, function* () {
      try {
        return { data: yield Qt(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (A(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class dr extends hr {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new lr(this.url, this.headers, e, this.fetch);
  }
}
const fr = "2.53.0";
let he = "";
typeof Deno < "u" ? he = "deno" : typeof document < "u" ? he = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? he = "react-native" : he = "node";
const pr = { "X-Client-Info": `supabase-js-${he}/${fr}` }, gr = {
  headers: pr
}, vr = {
  schema: "public"
}, mr = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, br = {};
var yr = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
const _r = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = Rt : e = fetch, (...t) => e(...t);
}, wr = () => typeof Headers > "u" ? Lt : Headers, Sr = (n, e, t) => {
  const s = _r(t), r = wr();
  return (i, o) => yr(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : n;
    let u = new r(o == null ? void 0 : o.headers);
    return u.has("apikey") || u.set("apikey", n), u.has("Authorization") || u.set("Authorization", `Bearer ${l}`), s(i, Object.assign(Object.assign({}, o), { headers: u }));
  });
};
var kr = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
function Er(n) {
  return n.endsWith("/") ? n : n + "/";
}
function Cr(n, e) {
  var t, s;
  const { db: r, auth: i, realtime: o, global: a } = n, { db: l, auth: u, realtime: c, global: h } = e, d = {
    db: Object.assign(Object.assign({}, l), r),
    auth: Object.assign(Object.assign({}, u), i),
    realtime: Object.assign(Object.assign({}, c), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, h), a), { headers: Object.assign(Object.assign({}, (t = h == null ? void 0 : h.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => kr(this, void 0, void 0, function* () {
      return "";
    })
  };
  return n.accessToken ? d.accessToken = n.accessToken : delete d.accessToken, d;
}
const Xt = "2.71.1", ne = 30 * 1e3, We = 3, $e = We * ne, Tr = "http://localhost:9999", Ir = "supabase.auth.token", xr = { "X-Client-Info": `gotrue-js/${Xt}` }, He = "X-Supabase-Api-Version", Yt = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, Pr = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, Ar = 10 * 60 * 1e3;
class Ze extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function _(n) {
  return typeof n == "object" && n !== null && "__isAuthError" in n;
}
class Or extends Ze {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function jr(n) {
  return _(n) && n.name === "AuthApiError";
}
class Zt extends Ze {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class H extends Ze {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class z extends H {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function $r(n) {
  return _(n) && n.name === "AuthSessionMissingError";
}
class be extends H {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class ye extends H {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class _e extends H {
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
function Rr(n) {
  return _(n) && n.name === "AuthImplicitGrantRedirectError";
}
class Et extends H {
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
class Ve extends H {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function Re(n) {
  return _(n) && n.name === "AuthRetryableFetchError";
}
class Ct extends H {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class Ke extends H {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const Se = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), Tt = ` 	
\r=`.split(""), Lr = (() => {
  const n = new Array(128);
  for (let e = 0; e < n.length; e += 1)
    n[e] = -1;
  for (let e = 0; e < Tt.length; e += 1)
    n[Tt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < Se.length; e += 1)
    n[Se[e].charCodeAt(0)] = e;
  return n;
})();
function It(n, e, t) {
  if (n !== null)
    for (e.queue = e.queue << 8 | n, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Se[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(Se[s]), e.queuedBits -= 6;
    }
}
function es(n, e, t) {
  const s = Lr[n];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(n)}"`);
  }
}
function xt(n) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, i = (o) => {
    Nr(o, s, t);
  };
  for (let o = 0; o < n.length; o += 1)
    es(n.charCodeAt(o), r, i);
  return e.join("");
}
function Dr(n, e) {
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
function Ur(n, e) {
  for (let t = 0; t < n.length; t += 1) {
    let s = n.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (n.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    Dr(s, e);
  }
}
function Nr(n, e, t) {
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
function Fr(n) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < n.length; r += 1)
    es(n.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function Br(n) {
  const e = [];
  return Ur(n, (t) => e.push(t)), new Uint8Array(e);
}
function qr(n) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return n.forEach((r) => It(r, t, s)), It(null, t, s), e.join("");
}
function Mr(n) {
  return Math.round(Date.now() / 1e3) + n;
}
function zr() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(n) {
    const e = Math.random() * 16 | 0;
    return (n == "x" ? e : e & 3 | 8).toString(16);
  });
}
const D = () => typeof window < "u" && typeof document < "u", V = {
  tested: !1,
  writable: !1
}, ts = () => {
  if (!D())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (V.tested)
    return V.writable;
  const n = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(n, n), globalThis.localStorage.removeItem(n), V.tested = !0, V.writable = !0;
  } catch {
    V.tested = !0, V.writable = !1;
  }
  return V.writable;
};
function Wr(n) {
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
const ss = (n) => {
  let e;
  return n ? e = n : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => le).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Hr = (n) => typeof n == "object" && n !== null && "status" in n && "ok" in n && "json" in n && typeof n.json == "function", oe = async (n, e, t) => {
  await n.setItem(e, JSON.stringify(t));
}, K = async (n, e) => {
  const t = await n.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, M = async (n, e) => {
  await n.removeItem(e);
};
class Pe {
  constructor() {
    this.promise = new Pe.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
Pe.promiseConstructor = Promise;
function Le(n) {
  const e = n.split(".");
  if (e.length !== 3)
    throw new Ke("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!Pr.test(e[s]))
      throw new Ke("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(xt(e[0])),
    payload: JSON.parse(xt(e[1])),
    signature: Fr(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function Vr(n) {
  return await new Promise((e) => {
    setTimeout(() => e(null), n);
  });
}
function Kr(n, e) {
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
function Jr(n) {
  return ("0" + n.toString(16)).substr(-2);
}
function Gr() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let i = 0; i < 56; i++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, Jr).join("");
}
async function Qr(n) {
  const t = new TextEncoder().encode(n), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((i) => String.fromCharCode(i)).join("");
}
async function Xr(n) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), n;
  const t = await Qr(n);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function te(n, e, t = !1) {
  const s = Gr();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await oe(n, `${e}-code-verifier`, r);
  const i = await Xr(s);
  return [i, s === i ? "plain" : "s256"];
}
const Yr = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function Zr(n) {
  const e = n.headers.get(He);
  if (!e || !e.match(Yr))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function ei(n) {
  if (!n)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (n <= e)
    throw new Error("JWT has expired");
}
function ti(n) {
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
const si = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function se(n) {
  if (!si.test(n))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function De() {
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
function Pt(n) {
  return JSON.parse(JSON.stringify(n));
}
var ri = function(n, e) {
  var t = {};
  for (var s in n) Object.prototype.hasOwnProperty.call(n, s) && e.indexOf(s) < 0 && (t[s] = n[s]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(n); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(n, s[r]) && (t[s[r]] = n[s[r]]);
  return t;
};
const J = (n) => n.msg || n.message || n.error_description || n.error || JSON.stringify(n), ii = [502, 503, 504];
async function At(n) {
  var e;
  if (!Hr(n))
    throw new Ve(J(n), 0);
  if (ii.includes(n.status))
    throw new Ve(J(n), n.status);
  let t;
  try {
    t = await n.json();
  } catch (i) {
    throw new Zt(J(i), i);
  }
  let s;
  const r = Zr(n);
  if (r && r.getTime() >= Yt["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new Ct(J(t), n.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new z();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((i, o) => i && typeof o == "string", !0))
    throw new Ct(J(t), n.status, t.weak_password.reasons);
  throw new Or(J(t), n.status || 500, s);
}
const ni = (n, e, t, s) => {
  const r = { method: n, headers: (e == null ? void 0 : e.headers) || {} };
  return n === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function S(n, e, t, s) {
  var r;
  const i = Object.assign({}, s == null ? void 0 : s.headers);
  i[He] || (i[He] = Yt["2024-01-01"].name), s != null && s.jwt && (i.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await oi(n, e, t + a, {
    headers: i,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function oi(n, e, t, s, r, i) {
  const o = ni(e, s, r, i);
  let a;
  try {
    a = await n(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new Ve(J(l), 0);
  }
  if (a.ok || await At(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await At(l);
  }
}
function N(n) {
  var e;
  let t = null;
  ui(n) && (t = Object.assign({}, n), n.expires_at || (t.expires_at = Mr(n.expires_in)));
  const s = (e = n.user) !== null && e !== void 0 ? e : n;
  return { data: { session: t, user: s }, error: null };
}
function Ot(n) {
  const e = N(n);
  return !e.error && n.weak_password && typeof n.weak_password == "object" && Array.isArray(n.weak_password.reasons) && n.weak_password.reasons.length && n.weak_password.message && typeof n.weak_password.message == "string" && n.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = n.weak_password), e;
}
function W(n) {
  var e;
  return { data: { user: (e = n.user) !== null && e !== void 0 ? e : n }, error: null };
}
function ai(n) {
  return { data: n, error: null };
}
function li(n) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: i } = n, o = ri(n, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
    action_link: e,
    email_otp: t,
    hashed_token: s,
    redirect_to: r,
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
function ci(n) {
  return n;
}
function ui(n) {
  return n.access_token && n.refresh_token && n.expires_in;
}
const Ue = ["global", "local", "others"];
var hi = function(n, e) {
  var t = {};
  for (var s in n) Object.prototype.hasOwnProperty.call(n, s) && e.indexOf(s) < 0 && (t[s] = n[s]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(n); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(n, s[r]) && (t[s[r]] = n[s[r]]);
  return t;
};
class di {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = ss(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = Ue[0]) {
    if (Ue.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Ue.join(", ")}`);
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
        xform: W
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
      const { options: t } = e, s = hi(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await S(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: li,
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
        xform: W
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
    var t, s, r, i, o, a, l;
    try {
      const u = { nextPage: null, lastPage: 0, total: 0 }, c = await S(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (i = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && i !== void 0 ? i : ""
        },
        xform: ci
      });
      if (c.error)
        throw c.error;
      const h = await c.json(), d = (o = c.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = c.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((p) => {
        const b = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), g = JSON.parse(p.split(";")[1].split("=")[1]);
        u[`${g}Page`] = b;
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
    se(e);
    try {
      return await S(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: W
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
    se(e);
    try {
      return await S(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: W
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
    se(e);
    try {
      return await S(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: W
      });
    } catch (s) {
      if (_(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    se(e.userId);
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
    se(e.userId), se(e.id);
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
function jt(n = {}) {
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
function fi() {
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
const re = {
  /**
   * @experimental
   */
  debug: !!(globalThis && ts() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class rs extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class pi extends rs {
}
async function gi(n, e, t) {
  re.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", n, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), re.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", n);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(n, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      re.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", n, r.name);
      try {
        return await t();
      } finally {
        re.debug && console.log("@supabase/gotrue-js: navigatorLock: released", n, r.name);
      }
    } else {
      if (e === 0)
        throw re.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", n), new pi(`Acquiring an exclusive Navigator LockManager lock "${n}" immediately failed`);
      if (re.debug)
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
fi();
const vi = {
  url: Tr,
  storageKey: Ir,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: xr,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function $t(n, e, t) {
  return await t();
}
const ie = {};
class pe {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = pe.nextInstanceID, pe.nextInstanceID += 1, this.instanceID > 0 && D() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, vi), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new di({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = ss(r.fetch), this.lock = r.lock || $t, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : D() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = gi : this.lock = $t, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : ts() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = jt(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = jt(this.memoryStorage)), D() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
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
    return (t = (e = ie[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    ie[this.storageKey] = Object.assign(Object.assign({}, ie[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = ie[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    ie[this.storageKey] = Object.assign(Object.assign({}, ie[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${Xt}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), D() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: i } = await this._getSessionFromURL(t, s);
        if (i) {
          if (this._debug("#_initialize()", "error detecting session from URL", i), Rr(i)) {
            const l = (e = i.details) === null || e === void 0 ? void 0 : e.code;
            if (l === "identity_already_exists" || l === "identity_not_found" || l === "single_identity_not_deletable")
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
      return _(t) ? { error: t } : {
        error: new Zt("Unexpected error during initialization", t)
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
        xform: N
      }), { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, u = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: u, session: l }, error: null };
    } catch (i) {
      if (_(i))
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
        const { email: c, password: h, options: d } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await te(this.storage, this.storageKey)), i = await S(this.fetch, "POST", `${this.url}/signup`, {
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
        i = await S(this.fetch, "POST", `${this.url}/signup`, {
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
        throw new ye("You must provide either an email or phone number and a password");
      const { data: o, error: a } = i;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, u = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: u, session: l }, error: null };
    } catch (i) {
      if (_(i))
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
          xform: Ot
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
          xform: Ot
        });
      } else
        throw new ye("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new be() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
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
    var t, s, r, i, o, a, l, u, c, h, d, f;
    let p, b;
    if ("message" in e)
      p = e.message, b = e.signature;
    else {
      const { chain: g, wallet: y, statement: w, options: v } = e;
      let k;
      if (D())
        if (typeof y == "object")
          k = y;
        else {
          const C = window;
          if ("solana" in C && typeof C.solana == "object" && ("signIn" in C.solana && typeof C.solana.signIn == "function" || "signMessage" in C.solana && typeof C.solana.signMessage == "function"))
            k = C.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof y != "object" || !(v != null && v.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        k = y;
      }
      const x = new URL((t = v == null ? void 0 : v.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in k && k.signIn) {
        const C = await k.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, v == null ? void 0 : v.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: x.host,
          uri: x.href
        }), w ? { statement: w } : null));
        let O;
        if (Array.isArray(C) && C[0] && typeof C[0] == "object")
          O = C[0];
        else if (C && typeof C == "object" && "signedMessage" in C && "signature" in C)
          O = C;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in O && "signature" in O && (typeof O.signedMessage == "string" || O.signedMessage instanceof Uint8Array) && O.signature instanceof Uint8Array)
          p = typeof O.signedMessage == "string" ? O.signedMessage : new TextDecoder().decode(O.signedMessage), b = O.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in k) || typeof k.signMessage != "function" || !("publicKey" in k) || typeof k != "object" || !k.publicKey || !("toBase58" in k.publicKey) || typeof k.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${x.host} wants you to sign in with your Solana account:`,
          k.publicKey.toBase58(),
          ...w ? ["", w, ""] : [""],
          "Version: 1",
          `URI: ${x.href}`,
          `Issued At: ${(r = (s = v == null ? void 0 : v.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((i = v == null ? void 0 : v.signInWithSolana) === null || i === void 0) && i.notBefore ? [`Not Before: ${v.signInWithSolana.notBefore}`] : [],
          ...!((o = v == null ? void 0 : v.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${v.signInWithSolana.expirationTime}`] : [],
          ...!((a = v == null ? void 0 : v.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${v.signInWithSolana.chainId}`] : [],
          ...!((l = v == null ? void 0 : v.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${v.signInWithSolana.nonce}`] : [],
          ...!((u = v == null ? void 0 : v.signInWithSolana) === null || u === void 0) && u.requestId ? [`Request ID: ${v.signInWithSolana.requestId}`] : [],
          ...!((h = (c = v == null ? void 0 : v.signInWithSolana) === null || c === void 0 ? void 0 : c.resources) === null || h === void 0) && h.length ? [
            "Resources",
            ...v.signInWithSolana.resources.map((O) => `- ${O}`)
          ] : []
        ].join(`
`);
        const C = await k.signMessage(new TextEncoder().encode(p), "utf8");
        if (!C || !(C instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        b = C;
      }
    }
    try {
      const { data: g, error: y } = await S(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: qr(b) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: N
      });
      if (y)
        throw y;
      return !g || !g.session || !g.user ? {
        data: { user: null, session: null },
        error: new be()
      } : (g.session && (await this._saveSession(g.session), await this._notifyAllSubscribers("SIGNED_IN", g.session)), { data: Object.assign({}, g), error: y });
    } catch (g) {
      if (_(g))
        return { data: { user: null, session: null }, error: g };
      throw g;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await K(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: i, error: o } = await S(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: N
      });
      if (await M(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !i || !i.session || !i.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new be()
      } : (i.session && (await this._saveSession(i.session), await this._notifyAllSubscribers("SIGNED_IN", i.session)), { data: Object.assign(Object.assign({}, i), { redirectType: r ?? null }), error: o });
    } catch (i) {
      if (_(i))
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
        xform: N
      }), { data: l, error: u } = a;
      return u ? { data: { user: null, session: null }, error: u } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new be()
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
    var t, s, r, i, o;
    try {
      if ("email" in e) {
        const { email: a, options: l } = e;
        let u = null, c = null;
        this.flowType === "pkce" && ([u, c] = await te(this.storage, this.storageKey));
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
            create_user: (i = l == null ? void 0 : l.shouldCreateUser) !== null && i !== void 0 ? i : !0,
            gotrue_meta_security: { captcha_token: l == null ? void 0 : l.captchaToken },
            channel: (o = l == null ? void 0 : l.channel) !== null && o !== void 0 ? o : "sms"
          }
        });
        return { data: { user: null, session: null, messageId: u == null ? void 0 : u.message_id }, error: c };
      }
      throw new ye("You must provide either an email or phone number.");
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
      let r, i;
      "options" in e && (r = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo, i = (s = e.options) === null || s === void 0 ? void 0 : s.captchaToken);
      const { data: o, error: a } = await S(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: i } }),
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
      let i = null, o = null;
      return this.flowType === "pkce" && ([i, o] = await te(this.storage, this.storageKey)), await S(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: i, code_challenge_method: o }),
        headers: this.headers,
        xform: ai
      });
    } catch (i) {
      if (_(i))
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
          throw new z();
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
      throw new ye("You must provide either an email or phone number and a type");
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
      const t = await K(this.storage, this.storageKey);
      if (this._debug("#getSession()", "session from storage", t), t !== null && (this._isValidSession(t) ? e = t : (this._debug("#getSession()", "session from storage is not valid"), await this._removeSession())), !e)
        return { data: { session: null }, error: null };
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < $e : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await K(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = De();
        }
        if (this.storage.isServer && e.user) {
          let o = this.suppressGetSessionWarning;
          e = new Proxy(e, {
            get: (l, u, c) => (!o && u === "user" && (console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."), o = !0, this.suppressGetSessionWarning = !0), Reflect.get(l, u, c))
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
        xform: W
      }) : await this._useSession(async (t) => {
        var s, r, i;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new z() } : await S(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (i = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && i !== void 0 ? i : void 0,
          xform: W
        });
      });
    } catch (t) {
      if (_(t))
        return $r(t) && (await this._removeSession(), await M(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
          throw new z();
        const o = r.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await te(this.storage, this.storageKey));
        const { data: u, error: c } = await S(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: W
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
        throw new z();
      const t = Date.now() / 1e3;
      let s = t, r = !0, i = null;
      const { payload: o } = Le(e.access_token);
      if (o.exp && (s = o.exp, r = s <= t), r) {
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
          throw new z();
        const { session: r, error: i } = await this._callRefreshToken(e.refresh_token);
        return i ? { data: { user: null, session: null }, error: i } : r ? { data: { user: r.user, session: r }, error: null } : { data: { user: null, session: null }, error: null };
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
        throw new _e("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new _e(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Et("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new _e("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Et("No code detected.");
        const { data: w, error: v } = await this._exchangeCodeForSession(e.code);
        if (v)
          throw v;
        const k = new URL(window.location.href);
        return k.searchParams.delete("code"), window.history.replaceState(window.history.state, "", k.toString()), { data: { session: w.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: i, refresh_token: o, expires_in: a, expires_at: l, token_type: u } = e;
      if (!i || !a || !o || !u)
        throw new _e("No session defined in URL");
      const c = Math.round(Date.now() / 1e3), h = parseInt(a);
      let d = c + h;
      l && (d = parseInt(l));
      const f = d - c;
      f * 1e3 <= ne && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${h}s`);
      const p = d - h;
      c - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, d, c) : c - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, d, c);
      const { data: b, error: g } = await this._getUser(i);
      if (g)
        throw g;
      const y = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: i,
        expires_in: h,
        expires_at: d,
        refresh_token: o,
        token_type: u,
        user: b.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: y, redirectType: e.type }, error: null };
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
    const t = await K(this.storage, `${this.storageKey}-code-verifier`);
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
        if (a && !(jr(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await M(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = zr(), s = {
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
    this.flowType === "pkce" && ([s, r] = await te(
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
      if (_(i))
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
      const { data: s, error: r } = await this._useSession(async (i) => {
        var o, a, l, u, c;
        const { data: h, error: d } = i;
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
        const { data: i, error: o } = t;
        if (o)
          throw o;
        return await S(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (r = (s = i.session) === null || s === void 0 ? void 0 : s.access_token) !== null && r !== void 0 ? r : void 0
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
      return await Kr(async (r) => (r > 0 && await Vr(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await S(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: N
      })), (r, i) => {
        const o = 200 * Math.pow(2, r);
        return i && Re(i) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < ne;
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
      const r = await K(this.storage, this.storageKey);
      if (r && this.userStorage) {
        let o = await K(this.userStorage, this.storageKey + "-user");
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await oe(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : De();
      } else if (r && !r.user && !r.user) {
        const o = await K(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await M(this.storage, this.storageKey + "-user"), await oe(this.storage, this.storageKey, r)) : r.user = De();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const i = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < $e;
      if (this._debug(s, `session has${i ? "" : " not"} expired with margin of ${$e}s`), i) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), Re(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
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
      throw new z();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new Pe();
      const { data: i, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!i.session)
        throw new z();
      await this._saveSession(i.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", i.session);
      const a = { session: i.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (i) {
      if (this._debug(r, "error", i), _(i)) {
        const o = { session: null, error: i };
        return Re(i) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
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
      !s && t.user && await oe(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const i = Pt(r);
      await oe(this.storage, this.storageKey, i);
    } else {
      const r = Pt(t);
      await oe(this.storage, this.storageKey, r);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await M(this.storage, this.storageKey), await M(this.storage, this.storageKey + "-code-verifier"), await M(this.storage, this.storageKey + "-user"), this.userStorage && await M(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), ne);
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
              const r = Math.floor((s.expires_at * 1e3 - e) / ne);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${ne}ms, refresh threshold is ${We} ticks`), r <= We && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof rs)
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
      const [i, o] = await te(this.storage, this.storageKey), a = new URLSearchParams({
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
      if (_(t))
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
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: u } = await S(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = i == null ? void 0 : i.session) === null || s === void 0 ? void 0 : s.access_token
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
          const { data: r, error: i } = t;
          return i ? { data: null, error: i } : await S(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
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
      const { payload: o } = Le(r.access_token);
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
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + Ar > r)
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
      const { header: r, payload: i, signature: o, raw: { header: a, payload: l } } = Le(s);
      t != null && t.allowExpired || ei(i.exp);
      const u = !r.alg || r.alg.startsWith("HS") || !r.kid || !("crypto" in globalThis && "subtle" in globalThis.crypto) ? null : await this.fetchJwk(r.kid, t != null && t.keys ? { keys: t.keys } : t == null ? void 0 : t.jwks);
      if (!u) {
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
      const c = ti(r.alg), h = await crypto.subtle.importKey("jwk", u, c, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(c, h, o, Br(`${a}.${l}`)))
        throw new Ke("Invalid JWT signature");
      return {
        data: {
          claims: i,
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
pe.nextInstanceID = 0;
const mi = pe;
class bi extends mi {
  constructor(e) {
    super(e);
  }
}
var yi = function(n, e, t, s) {
  function r(i) {
    return i instanceof t ? i : new t(function(o) {
      o(i);
    });
  }
  return new (t || (t = Promise))(function(i, o) {
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
      c.done ? i(c.value) : r(c.value).then(a, l);
    }
    u((s = s.apply(n, e || [])).next());
  });
};
class _i {
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
    const a = Er(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const u = `sb-${l.hostname.split(".")[0]}-auth-token`, c = {
      db: vr,
      realtime: br,
      auth: Object.assign(Object.assign({}, mr), { storageKey: u }),
      global: gr
    }, h = Cr(s ?? {}, c);
    this.storageKey = (r = h.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (i = h.global.headers) !== null && i !== void 0 ? i : {}, h.accessToken ? (this.accessToken = h.accessToken, this.auth = new Proxy({}, {
      get: (d, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = h.auth) !== null && o !== void 0 ? o : {}, this.headers, h.global.fetch), this.fetch = Sr(t, this._getAccessToken.bind(this), h.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, h.realtime)), this.rest = new Ns(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: h.db.schema,
      fetch: this.fetch
    }), this.storage = new dr(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), h.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new fs(this.functionsUrl.href, {
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
    return yi(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: i, flowType: o, lock: a, debug: l }, u, c) {
    const h = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new bi({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, h), u),
      storageKey: i,
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
    return new Zs(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const wi = (n, e, t) => new _i(n, e, t);
function Si() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const n = process.version.match(/^v(\d+)\./);
  return n ? parseInt(n[1], 10) <= 18 : !1;
}
Si() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class et {
  constructor(e, t) {
    m(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = wi(s, r);
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
class ki {
  // Flag to prevent duplicate storage listeners
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
    m(this, "autofieldStorageListenersSetup", !1);
    this.options = e, this.supabaseService = new et(
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
      return this.totalAverage = r != null && r.average_checkout_value ? r.average_checkout_value : 0, r ? (this.campaign = r, this.inputDetector = new as(r.input_mapping), r.type !== "bookvisit" && r.type !== "synxis" && r.type !== "elinapms" && (this.productDetector = new ls(
        r.product_mapping
      ), this.totalExtractor = new cs(
        r.total_selector
      )), this.inputDetector.setOnContentUpdate(
        this.debouncedHandleContentUpdate.bind(this)
      ), this._sessionId && this.inputDetector.setSessionId(this._sessionId), r.type === "bookvisit" && ((s = (t = r.config) == null ? void 0 : t.bookvisit) == null ? void 0 : s.autofields) === !0 && window.location.pathname === "/checkout" && this.injectBookVisitAutofields(r.input_mapping), this.checkAndFillPaymentPageFields(), this.inputDetector.startListening(), this.setupUrlChangeListener(), this.isInitialized = !0, !0) : (console.error("Failed to fetch checkout campaign data"), !1);
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
      this.pendingContentUpdate && (this.handleContentUpdate(
        this.pendingContentUpdate.content,
        this.pendingContentUpdate.sessionId
      ), this.pendingContentUpdate = void 0);
    }, 300);
  }
  async handleContentUpdate(e, t) {
    var s, r, i, o, a, l, u, c;
    if (this.isSubmitting) {
      this.pendingContentUpdate = { content: e, sessionId: t }, this.debounceTimer && clearTimeout(this.debounceTimer), this.debounceTimer = setTimeout(() => {
        this.pendingContentUpdate && this.handleContentUpdate(
          this.pendingContentUpdate.content,
          this.pendingContentUpdate.sessionId
        );
      }, 100);
      return;
    }
    try {
      let h = [], d = this.totalAverage;
      if (((s = this.campaign) == null ? void 0 : s.type) === "bookvisit") {
        const w = await this.fetchBookVisitBasket();
        w && (h = w.products, d = w.total);
      } else if (((r = this.campaign) == null ? void 0 : r.type) === "synxis") {
        const w = await this.fetchSynxisBasket();
        w && (h = w.products, d = w.total);
      } else if (((i = this.campaign) == null ? void 0 : i.type) === "elinapms") {
        const w = await this.fetchElinapmsBasket();
        w && (h = w.products, d = w.total);
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
      this.isSubmitting = !0;
      const p = typeof window < "u" ? window.location.href : "", b = this._sessionId || t, g = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: e,
        products: h,
        url: p,
        total: d,
        id: b,
        ...((l = this.campaign) == null ? void 0 : l.type) === "synxis" && this._synxisSessionIds ? { metadata: this._synxisSessionIds } : {},
        ...((u = this.campaign) == null ? void 0 : u.type) === "elinapms" && this._elinapmsSessionIds ? { metadata: this._elinapmsSessionIds } : {}
      }, y = await this.supabaseService.submitCartSession(g);
      y && y.id ? (this._sessionId = y.id, (c = this.inputDetector) == null || c.setSessionId(y.id), this.saveSessionIdToStorage(y.id), this.previousContent = { ...e }, this.previousProducts = [...h], this.previousTotal = d, console.log("Cart session updated successfully:", y.id)) : console.error("Failed to submit cart session");
    } catch (h) {
      console.error("Error handling content update:", h);
    } finally {
      this.isSubmitting = !1;
    }
  }
  hasContentChanged(e, t, s) {
    if (Object.keys(this.previousContent).length === 0 && this.previousProducts.length === 0 && this.previousTotal === 0)
      return !0;
    const r = JSON.stringify(e) !== JSON.stringify(this.previousContent), i = JSON.stringify(t) !== JSON.stringify(this.previousProducts), o = s !== this.previousTotal;
    return r || i || o;
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
      const a = await o.json();
      return this.extractBookVisitProductsAndTotal(a);
    } catch (i) {
      return console.error("Error fetching BookVisit basket:", i), null;
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
      const i = (r = e == null ? void 0 : e.booking) == null ? void 0 : r.bookingData;
      if (!i)
        return { products: t, total: s };
      s = i.totalPrice || 0;
      const o = i.rooms || [], a = i.roomDescriptions || [], l = i.addOnDescriptions || [];
      o.forEach((c) => {
        var b;
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
          const g = c.priceInfo[0].ratePlanId, y = (b = i.ratePlanDescriptions) == null ? void 0 : b.find(
            (w) => w.id === g
          );
          y && (f.ratePlan = y.name);
        }
        t.push(f), (c.mandatoryAddOns || []).forEach((g) => {
          const y = g.totalPrice || 0;
          if (y > 0) {
            const w = l.find(
              (v) => v.id === g.addOnId
            );
            t.push({
              id: g.addOnId,
              name: (w == null ? void 0 : w.name) || "Add-on",
              price: y,
              quantity: g.numberOfUnits || 1,
              type: "addon",
              roomId: c.roomId,
              date: g.date
            });
          }
        });
      }), (i.optionalAddOns || []).forEach((c) => {
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
    } catch (i) {
      console.error(
        "Error extracting BookVisit products and total:",
        i
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
    const t = e.includes("firstName"), s = e.includes("lastName"), r = e.includes("email"), i = e.includes("phoneNumber"), o = this.getLocalizedText("email"), a = this.getLocalizedText("phoneNumber");
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
            `), i && (l += `
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
    var o, a, l, u, c, h, d, f, p, b, g, y, w, v, k, x, C, O, tt, st;
    const t = [];
    let s = 0;
    const r = this.getSynxisActualTotal(), i = this._synxisSessionIds;
    try {
      const Ae = (e == null ? void 0 : e.ShoppingCart) || [], Y = [];
      for (const T of Ae) {
        const I = ((a = (o = T == null ? void 0 : T.UpdatedData) == null ? void 0 : o.itinerary) == null ? void 0 : a.reservations) || [];
        for (const Z of I)
          Y.push({
            resv: Z,
            itineraryNumber: (T == null ? void 0 : T.Itemid) || ""
          });
      }
      let me = Y;
      if (i != null && i.sbeRcDecoded) {
        const T = Y.filter(
          ({ resv: I }) => I.id === i.sbeRcDecoded
        );
        T.length > 0 && (me = T);
      }
      me === Y && Y.length > 1 && (me = [...Y].sort(
        (T, I) => I.itineraryNumber.localeCompare(T.itineraryNumber)
      ).slice(0, 1));
      for (const { resv: T } of me) {
        const I = T.extrasFromShopping || {}, Z = T.stayCriteria || {}, rt = T.guestCriteria || {}, P = I.prices || {}, it = ((c = (u = (l = P == null ? void 0 : P.Total) == null ? void 0 : l.Price) == null ? void 0 : u.Total) == null ? void 0 : c.AmountWithTaxesFees) || ((f = (d = (h = P == null ? void 0 : P.Total) == null ? void 0 : h.Price) == null ? void 0 : d.Total) == null ? void 0 : f.Amount) || ((b = (p = P == null ? void 0 : P.Total) == null ? void 0 : p.Price) == null ? void 0 : b.Amount) || 0, nt = ((P == null ? void 0 : P.Daily) || []).map((q) => {
          var ot, at, lt, ct, ut, ht, dt, ft, pt, gt;
          return {
            date: q.Date,
            amount: ((at = (ot = q.Price) == null ? void 0 : ot.Total) == null ? void 0 : at.Amount) || ((lt = q.Price) == null ? void 0 : lt.Amount) || 0,
            amountWithTax: ((ut = (ct = q.Price) == null ? void 0 : ct.Total) == null ? void 0 : ut.AmountWithTaxesFees) || 0,
            tax: ((dt = (ht = q.Price) == null ? void 0 : ht.Tax) == null ? void 0 : dt.Amount) || 0,
            fees: ((pt = (ft = q.Price) == null ? void 0 : ft.Fees) == null ? void 0 : pt.Amount) || 0,
            currency: (gt = q.Price) == null ? void 0 : gt.CurrencyCode,
            inventory: q.AvailableInventory
          };
        }), is = {
          id: T.id,
          confirmationNumber: T.confirmationNumber,
          itineraryNumber: T.itineraryNumber,
          name: I.displayname || "Room",
          roomCode: Z.roomCode,
          rateCode: Z.rateCode,
          price: it,
          actualTotal: r,
          dailyRate: I.amount || I.amountWithTaxesFees,
          currency: I.currencyCode,
          dailyPrices: nt,
          taxes: ((w = (y = (g = P == null ? void 0 : P.Total) == null ? void 0 : g.Price) == null ? void 0 : y.Tax) == null ? void 0 : w.Amount) || 0,
          fees: ((x = (k = (v = P == null ? void 0 : P.Total) == null ? void 0 : v.Price) == null ? void 0 : k.Fees) == null ? void 0 : x.Amount) || 0,
          startDate: (C = Z.startDate) == null ? void 0 : C.split("T")[0],
          endDate: (O = Z.endDate) == null ? void 0 : O.split("T")[0],
          nights: nt.length || null,
          adults: rt.numAdults || 1,
          children: rt.numChildren || 0,
          hotelId: String(T.hotelId),
          chainId: String(T.chainId),
          bedDescription: I.bedDescription,
          bedType: I.bedType,
          bedQuantity: I.bedQuantity,
          maxRoomSize: I.maxRoomSize,
          minRoomSize: I.minRoomSize,
          guestLimit: I.guestLimit,
          inventory: I.inventory,
          bookingPolicyCode: I.bookingPolicyCode,
          cancelPolicyCode: I.cancelPolicyCode,
          status: T.status,
          type: "room",
          quantity: 1,
          addons: T.addOns || [],
          image: I.coverImage || ((st = (tt = I.imageUrls) == null ? void 0 : tt[0]) == null ? void 0 : st.Path) || null
        };
        t.push(is), s += it;
      }
    } catch (Ae) {
      console.error("SynXis: Error extracting cart API data:", Ae);
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
      const s = Array.from(e).map((i) => {
        const o = i;
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
    const s = t.querySelector(".formattedCurrency"), r = s ? this.parseElinapmsNumber(s.textContent) : 0, i = t.querySelector(".plusFees"), o = i ? this.parseElinapmsNumber(i.dataset.att) : 0;
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
      ), l = document.querySelector(
        'input[name="firstName"]'
      ), u = document.querySelector(
        'input[name="lastName"]'
      );
      i || o || a || l || u ? (this.addDirectAutofieldListeners(), this.setupAutofieldStorageListeners(), this.inputDetector && (this.inputDetector.stopListening(), this.inputDetector.startListening())) : e < t ? (e++, setTimeout(r, s)) : console.warn(
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
      const s = this.handleAutofieldBlur.bind(this);
      t.removeEventListener("blur", s), t.addEventListener("blur", s);
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
    let i = t.name;
    const o = this.inputDetector.inputMapping;
    (c = o == null ? void 0 : o.field_mappings) != null && c[i] ? i = o.field_mappings[i] : i === "emailAddress" ? i = "email" : i === "phoneNumber" ? i = "phone_number" : i === "firstName" ? i = "first_name" : i === "lastName" && (i = "last_name");
    const a = { ...r, [i]: s }, l = i === "email" || i.toLowerCase().includes("email") || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), u = i === "phone_number" || i.toLowerCase().includes("phone") || /^[\+]?[0-9\s\-\(\)]{7,}$/.test(s);
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
      const i = r.target;
      i.value && this.saveToSessionStorage("autofield_email", i.value);
    }), e.addEventListener("blur", (r) => {
      const i = r.target;
      i.value && this.saveToSessionStorage("autofield_email", i.value);
    }));
    const t = document.querySelector(
      'input[name="phoneCountryCode"]'
    );
    t && (t.addEventListener("input", (r) => {
      const i = r.target;
      i.value && this.saveToSessionStorage(
        "autofield_phoneCountryCode",
        i.value
      );
    }), t.addEventListener("blur", (r) => {
      const i = r.target;
      i.value && this.saveToSessionStorage(
        "autofield_phoneCountryCode",
        i.value
      );
    }));
    const s = document.querySelector(
      'input[name="phoneNumber"]'
    );
    s && (s.addEventListener("input", (r) => {
      const i = r.target;
      i.value && this.saveToSessionStorage(
        "autofield_phoneNumber",
        i.value
      );
    }), s.addEventListener("blur", (r) => {
      const i = r.target;
      i.value && this.saveToSessionStorage(
        "autofield_phoneNumber",
        i.value
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
            const b = p.querySelector(
              ".css-1yh68ch-singleValue"
            );
            b && (b.textContent = u);
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
    }, i = () => {
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
      }), (a || u) && (o = !0), !o && e < t ? (e++, setTimeout(i, s)) : e >= t && !o && console.warn(
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
    var t, s, r, i, o, a, l, u, c, h;
    try {
      const d = this.getFromSessionStorage("autofield_email"), f = this.getFromSessionStorage(
        "autofield_phoneCountryCode"
      ), p = this.getFromSessionStorage(
        "autofield_phoneNumber"
      );
      if (!d && !f && !p)
        return;
      let b = "*";
      if (e.src)
        try {
          b = new URL(e.src).origin;
        } catch {
        }
      const g = ((t = e.src) == null ? void 0 : t.includes("dibspayment.eu")) || ((s = e.src) == null ? void 0 : s.includes("dibs.")) || ((r = e.name) == null ? void 0 : r.toLowerCase().includes("dibs")), y = ((i = e.src) == null ? void 0 : i.includes("netseasy")) || ((o = e.src) == null ? void 0 : o.includes("nets.eu")) || ((a = e.src) == null ? void 0 : a.includes("nexigroup.com")) || ((l = e.src) == null ? void 0 : l.includes("dibspayment.eu")) || // Dibs is part of Nexi Group
      ((u = e.name) == null ? void 0 : u.toLowerCase().includes("nets")) || ((c = e.name) == null ? void 0 : c.toLowerCase().includes("easy"));
      if (!e.contentWindow)
        return;
      const w = [
        // Format 1: Our standard format
        {
          type: "ekteintelligens-autofill",
          email: d || null,
          phoneCountryCode: f || null,
          phoneNumber: p || null
        },
        // Format 2: Dibs/Nets Easy-specific formats
        ...g || y ? [
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
      w.forEach((k) => {
        try {
          e.contentWindow.postMessage(k, b);
        } catch {
        }
      }), console.log(
        `Sent autofill data to ${y ? "Nets Easy/Nexi" : g ? "Dibs" : "cross-origin"} iframe via postMessage (${w.length} formats):`,
        {
          iframeSrc: ((h = e.src) == null ? void 0 : h.substring(0, 100)) || "unknown",
          email: d ? "***" : null,
          phoneCountryCode: f,
          phoneNumber: p ? "***" : null,
          targetOrigin: b
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
        const i = new URL(e.src), o = i.hostname.includes("dibspayment.eu") || i.hostname.includes("dibs."), a = i.hostname.includes("netseasy") || i.hostname.includes("nets.eu") || i.hostname.includes("nexigroup.com") || i.hostname.includes("dibspayment.eu");
        if (!o && !a)
          return;
        const l = i.searchParams.toString().length > 0;
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
}
class Ei {
  constructor(e) {
    m(this, "options");
    m(this, "supabaseService");
    m(this, "campaign");
    m(this, "formData", {});
    m(this, "inputListeners", []);
    m(this, "buttonListeners", []);
    m(this, "submitListener");
    m(this, "isInitialized", !1);
    this.options = e, this.supabaseService = new et(
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
class Ci {
  constructor(e) {
    // @ts-ignore
    m(this, "options");
    m(this, "isInitialized", !1);
    m(this, "currentPage", "");
    m(this, "currentVisitStartTime", 0);
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
  trackPageEntry() {
    if (typeof window > "u")
      return;
    const e = window.location.pathname + window.location.search;
    this.currentPage && this.currentVisitStartTime > 0 && this.trackPageExit(), this.currentPage = e, this.currentVisitStartTime = Date.now();
    const t = {
      page: e,
      enteredAt: this.currentVisitStartTime
    };
    this.data.visits.push(t), this.saveDataToStorage();
  }
  trackPageExit() {
    if (!this.currentPage || this.currentVisitStartTime === 0)
      return;
    const e = this.data.visits.find(
      (t) => t.page === this.currentPage && t.enteredAt === this.currentVisitStartTime && !t.leftAt
    );
    e && (e.leftAt = Date.now(), this.saveDataToStorage());
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
      document.visibilityState === "hidden" ? this.trackPageExit() : document.visibilityState === "visible" && window.location.pathname + window.location.search !== this.currentPage && this.trackPageEntry();
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
    if (!(typeof window > "u" || !window.localStorage))
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
      } catch (e) {
        console.warn(
          "Failed to save enhanced insights data to localStorage:",
          e
        );
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
const Q = class Q {
  constructor(e) {
    m(this, "supabaseService");
    m(this, "isInitialized", !1);
    this.supabaseService = new et(
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
        Q.URL_PARAM
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
        Q.STORAGE_KEY
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
          Q.STORAGE_KEY,
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
m(Q, "URL_PARAM", "s"), /** sessionStorage key holding the short ids already tracked this session. */
m(Q, "STORAGE_KEY", "ei_tracked_subscriber_ids");
let Je = Q;
class Ti {
  constructor(e) {
    m(this, "options");
    m(this, "tools", /* @__PURE__ */ new Map());
    m(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e, t, s;
    if (this._isInitialized)
      return !0;
    try {
      const r = new Je(this.options);
      if (await r.initialize(), this.tools.set("linkTracking", r), (e = this.options.features) != null && e.abandonedCart) {
        const i = new ki(this.options);
        await i.initialize(), this.tools.set("abandonedCart", i);
      }
      if ((t = this.options.features) != null && t.organizationPipeline) {
        const i = new Ei(
          this.options
        );
        await i.initialize(), this.tools.set(
          "organizationPipeline",
          i
        );
      }
      if ((s = this.options.features) != null && s.enhancedInsights) {
        const i = new Ci(
          this.options
        );
        await i.initialize(), this.tools.set("enhancedInsights", i);
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
  destroy() {
    this.tools.forEach((e) => {
      e.destroy && e.destroy();
    }), this.tools.clear(), this._isInitialized = !1;
  }
  isInitialized() {
    return this._isInitialized;
  }
}
typeof window < "u" && (window.EkteIntelligensSDK = Ti);
export {
  Ti as EkteIntelligensSDK
};
