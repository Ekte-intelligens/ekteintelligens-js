var It = Object.defineProperty;
var Rt = (i, e, t) => e in i ? It(i, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : i[e] = t;
var S = (i, e, t) => Rt(i, typeof e != "symbol" ? e + "" : e, t);
function U(i) {
  try {
    return decodeURIComponent(atob(i));
  } catch {
    return i;
  }
}
function Ut(i) {
  if (!i || typeof i != "object")
    return i;
  const e = {};
  for (const [t, s] of Object.entries(i)) {
    const r = U(t), n = typeof s == "object" && s !== null ? { ...s } : s;
    if (n && typeof n == "object") {
      if (n.id_selector && (n.id_selector = U(
        n.id_selector
      )), n.name_selector && (n.name_selector = U(
        n.name_selector
      )), n.price_selector && (n.price_selector = U(
        n.price_selector
      )), n.quantity_selector && (n.quantity_selector = U(
        n.quantity_selector
      )), n.fields) {
        const o = {};
        for (const [a, l] of Object.entries(
          n.fields
        ))
          o[a] = U(
            l
          );
        n.fields = o;
      }
      if (n.additional_fields) {
        const o = {};
        for (const [a, l] of Object.entries(
          n.additional_fields
        ))
          o[a] = U(
            l
          );
        n.additional_fields = o;
      }
    }
    e[r] = n;
  }
  return e;
}
class Lt {
  constructor(e) {
    S(this, "inputMapping");
    S(this, "content", {});
    S(this, "sessionId");
    S(this, "hasEmailOrPhone", !1);
    S(this, "onContentUpdate");
    this.inputMapping = this.decodeInputMapping(e);
  }
  decodeInputMapping(e) {
    if (!e)
      return null;
    const t = { ...e };
    return t.form_selector && (t.form_selector = U(
      t.form_selector
    )), t.inputs && t.inputs.length > 0 && (t.inputs = t.inputs.map(
      (s) => U(s)
    )), t;
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
    if (!this.inputMapping)
      return Array.from(document.querySelectorAll("input"));
    if (this.inputMapping.form_selector) {
      const e = document.querySelector(
        this.inputMapping.form_selector
      );
      if (e)
        return Array.from(e.querySelectorAll("input"));
    }
    return this.inputMapping.inputs && this.inputMapping.inputs.length > 0 ? this.inputMapping.inputs.map((e) => document.querySelector(e)).filter((e) => e !== null) : Array.from(document.querySelectorAll("input"));
  }
  handleInputBlur(e) {
    const t = e.target, s = this.getFieldName(t), r = t.value.trim();
    r && (this.content[s] = r, this.isEmailOrPhone(s, r) && (this.hasEmailOrPhone = !0), this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
  }
  getFieldName(e) {
    var s;
    let t = e.name || e.id || e.getAttribute("data-field") || e.type || "unknown";
    return (s = this.inputMapping) != null && s.field_mappings && this.inputMapping.field_mappings[t] && (t = this.inputMapping.field_mappings[t]), t;
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
class Dt {
  constructor(e) {
    S(this, "productMapping");
    this.productMapping = Ut(e);
  }
  detectProducts() {
    const e = [];
    if (!this.productMapping || Object.keys(this.productMapping).length === 0)
      return this.detectCommonProducts();
    for (const [t, s] of Object.entries(this.productMapping)) {
      const r = t.includes(",") ? t.split(",").map((n) => n.trim()) : [t];
      for (const n of r)
        document.querySelectorAll(n).forEach((a) => {
          const l = this.extractProductFromElement(
            a,
            s
          );
          l && Object.keys(l).length > 0 && e.push(l);
        });
    }
    return e;
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
  extractProductFromElement(e, t) {
    try {
      const s = {};
      if (t.id_selector) {
        const r = this.extractValue(e, t.id_selector);
        r !== null && (s.id = r);
      }
      if (t.name_selector) {
        const r = this.extractValue(
          e,
          t.name_selector
        );
        r !== null && (s.name = r);
      }
      if (t.price_selector && (s.price = this.extractPrice(
        e,
        t.price_selector
      )), t.quantity_selector && (s.quantity = this.extractQuantity(
        e,
        t.quantity_selector
      )), t.fields)
        for (const [r, n] of Object.entries(
          t.fields
        )) {
          const o = this.extractValue(
            e,
            n
          );
          o !== null && (r.toLowerCase().includes("price") ? s[r] = this.extractPrice(
            e,
            n
          ) : s[r] = o);
        }
      if (t.additional_fields)
        for (const [r, n] of Object.entries(
          t.additional_fields
        )) {
          const o = this.extractValue(
            e,
            n
          );
          o !== null && (s[r] = o);
        }
      return Object.keys(s).length > 0 ? s : null;
    } catch (s) {
      return console.warn("Error extracting product from element:", s), null;
    }
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
    const r = s.replace(/[^\d.,]/g, "").replace(",", "."), n = parseFloat(r);
    return isNaN(n) ? 0 : n;
  }
  extractQuantity(e, t) {
    const s = this.extractValue(e, t);
    if (!s) return 1;
    const r = parseInt(s);
    return isNaN(r) ? 1 : r;
  }
}
class Nt {
  constructor(e) {
    S(this, "totalSelector");
    this.totalSelector = e ? U(e) : void 0;
  }
  extractTotal() {
    var e;
    if (!this.totalSelector)
      return 0;
    try {
      let t = this.totalSelector;
      if (t = t.replace(/\\/g, ""), t.includes("!") || t.includes("[") || t.includes(":")) {
        const a = this.extractSimpleSelector(t);
        a && (t = a);
      }
      const s = document.querySelector(t);
      if (!s)
        return console.warn(`Total selector not found: ${this.totalSelector}`), 0;
      const r = ((e = s.textContent) == null ? void 0 : e.trim()) || "";
      if (!r)
        return console.warn(
          `No text content found for total selector: ${this.totalSelector}`
        ), 0;
      let n = r.replace(/[^\d.,]/g, "");
      n.includes(",") && !n.includes(".") ? n = n.replace(",", ".") : n.includes(",") && n.includes(".") && (n = n.replace(",", ""));
      const o = parseFloat(n);
      return isNaN(o) ? (console.warn(`Could not parse total value: ${r}`), 0) : o;
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
  extractSimpleSelector(e) {
    const t = e.match(/p:nth-child\((\d+)\)/);
    if (t) {
      const s = t[1], r = e.match(
        /([a-zA-Z0-9_-]+)\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*[a-zA-Z0-9_-]+\s*>\s*p:nth-child/
      );
      if (r)
        return `#${r[1]} p:nth-child(${s})`;
      const n = e.match(/#([a-zA-Z0-9_-]+)/);
      if (n)
        return `#${n[1]} p:nth-child(${s})`;
    }
    return null;
  }
}
const qt = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => se).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
};
class Be extends Error {
  constructor(e, t = "FunctionsError", s) {
    super(e), this.name = t, this.context = s;
  }
}
class Bt extends Be {
  constructor(e) {
    super("Failed to send a request to the Edge Function", "FunctionsFetchError", e);
  }
}
class We extends Be {
  constructor(e) {
    super("Relay Error invoking the Edge Function", "FunctionsRelayError", e);
  }
}
class Je extends Be {
  constructor(e) {
    super("Edge Function returned a non-2xx status code", "FunctionsHttpError", e);
  }
}
var $e;
(function(i) {
  i.Any = "any", i.ApNortheast1 = "ap-northeast-1", i.ApNortheast2 = "ap-northeast-2", i.ApSouth1 = "ap-south-1", i.ApSoutheast1 = "ap-southeast-1", i.ApSoutheast2 = "ap-southeast-2", i.CaCentral1 = "ca-central-1", i.EuCentral1 = "eu-central-1", i.EuWest1 = "eu-west-1", i.EuWest2 = "eu-west-2", i.EuWest3 = "eu-west-3", i.SaEast1 = "sa-east-1", i.UsEast1 = "us-east-1", i.UsWest1 = "us-west-1", i.UsWest2 = "us-west-2";
})($e || ($e = {}));
var Mt = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class Ft {
  constructor(e, { headers: t = {}, customFetch: s, region: r = $e.Any } = {}) {
    this.url = e, this.headers = t, this.region = r, this.fetch = qt(s);
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
    return Mt(this, void 0, void 0, function* () {
      try {
        const { headers: r, method: n, body: o } = t;
        let a = {}, { region: l } = t;
        l || (l = this.region);
        const c = new URL(`${this.url}/${e}`);
        l && l !== "any" && (a["x-region"] = l, c.searchParams.set("forceFunctionRegion", l));
        let u;
        o && (r && !Object.prototype.hasOwnProperty.call(r, "Content-Type") || !r) && (typeof Blob < "u" && o instanceof Blob || o instanceof ArrayBuffer ? (a["Content-Type"] = "application/octet-stream", u = o) : typeof o == "string" ? (a["Content-Type"] = "text/plain", u = o) : typeof FormData < "u" && o instanceof FormData ? u = o : (a["Content-Type"] = "application/json", u = JSON.stringify(o)));
        const h = yield this.fetch(c.toString(), {
          method: n || "POST",
          // headers priority is (high to low):
          // 1. invoke-level headers
          // 2. client-level headers
          // 3. default Content-Type header
          headers: Object.assign(Object.assign(Object.assign({}, a), this.headers), r),
          body: u
        }).catch((w) => {
          throw new Bt(w);
        }), d = h.headers.get("x-relay-error");
        if (d && d === "true")
          throw new We(h);
        if (!h.ok)
          throw new Je(h);
        let f = ((s = h.headers.get("Content-Type")) !== null && s !== void 0 ? s : "text/plain").split(";")[0].trim(), p;
        return f === "application/json" ? p = yield h.json() : f === "application/octet-stream" ? p = yield h.blob() : f === "text/event-stream" ? p = h : f === "multipart/form-data" ? p = yield h.formData() : p = yield h.text(), { data: p, error: null, response: h };
      } catch (r) {
        return {
          data: null,
          error: r,
          response: r instanceof Je || r instanceof We ? r.context : void 0
        };
      }
    });
  }
}
var x = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function zt(i) {
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
var $ = {}, Me = {}, _e = {}, ce = {}, ve = {}, ye = {}, Kt = function() {
  if (typeof self < "u")
    return self;
  if (typeof window < "u")
    return window;
  if (typeof global < "u")
    return global;
  throw new Error("unable to locate global object");
}, te = Kt();
const Wt = te.fetch, ct = te.fetch.bind(te), ut = te.Headers, Jt = te.Request, Ht = te.Response, se = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Headers: ut,
  Request: Jt,
  Response: Ht,
  default: ct,
  fetch: Wt
}, Symbol.toStringTag, { value: "Module" })), Vt = /* @__PURE__ */ zt(se);
var we = {};
Object.defineProperty(we, "__esModule", { value: !0 });
let Gt = class extends Error {
  constructor(e) {
    super(e.message), this.name = "PostgrestError", this.details = e.details, this.hint = e.hint, this.code = e.code;
  }
};
we.default = Gt;
var ht = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(ye, "__esModule", { value: !0 });
const Qt = ht(Vt), Xt = ht(we);
let Zt = class {
  constructor(e) {
    this.shouldThrowOnError = !1, this.method = e.method, this.url = e.url, this.headers = e.headers, this.schema = e.schema, this.body = e.body, this.shouldThrowOnError = e.shouldThrowOnError, this.signal = e.signal, this.isMaybeSingle = e.isMaybeSingle, e.fetch ? this.fetch = e.fetch : typeof fetch > "u" ? this.fetch = Qt.default : this.fetch = fetch;
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
      let c = null, u = null, h = null, d = n.status, f = n.statusText;
      if (n.ok) {
        if (this.method !== "HEAD") {
          const k = await n.text();
          k === "" || (this.headers.Accept === "text/csv" || this.headers.Accept && this.headers.Accept.includes("application/vnd.pgrst.plan+text") ? u = k : u = JSON.parse(k));
        }
        const w = (o = this.headers.Prefer) === null || o === void 0 ? void 0 : o.match(/count=(exact|planned|estimated)/), _ = (a = n.headers.get("content-range")) === null || a === void 0 ? void 0 : a.split("/");
        w && _ && _.length > 1 && (h = parseInt(_[1])), this.isMaybeSingle && this.method === "GET" && Array.isArray(u) && (u.length > 1 ? (c = {
          // https://github.com/PostgREST/postgrest/blob/a867d79c42419af16c18c3fb019eba8df992626f/src/PostgREST/Error.hs#L553
          code: "PGRST116",
          details: `Results contain ${u.length} rows, application/vnd.pgrst.object+json requires 1 row`,
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned"
        }, u = null, h = null, d = 406, f = "Not Acceptable") : u.length === 1 ? u = u[0] : u = null);
      } else {
        const w = await n.text();
        try {
          c = JSON.parse(w), Array.isArray(c) && n.status === 404 && (u = [], c = null, d = 200, f = "OK");
        } catch {
          n.status === 404 && w === "" ? (d = 204, f = "No Content") : c = {
            message: w
          };
        }
        if (c && this.isMaybeSingle && (!((l = c == null ? void 0 : c.details) === null || l === void 0) && l.includes("0 rows")) && (c = null, d = 200, f = "OK"), c && this.shouldThrowOnError)
          throw new Xt.default(c);
      }
      return {
        error: c,
        data: u,
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
ye.default = Zt;
var Yt = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(ve, "__esModule", { value: !0 });
const es = Yt(ye);
let ts = class extends es.default {
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
ve.default = ts;
var ss = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(ce, "__esModule", { value: !0 });
const rs = ss(ve);
let is = class extends rs.default {
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
ce.default = is;
var ns = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(_e, "__esModule", { value: !0 });
const ie = ns(ce);
let os = class {
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
    return this.url.searchParams.set("select", o), s && (this.headers.Prefer = `count=${s}`), new ie.default({
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
    return new ie.default({
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
    return new ie.default({
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
    return this.headers.Prefer && r.push(this.headers.Prefer), t && r.push(`count=${t}`), this.headers.Prefer = r.join(","), new ie.default({
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
    return e && s.push(`count=${e}`), this.headers.Prefer && s.unshift(this.headers.Prefer), this.headers.Prefer = s.join(","), new ie.default({
      method: t,
      url: this.url,
      headers: this.headers,
      schema: this.schema,
      fetch: this.fetch,
      allowEmpty: !1
    });
  }
};
_e.default = os;
var me = {}, be = {};
Object.defineProperty(be, "__esModule", { value: !0 });
be.version = void 0;
be.version = "0.0.0-automated";
Object.defineProperty(me, "__esModule", { value: !0 });
me.DEFAULT_HEADERS = void 0;
const as = be;
me.DEFAULT_HEADERS = { "X-Client-Info": `postgrest-js/${as.version}` };
var dt = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty(Me, "__esModule", { value: !0 });
const ls = dt(_e), cs = dt(ce), us = me;
let hs = class ft {
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
    this.url = e, this.headers = Object.assign(Object.assign({}, us.DEFAULT_HEADERS), t), this.schemaName = s, this.fetch = r;
  }
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(e) {
    const t = new URL(`${this.url}/${e}`);
    return new ls.default(t, {
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
    return new ft(this.url, {
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
    s || r ? (o = s ? "HEAD" : "GET", Object.entries(t).filter(([u, h]) => h !== void 0).map(([u, h]) => [u, Array.isArray(h) ? `{${h.join(",")}}` : `${h}`]).forEach(([u, h]) => {
      a.searchParams.append(u, h);
    })) : (o = "POST", l = t);
    const c = Object.assign({}, this.headers);
    return n && (c.Prefer = `count=${n}`), new cs.default({
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
Me.default = hs;
var re = x && x.__importDefault || function(i) {
  return i && i.__esModule ? i : { default: i };
};
Object.defineProperty($, "__esModule", { value: !0 });
$.PostgrestError = $.PostgrestBuilder = $.PostgrestTransformBuilder = $.PostgrestFilterBuilder = $.PostgrestQueryBuilder = $.PostgrestClient = void 0;
const gt = re(Me);
$.PostgrestClient = gt.default;
const pt = re(_e);
$.PostgrestQueryBuilder = pt.default;
const _t = re(ce);
$.PostgrestFilterBuilder = _t.default;
const vt = re(ve);
$.PostgrestTransformBuilder = vt.default;
const yt = re(ye);
$.PostgrestBuilder = yt.default;
const wt = re(we);
$.PostgrestError = wt.default;
var ds = $.default = {
  PostgrestClient: gt.default,
  PostgrestQueryBuilder: pt.default,
  PostgrestFilterBuilder: _t.default,
  PostgrestTransformBuilder: vt.default,
  PostgrestBuilder: yt.default,
  PostgrestError: wt.default
};
const {
  PostgrestClient: fs,
  PostgrestQueryBuilder: ai,
  PostgrestFilterBuilder: li,
  PostgrestTransformBuilder: ci,
  PostgrestBuilder: ui,
  PostgrestError: hi
} = ds;
function gs() {
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
const ps = gs(), _s = "2.11.15", vs = `realtime-js/${_s}`, ys = "1.0.0", mt = 1e4, ws = 1e3;
var oe;
(function(i) {
  i[i.connecting = 0] = "connecting", i[i.open = 1] = "open", i[i.closing = 2] = "closing", i[i.closed = 3] = "closed";
})(oe || (oe = {}));
var O;
(function(i) {
  i.closed = "closed", i.errored = "errored", i.joined = "joined", i.joining = "joining", i.leaving = "leaving";
})(O || (O = {}));
var R;
(function(i) {
  i.close = "phx_close", i.error = "phx_error", i.join = "phx_join", i.reply = "phx_reply", i.leave = "phx_leave", i.access_token = "access_token";
})(R || (R = {}));
var Ce;
(function(i) {
  i.websocket = "websocket";
})(Ce || (Ce = {}));
var J;
(function(i) {
  i.Connecting = "connecting", i.Open = "open", i.Closing = "closing", i.Closed = "closed";
})(J || (J = {}));
class ms {
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
class bt {
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
var b;
(function(i) {
  i.abstime = "abstime", i.bool = "bool", i.date = "date", i.daterange = "daterange", i.float4 = "float4", i.float8 = "float8", i.int2 = "int2", i.int4 = "int4", i.int4range = "int4range", i.int8 = "int8", i.int8range = "int8range", i.json = "json", i.jsonb = "jsonb", i.money = "money", i.numeric = "numeric", i.oid = "oid", i.reltime = "reltime", i.text = "text", i.time = "time", i.timestamp = "timestamp", i.timestamptz = "timestamptz", i.timetz = "timetz", i.tsrange = "tsrange", i.tstzrange = "tstzrange";
})(b || (b = {}));
const He = (i, e, t = {}) => {
  var s;
  const r = (s = t.skipTypes) !== null && s !== void 0 ? s : [];
  return Object.keys(e).reduce((n, o) => (n[o] = bs(o, i, e, r), n), {});
}, bs = (i, e, t, s) => {
  const r = e.find((a) => a.name === i), n = r == null ? void 0 : r.type, o = t[i];
  return n && !s.includes(n) ? kt(n, o) : xe(o);
}, kt = (i, e) => {
  if (i.charAt(0) === "_") {
    const t = i.slice(1, i.length);
    return Ts(e, t);
  }
  switch (i) {
    case b.bool:
      return ks(e);
    case b.float4:
    case b.float8:
    case b.int2:
    case b.int4:
    case b.int8:
    case b.numeric:
    case b.oid:
      return Ss(e);
    case b.json:
    case b.jsonb:
      return Es(e);
    case b.timestamp:
      return js(e);
    case b.abstime:
    case b.date:
    case b.daterange:
    case b.int4range:
    case b.int8range:
    case b.money:
    case b.reltime:
    case b.text:
    case b.time:
    case b.timestamptz:
    case b.timetz:
    case b.tsrange:
    case b.tstzrange:
      return xe(e);
    default:
      return xe(e);
  }
}, xe = (i) => i, ks = (i) => {
  switch (i) {
    case "t":
      return !0;
    case "f":
      return !1;
    default:
      return i;
  }
}, Ss = (i) => {
  if (typeof i == "string") {
    const e = parseFloat(i);
    if (!Number.isNaN(e))
      return e;
  }
  return i;
}, Es = (i) => {
  if (typeof i == "string")
    try {
      return JSON.parse(i);
    } catch (e) {
      return console.log(`JSON parse error: ${e}`), i;
    }
  return i;
}, Ts = (i, e) => {
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
    return n.map((a) => kt(e, a));
  }
  return i;
}, js = (i) => typeof i == "string" ? i.replace(" ", "T") : i, St = (i) => {
  let e = i;
  return e = e.replace(/^ws/i, "http"), e = e.replace(/(\/socket\/websocket|\/socket|\/websocket)\/?$/i, ""), e.replace(/\/+$/, "");
};
class Se {
  /**
   * Initializes the Push
   *
   * @param channel The Channel
   * @param event The event, for example `"phx_join"`
   * @param payload The payload, for example `{user_id: 123}`
   * @param timeout The push timeout in milliseconds
   */
  constructor(e, t, s = {}, r = mt) {
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
var Ve;
(function(i) {
  i.SYNC = "sync", i.JOIN = "join", i.LEAVE = "leave";
})(Ve || (Ve = {}));
class ae {
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
      this.joinRef = this.channel._joinRef(), this.state = ae.syncState(this.state, r, n, o), this.pendingDiffs.forEach((l) => {
        this.state = ae.syncDiff(this.state, l, n, o);
      }), this.pendingDiffs = [], a();
    }), this.channel._on(s.diff, {}, (r) => {
      const { onJoin: n, onLeave: o, onSync: a } = this.caller;
      this.inPendingSyncState() ? this.pendingDiffs.push(r) : (this.state = ae.syncDiff(this.state, r, n, o), a());
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
      const h = n[c];
      if (h) {
        const d = u.map((_) => _.presence_ref), f = h.map((_) => _.presence_ref), p = u.filter((_) => f.indexOf(_.presence_ref) < 0), w = h.filter((_) => d.indexOf(_.presence_ref) < 0);
        p.length > 0 && (a[c] = p), w.length > 0 && (l[c] = w);
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
        const h = e[a].map((f) => f.presence_ref), d = u.filter((f) => h.indexOf(f.presence_ref) < 0);
        e[a].unshift(...d);
      }
      s(a, u, l);
    }), this.map(o, (a, l) => {
      let c = e[a];
      if (!c)
        return;
      const u = l.map((h) => h.presence_ref);
      c = c.filter((h) => u.indexOf(h.presence_ref) < 0), e[a] = c, r(a, c, l), c.length === 0 && delete e[a];
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
var Ge;
(function(i) {
  i.ALL = "*", i.INSERT = "INSERT", i.UPDATE = "UPDATE", i.DELETE = "DELETE";
})(Ge || (Ge = {}));
var Qe;
(function(i) {
  i.BROADCAST = "broadcast", i.PRESENCE = "presence", i.POSTGRES_CHANGES = "postgres_changes", i.SYSTEM = "system";
})(Qe || (Qe = {}));
var D;
(function(i) {
  i.SUBSCRIBED = "SUBSCRIBED", i.TIMED_OUT = "TIMED_OUT", i.CLOSED = "CLOSED", i.CHANNEL_ERROR = "CHANNEL_ERROR";
})(D || (D = {}));
class Fe {
  constructor(e, t = { config: {} }, s) {
    this.topic = e, this.params = t, this.socket = s, this.bindings = {}, this.state = O.closed, this.joinedOnce = !1, this.pushBuffer = [], this.subTopic = e.replace(/^realtime:/i, ""), this.params.config = Object.assign({
      broadcast: { ack: !1, self: !1 },
      presence: { key: "" },
      private: !1
    }, t.config), this.timeout = this.socket.timeout, this.joinPush = new Se(this, R.join, this.params, this.timeout), this.rejoinTimer = new bt(() => this._rejoinUntilConnected(), this.socket.reconnectAfterMs), this.joinPush.receive("ok", () => {
      this.state = O.joined, this.rejoinTimer.reset(), this.pushBuffer.forEach((r) => r.send()), this.pushBuffer = [];
    }), this._onClose(() => {
      this.rejoinTimer.reset(), this.socket.log("channel", `close ${this.topic} ${this._joinRef()}`), this.state = O.closed, this.socket._remove(this);
    }), this._onError((r) => {
      this._isLeaving() || this._isClosed() || (this.socket.log("channel", `error ${this.topic}`, r), this.state = O.errored, this.rejoinTimer.scheduleTimeout());
    }), this.joinPush.receive("timeout", () => {
      this._isJoining() && (this.socket.log("channel", `timeout ${this.topic}`, this.joinPush.timeout), this.state = O.errored, this.rejoinTimer.scheduleTimeout());
    }), this._on(R.reply, {}, (r, n) => {
      this._trigger(this._replyEventName(n), r);
    }), this.presence = new ae(this), this.broadcastEndpointURL = St(this.socket.endPoint) + "/api/broadcast", this.private = this.params.config.private || !1;
  }
  /** Subscribe registers your client with the server */
  subscribe(e, t = this.timeout) {
    var s, r;
    if (this.socket.isConnected() || this.socket.connect(), this.state == O.closed) {
      const { config: { broadcast: n, presence: o, private: a } } = this.params;
      this._onError((u) => e == null ? void 0 : e(D.CHANNEL_ERROR, u)), this._onClose(() => e == null ? void 0 : e(D.CLOSED));
      const l = {}, c = {
        broadcast: n,
        presence: o,
        postgres_changes: (r = (s = this.bindings.postgres_changes) === null || s === void 0 ? void 0 : s.map((u) => u.filter)) !== null && r !== void 0 ? r : [],
        private: a
      };
      this.socket.accessTokenValue && (l.access_token = this.socket.accessTokenValue), this.updateJoinPayload(Object.assign({ config: c }, l)), this.joinedOnce = !0, this._rejoin(t), this.joinPush.receive("ok", async ({ postgres_changes: u }) => {
        var h;
        if (this.socket.setAuth(), u === void 0) {
          e == null || e(D.SUBSCRIBED);
          return;
        } else {
          const d = this.bindings.postgres_changes, f = (h = d == null ? void 0 : d.length) !== null && h !== void 0 ? h : 0, p = [];
          for (let w = 0; w < f; w++) {
            const _ = d[w], { filter: { event: k, schema: P, table: g, filter: m } } = _, j = u && u[w];
            if (j && j.event === k && j.schema === P && j.table === g && j.filter === m)
              p.push(Object.assign(Object.assign({}, _), { id: j.id }));
            else {
              this.unsubscribe(), this.state = O.errored, e == null || e(D.CHANNEL_ERROR, new Error("mismatch between server and client bindings for postgres changes"));
              return;
            }
          }
          this.bindings.postgres_changes = p, e && e(D.SUBSCRIBED);
          return;
        }
      }).receive("error", (u) => {
        this.state = O.errored, e == null || e(D.CHANNEL_ERROR, new Error(JSON.stringify(Object.values(u).join(", ") || "error")));
      }).receive("timeout", () => {
        e == null || e(D.TIMED_OUT);
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
    this.state = O.leaving;
    const t = () => {
      this.socket.log("channel", `leave ${this.topic}`), this._trigger(R.close, "leave", this._joinRef());
    };
    this.joinPush.destroy();
    let s = null;
    return new Promise((r) => {
      s = new Se(this, R.leave, {}, e), s.receive("ok", () => {
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
    let r = new Se(this, e, t, s);
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
    const o = e.toLocaleLowerCase(), { close: a, error: l, leave: c, join: u } = R;
    if (s && [a, l, c, u].indexOf(o) >= 0 && s !== this._joinRef())
      return;
    let d = this._onMessage(o, t, s);
    if (t && !d)
      throw "channel onMessage callbacks must return the payload, modified or unmodified";
    ["insert", "update", "delete"].includes(o) ? (r = this.bindings.postgres_changes) === null || r === void 0 || r.filter((f) => {
      var p, w, _;
      return ((p = f.filter) === null || p === void 0 ? void 0 : p.event) === "*" || ((_ = (w = f.filter) === null || w === void 0 ? void 0 : w.event) === null || _ === void 0 ? void 0 : _.toLocaleLowerCase()) === o;
    }).map((f) => f.callback(d, s)) : (n = this.bindings[o]) === null || n === void 0 || n.filter((f) => {
      var p, w, _, k, P, g;
      if (["broadcast", "presence", "postgres_changes"].includes(o))
        if ("id" in f) {
          const m = f.id, j = (p = f.filter) === null || p === void 0 ? void 0 : p.event;
          return m && ((w = t.ids) === null || w === void 0 ? void 0 : w.includes(m)) && (j === "*" || (j == null ? void 0 : j.toLocaleLowerCase()) === ((_ = t.data) === null || _ === void 0 ? void 0 : _.type.toLocaleLowerCase()));
        } else {
          const m = (P = (k = f == null ? void 0 : f.filter) === null || k === void 0 ? void 0 : k.event) === null || P === void 0 ? void 0 : P.toLocaleLowerCase();
          return m === "*" || m === ((g = t == null ? void 0 : t.event) === null || g === void 0 ? void 0 : g.toLocaleLowerCase());
        }
      else
        return f.type.toLocaleLowerCase() === o;
    }).map((f) => {
      if (typeof d == "object" && "ids" in d) {
        const p = d.data, { schema: w, table: _, commit_timestamp: k, type: P, errors: g } = p;
        d = Object.assign(Object.assign({}, {
          schema: w,
          table: _,
          commit_timestamp: k,
          eventType: P,
          new: {},
          old: {},
          errors: g
        }), this._getPayloadRecords(p));
      }
      f.callback(d, s);
    });
  }
  /** @internal */
  _isClosed() {
    return this.state === O.closed;
  }
  /** @internal */
  _isJoined() {
    return this.state === O.joined;
  }
  /** @internal */
  _isJoining() {
    return this.state === O.joining;
  }
  /** @internal */
  _isLeaving() {
    return this.state === O.leaving;
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
      return !(((n = r.type) === null || n === void 0 ? void 0 : n.toLocaleLowerCase()) === s && Fe.isEqual(r.filter, t));
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
    this._on(R.close, {}, e);
  }
  /**
   * Registers a callback that will be executed when the channel encounteres an error.
   *
   * @internal
   */
  _onError(e) {
    this._on(R.error, {}, (t) => e(t));
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
    this._isLeaving() || (this.socket._leaveOpenTopic(this.topic), this.state = O.joining, this.joinPush.resend(e));
  }
  /** @internal */
  _getPayloadRecords(e) {
    const t = {
      new: {},
      old: {}
    };
    return (e.type === "INSERT" || e.type === "UPDATE") && (t.new = He(e.columns, e.record)), (e.type === "UPDATE" || e.type === "DELETE") && (t.old = He(e.columns, e.old_record)), t;
  }
}
const Xe = () => {
}, Os = `
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`;
class Ps {
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
    this.accessTokenValue = null, this.apiKey = null, this.channels = new Array(), this.endPoint = "", this.httpEndpoint = "", this.headers = {}, this.params = {}, this.timeout = mt, this.heartbeatIntervalMs = 25e3, this.heartbeatTimer = void 0, this.pendingHeartbeatRef = null, this.heartbeatCallback = Xe, this.ref = 0, this.logger = Xe, this.conn = null, this.sendBuffer = [], this.serializer = new ms(), this.stateChangeCallbacks = {
      open: [],
      close: [],
      error: [],
      message: []
    }, this.accessToken = null, this._resolveFetch = (n) => {
      let o;
      return n ? o = n : typeof fetch > "u" ? o = (...a) => Promise.resolve().then(() => se).then(({ default: l }) => l(...a)) : o = fetch, (...a) => o(...a);
    }, this.endPoint = `${e}/${Ce.websocket}`, this.httpEndpoint = St(e), t != null && t.transport ? this.transport = t.transport : this.transport = null, t != null && t.params && (this.params = t.params), t != null && t.timeout && (this.timeout = t.timeout), t != null && t.logger && (this.logger = t.logger), (t != null && t.logLevel || t != null && t.log_level) && (this.logLevel = t.logLevel || t.log_level, this.params = Object.assign(Object.assign({}, this.params), { log_level: this.logLevel })), t != null && t.heartbeatIntervalMs && (this.heartbeatIntervalMs = t.heartbeatIntervalMs);
    const r = (s = t == null ? void 0 : t.params) === null || s === void 0 ? void 0 : s.apikey;
    if (r && (this.accessTokenValue = r, this.apiKey = r), this.reconnectAfterMs = t != null && t.reconnectAfterMs ? t.reconnectAfterMs : (n) => [1e3, 2e3, 5e3, 1e4][n - 1] || 1e4, this.encode = t != null && t.encode ? t.encode : (n, o) => o(JSON.stringify(n)), this.decode = t != null && t.decode ? t.decode : this.serializer.decode.bind(this.serializer), this.reconnectTimer = new bt(async () => {
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
      if (this.transport || (this.transport = ps), !this.transport)
        throw new Error("No transport provided");
      this.conn = new this.transport(this.endpointURL()), this.setupConnection();
    }
  }
  /**
   * Returns the URL of the websocket.
   * @returns string The URL of the websocket.
   */
  endpointURL() {
    return this._appendParams(this.endPoint, Object.assign({}, this.params, { vsn: ys }));
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
      case oe.connecting:
        return J.Connecting;
      case oe.open:
        return J.Open;
      case oe.closing:
        return J.Closing;
      default:
        return J.Closed;
    }
  }
  /**
   * Returns `true` is the connection is open.
   */
  isConnected() {
    return this.connectionState() === J.Open;
  }
  channel(e, t = { config: {} }) {
    const s = `realtime:${e}`, r = this.getChannels().find((n) => n.topic === s);
    if (r)
      return r;
    {
      const n = new Fe(`realtime:${e}`, t, this);
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
        version: vs
      };
      t && s.updateJoinPayload(r), s.joinedOnce && s._isJoined() && s._push(R.access_token, {
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
      this.pendingHeartbeatRef = null, this.log("transport", "heartbeat timeout. Attempting to re-establish connection"), this.heartbeatCallback("timeout"), (e = this.conn) === null || e === void 0 || e.close(ws, "hearbeat timeout");
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
    this.channels.forEach((e) => e._trigger(R.error));
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
      const s = new Blob([Os], { type: "application/javascript" });
      t = URL.createObjectURL(s);
    }
    return t;
  }
}
class ze extends Error {
  constructor(e) {
    super(e), this.__isStorageError = !0, this.name = "StorageError";
  }
}
function T(i) {
  return typeof i == "object" && i !== null && "__isStorageError" in i;
}
class As extends ze {
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
class Ie extends ze {
  constructor(e, t) {
    super(e), this.name = "StorageUnknownError", this.originalError = t;
  }
}
var $s = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const Et = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => se).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, Cs = () => $s(void 0, void 0, void 0, function* () {
  return typeof Response > "u" ? (yield Promise.resolve().then(() => se)).Response : Response;
}), Re = (i) => {
  if (Array.isArray(i))
    return i.map((t) => Re(t));
  if (typeof i == "function" || i !== Object(i))
    return i;
  const e = {};
  return Object.entries(i).forEach(([t, s]) => {
    const r = t.replace(/([-_][a-z])/gi, (n) => n.toUpperCase().replace(/[-_]/g, ""));
    e[r] = Re(s);
  }), e;
}, xs = (i) => {
  if (typeof i != "object" || i === null)
    return !1;
  const e = Object.getPrototypeOf(i);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(Symbol.toStringTag in i) && !(Symbol.iterator in i);
};
var H = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const Ee = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), Is = (i, e, t) => H(void 0, void 0, void 0, function* () {
  const s = yield Cs();
  i instanceof s && !(t != null && t.noResolveJson) ? i.json().then((r) => {
    const n = i.status || 500, o = (r == null ? void 0 : r.statusCode) || n + "";
    e(new As(Ee(r), n, o));
  }).catch((r) => {
    e(new Ie(Ee(r), r));
  }) : e(new Ie(Ee(i), i));
}), Rs = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" || !s ? r : (xs(s) ? (r.headers = Object.assign({ "Content-Type": "application/json" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s)) : r.body = s, Object.assign(Object.assign({}, r), t));
};
function ue(i, e, t, s, r, n) {
  return H(this, void 0, void 0, function* () {
    return new Promise((o, a) => {
      i(t, Rs(e, s, r, n)).then((l) => {
        if (!l.ok)
          throw l;
        return s != null && s.noResolveJson ? l : l.json();
      }).then((l) => o(l)).catch((l) => Is(l, a, s));
    });
  });
}
function ge(i, e, t, s) {
  return H(this, void 0, void 0, function* () {
    return ue(i, "GET", e, t, s);
  });
}
function N(i, e, t, s, r) {
  return H(this, void 0, void 0, function* () {
    return ue(i, "POST", e, s, r, t);
  });
}
function Ue(i, e, t, s, r) {
  return H(this, void 0, void 0, function* () {
    return ue(i, "PUT", e, s, r, t);
  });
}
function Us(i, e, t, s) {
  return H(this, void 0, void 0, function* () {
    return ue(i, "HEAD", e, Object.assign(Object.assign({}, t), { noResolveJson: !0 }), s);
  });
}
function Tt(i, e, t, s, r) {
  return H(this, void 0, void 0, function* () {
    return ue(i, "DELETE", e, s, r, t);
  });
}
var A = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const Ls = {
  limit: 100,
  offset: 0,
  sortBy: {
    column: "name",
    order: "asc"
  }
}, Ze = {
  cacheControl: "3600",
  contentType: "text/plain;charset=UTF-8",
  upsert: !1
};
class Ds {
  constructor(e, t = {}, s, r) {
    this.url = e, this.headers = t, this.bucketId = s, this.fetch = Et(r);
  }
  /**
   * Uploads a file to an existing bucket or replaces an existing file at the specified path with a new one.
   *
   * @param method HTTP method.
   * @param path The relative file path. Should be of the format `folder/subfolder/filename.png`. The bucket must already exist before attempting to upload.
   * @param fileBody The body of the file to be stored in the bucket.
   */
  uploadOrUpdate(e, t, s, r) {
    return A(this, void 0, void 0, function* () {
      try {
        let n;
        const o = Object.assign(Object.assign({}, Ze), r);
        let a = Object.assign(Object.assign({}, this.headers), e === "POST" && { "x-upsert": String(o.upsert) });
        const l = o.metadata;
        typeof Blob < "u" && s instanceof Blob ? (n = new FormData(), n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l)), n.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (n = s, n.append("cacheControl", o.cacheControl), l && n.append("metadata", this.encodeMetadata(l))) : (n = s, a["cache-control"] = `max-age=${o.cacheControl}`, a["content-type"] = o.contentType, l && (a["x-metadata"] = this.toBase64(this.encodeMetadata(l)))), r != null && r.headers && (a = Object.assign(Object.assign({}, a), r.headers));
        const c = this._removeEmptyFolders(t), u = this._getFinalPath(c), h = yield (e == "PUT" ? Ue : N)(this.fetch, `${this.url}/object/${u}`, n, Object.assign({ headers: a }, o != null && o.duplex ? { duplex: o.duplex } : {}));
        return {
          data: { path: c, id: h.Id, fullPath: h.Key },
          error: null
        };
      } catch (n) {
        if (T(n))
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
    return A(this, void 0, void 0, function* () {
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
    return A(this, void 0, void 0, function* () {
      const n = this._removeEmptyFolders(e), o = this._getFinalPath(n), a = new URL(this.url + `/object/upload/sign/${o}`);
      a.searchParams.set("token", t);
      try {
        let l;
        const c = Object.assign({ upsert: Ze.upsert }, r), u = Object.assign(Object.assign({}, this.headers), { "x-upsert": String(c.upsert) });
        typeof Blob < "u" && s instanceof Blob ? (l = new FormData(), l.append("cacheControl", c.cacheControl), l.append("", s)) : typeof FormData < "u" && s instanceof FormData ? (l = s, l.append("cacheControl", c.cacheControl)) : (l = s, u["cache-control"] = `max-age=${c.cacheControl}`, u["content-type"] = c.contentType);
        const h = yield Ue(this.fetch, a.toString(), l, { headers: u });
        return {
          data: { path: n, fullPath: h.Key },
          error: null
        };
      } catch (l) {
        if (T(l))
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
    return A(this, void 0, void 0, function* () {
      try {
        let s = this._getFinalPath(e);
        const r = Object.assign({}, this.headers);
        t != null && t.upsert && (r["x-upsert"] = "true");
        const n = yield N(this.fetch, `${this.url}/object/upload/sign/${s}`, {}, { headers: r }), o = new URL(this.url + n.url), a = o.searchParams.get("token");
        if (!a)
          throw new ze("No token returned by API");
        return { data: { signedUrl: o.toString(), path: e, token: a }, error: null };
      } catch (s) {
        if (T(s))
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
    return A(this, void 0, void 0, function* () {
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
    return A(this, void 0, void 0, function* () {
      try {
        return { data: yield N(this.fetch, `${this.url}/object/move`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers }), error: null };
      } catch (r) {
        if (T(r))
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
    return A(this, void 0, void 0, function* () {
      try {
        return { data: { path: (yield N(this.fetch, `${this.url}/object/copy`, {
          bucketId: this.bucketId,
          sourceKey: e,
          destinationKey: t,
          destinationBucket: s == null ? void 0 : s.destinationBucket
        }, { headers: this.headers })).Key }, error: null };
      } catch (r) {
        if (T(r))
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
    return A(this, void 0, void 0, function* () {
      try {
        let r = this._getFinalPath(e), n = yield N(this.fetch, `${this.url}/object/sign/${r}`, Object.assign({ expiresIn: t }, s != null && s.transform ? { transform: s.transform } : {}), { headers: this.headers });
        const o = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return n = { signedUrl: encodeURI(`${this.url}${n.signedURL}${o}`) }, { data: n, error: null };
      } catch (r) {
        if (T(r))
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
    return A(this, void 0, void 0, function* () {
      try {
        const r = yield N(this.fetch, `${this.url}/object/sign/${this.bucketId}`, { expiresIn: t, paths: e }, { headers: this.headers }), n = s != null && s.download ? `&download=${s.download === !0 ? "" : s.download}` : "";
        return {
          data: r.map((o) => Object.assign(Object.assign({}, o), { signedUrl: o.signedURL ? encodeURI(`${this.url}${o.signedURL}${n}`) : null })),
          error: null
        };
      } catch (r) {
        if (T(r))
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
    return A(this, void 0, void 0, function* () {
      const r = typeof (t == null ? void 0 : t.transform) < "u" ? "render/image/authenticated" : "object", n = this.transformOptsToQueryString((t == null ? void 0 : t.transform) || {}), o = n ? `?${n}` : "";
      try {
        const a = this._getFinalPath(e);
        return { data: yield (yield ge(this.fetch, `${this.url}/${r}/${a}${o}`, {
          headers: this.headers,
          noResolveJson: !0
        })).blob(), error: null };
      } catch (a) {
        if (T(a))
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
    return A(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        const s = yield ge(this.fetch, `${this.url}/object/info/${t}`, {
          headers: this.headers
        });
        return { data: Re(s), error: null };
      } catch (s) {
        if (T(s))
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
    return A(this, void 0, void 0, function* () {
      const t = this._getFinalPath(e);
      try {
        return yield Us(this.fetch, `${this.url}/object/${t}`, {
          headers: this.headers
        }), { data: !0, error: null };
      } catch (s) {
        if (T(s) && s instanceof Ie) {
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
    return A(this, void 0, void 0, function* () {
      try {
        return { data: yield Tt(this.fetch, `${this.url}/object/${this.bucketId}`, { prefixes: e }, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
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
    return A(this, void 0, void 0, function* () {
      try {
        const r = Object.assign(Object.assign(Object.assign({}, Ls), t), { prefix: e || "" });
        return { data: yield N(this.fetch, `${this.url}/object/list/${this.bucketId}`, r, { headers: this.headers }, s), error: null };
      } catch (r) {
        if (T(r))
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
const Ns = "2.10.4", qs = { "X-Client-Info": `storage-js/${Ns}` };
var V = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class Bs {
  constructor(e, t = {}, s, r) {
    const n = new URL(e);
    r != null && r.useNewHostname && /supabase\.(co|in|red)$/.test(n.hostname) && !n.hostname.includes("storage.supabase.") && (n.hostname = n.hostname.replace("supabase.", "storage.supabase.")), this.url = n.href, this.headers = Object.assign(Object.assign({}, qs), t), this.fetch = Et(s);
  }
  /**
   * Retrieves the details of all Storage buckets within an existing project.
   */
  listBuckets() {
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield ge(this.fetch, `${this.url}/bucket`, { headers: this.headers }), error: null };
      } catch (e) {
        if (T(e))
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
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield ge(this.fetch, `${this.url}/bucket/${e}`, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
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
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield N(this.fetch, `${this.url}/bucket`, {
          id: e,
          name: e,
          type: t.type,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (T(s))
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
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield Ue(this.fetch, `${this.url}/bucket/${e}`, {
          id: e,
          name: e,
          public: t.public,
          file_size_limit: t.fileSizeLimit,
          allowed_mime_types: t.allowedMimeTypes
        }, { headers: this.headers }), error: null };
      } catch (s) {
        if (T(s))
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
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield N(this.fetch, `${this.url}/bucket/${e}/empty`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
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
    return V(this, void 0, void 0, function* () {
      try {
        return { data: yield Tt(this.fetch, `${this.url}/bucket/${e}`, {}, { headers: this.headers }), error: null };
      } catch (t) {
        if (T(t))
          return { data: null, error: t };
        throw t;
      }
    });
  }
}
class Ms extends Bs {
  constructor(e, t = {}, s, r) {
    super(e, t, s, r);
  }
  /**
   * Perform file operation in a bucket.
   *
   * @param id The bucket id to operate on.
   */
  from(e) {
    return new Ds(this.url, this.headers, e, this.fetch);
  }
}
const Fs = "2.53.0";
let ne = "";
typeof Deno < "u" ? ne = "deno" : typeof document < "u" ? ne = "web" : typeof navigator < "u" && navigator.product === "ReactNative" ? ne = "react-native" : ne = "node";
const zs = { "X-Client-Info": `supabase-js-${ne}/${Fs}` }, Ks = {
  headers: zs
}, Ws = {
  schema: "public"
}, Js = {
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  flowType: "implicit"
}, Hs = {};
var Vs = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
const Gs = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = ct : e = fetch, (...t) => e(...t);
}, Qs = () => typeof Headers > "u" ? ut : Headers, Xs = (i, e, t) => {
  const s = Gs(t), r = Qs();
  return (n, o) => Vs(void 0, void 0, void 0, function* () {
    var a;
    const l = (a = yield e()) !== null && a !== void 0 ? a : i;
    let c = new r(o == null ? void 0 : o.headers);
    return c.has("apikey") || c.set("apikey", i), c.has("Authorization") || c.set("Authorization", `Bearer ${l}`), s(n, Object.assign(Object.assign({}, o), { headers: c }));
  });
};
var Zs = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
function Ys(i) {
  return i.endsWith("/") ? i : i + "/";
}
function er(i, e) {
  var t, s;
  const { db: r, auth: n, realtime: o, global: a } = i, { db: l, auth: c, realtime: u, global: h } = e, d = {
    db: Object.assign(Object.assign({}, l), r),
    auth: Object.assign(Object.assign({}, c), n),
    realtime: Object.assign(Object.assign({}, u), o),
    storage: {},
    global: Object.assign(Object.assign(Object.assign({}, h), a), { headers: Object.assign(Object.assign({}, (t = h == null ? void 0 : h.headers) !== null && t !== void 0 ? t : {}), (s = a == null ? void 0 : a.headers) !== null && s !== void 0 ? s : {}) }),
    accessToken: () => Zs(this, void 0, void 0, function* () {
      return "";
    })
  };
  return i.accessToken ? d.accessToken = i.accessToken : delete d.accessToken, d;
}
const jt = "2.71.1", Y = 30 * 1e3, Le = 3, Te = Le * Y, tr = "http://localhost:9999", sr = "supabase.auth.token", rr = { "X-Client-Info": `gotrue-js/${jt}` }, De = "X-Supabase-Api-Version", Ot = {
  "2024-01-01": {
    timestamp: Date.parse("2024-01-01T00:00:00.0Z"),
    name: "2024-01-01"
  }
}, ir = /^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i, nr = 10 * 60 * 1e3;
class Ke extends Error {
  constructor(e, t, s) {
    super(e), this.__isAuthError = !0, this.name = "AuthError", this.status = t, this.code = s;
  }
}
function v(i) {
  return typeof i == "object" && i !== null && "__isAuthError" in i;
}
class or extends Ke {
  constructor(e, t, s) {
    super(e, t, s), this.name = "AuthApiError", this.status = t, this.code = s;
  }
}
function ar(i) {
  return v(i) && i.name === "AuthApiError";
}
class Pt extends Ke {
  constructor(e, t) {
    super(e), this.name = "AuthUnknownError", this.originalError = t;
  }
}
class F extends Ke {
  constructor(e, t, s, r) {
    super(e, s, r), this.name = t, this.status = s;
  }
}
class B extends F {
  constructor() {
    super("Auth session missing!", "AuthSessionMissingError", 400, void 0);
  }
}
function lr(i) {
  return v(i) && i.name === "AuthSessionMissingError";
}
class he extends F {
  constructor() {
    super("Auth session or user missing", "AuthInvalidTokenResponseError", 500, void 0);
  }
}
class de extends F {
  constructor(e) {
    super(e, "AuthInvalidCredentialsError", 400, void 0);
  }
}
class fe extends F {
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
function cr(i) {
  return v(i) && i.name === "AuthImplicitGrantRedirectError";
}
class Ye extends F {
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
class Ne extends F {
  constructor(e, t) {
    super(e, "AuthRetryableFetchError", t, void 0);
  }
}
function je(i) {
  return v(i) && i.name === "AuthRetryableFetchError";
}
class et extends F {
  constructor(e, t, s) {
    super(e, "AuthWeakPasswordError", t, "weak_password"), this.reasons = s;
  }
}
class qe extends F {
  constructor(e) {
    super(e, "AuthInvalidJwtError", 400, "invalid_jwt");
  }
}
const pe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""), tt = ` 	
\r=`.split(""), ur = (() => {
  const i = new Array(128);
  for (let e = 0; e < i.length; e += 1)
    i[e] = -1;
  for (let e = 0; e < tt.length; e += 1)
    i[tt[e].charCodeAt(0)] = -2;
  for (let e = 0; e < pe.length; e += 1)
    i[pe[e].charCodeAt(0)] = e;
  return i;
})();
function st(i, e, t) {
  if (i !== null)
    for (e.queue = e.queue << 8 | i, e.queuedBits += 8; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(pe[s]), e.queuedBits -= 6;
    }
  else if (e.queuedBits > 0)
    for (e.queue = e.queue << 6 - e.queuedBits, e.queuedBits = 6; e.queuedBits >= 6; ) {
      const s = e.queue >> e.queuedBits - 6 & 63;
      t(pe[s]), e.queuedBits -= 6;
    }
}
function At(i, e, t) {
  const s = ur[i];
  if (s > -1)
    for (e.queue = e.queue << 6 | s, e.queuedBits += 6; e.queuedBits >= 8; )
      t(e.queue >> e.queuedBits - 8 & 255), e.queuedBits -= 8;
  else {
    if (s === -2)
      return;
    throw new Error(`Invalid Base64-URL character "${String.fromCharCode(i)}"`);
  }
}
function rt(i) {
  const e = [], t = (o) => {
    e.push(String.fromCodePoint(o));
  }, s = {
    utf8seq: 0,
    codepoint: 0
  }, r = { queue: 0, queuedBits: 0 }, n = (o) => {
    fr(o, s, t);
  };
  for (let o = 0; o < i.length; o += 1)
    At(i.charCodeAt(o), r, n);
  return e.join("");
}
function hr(i, e) {
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
function dr(i, e) {
  for (let t = 0; t < i.length; t += 1) {
    let s = i.charCodeAt(t);
    if (s > 55295 && s <= 56319) {
      const r = (s - 55296) * 1024 & 65535;
      s = (i.charCodeAt(t + 1) - 56320 & 65535 | r) + 65536, t += 1;
    }
    hr(s, e);
  }
}
function fr(i, e, t) {
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
function gr(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  for (let r = 0; r < i.length; r += 1)
    At(i.charCodeAt(r), t, s);
  return new Uint8Array(e);
}
function pr(i) {
  const e = [];
  return dr(i, (t) => e.push(t)), new Uint8Array(e);
}
function _r(i) {
  const e = [], t = { queue: 0, queuedBits: 0 }, s = (r) => {
    e.push(r);
  };
  return i.forEach((r) => st(r, t, s)), st(null, t, s), e.join("");
}
function vr(i) {
  return Math.round(Date.now() / 1e3) + i;
}
function yr() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(i) {
    const e = Math.random() * 16 | 0;
    return (i == "x" ? e : e & 3 | 8).toString(16);
  });
}
const I = () => typeof window < "u" && typeof document < "u", z = {
  tested: !1,
  writable: !1
}, $t = () => {
  if (!I())
    return !1;
  try {
    if (typeof globalThis.localStorage != "object")
      return !1;
  } catch {
    return !1;
  }
  if (z.tested)
    return z.writable;
  const i = `lswt-${Math.random()}${Math.random()}`;
  try {
    globalThis.localStorage.setItem(i, i), globalThis.localStorage.removeItem(i), z.tested = !0, z.writable = !0;
  } catch {
    z.tested = !0, z.writable = !1;
  }
  return z.writable;
};
function wr(i) {
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
const Ct = (i) => {
  let e;
  return i ? e = i : typeof fetch > "u" ? e = (...t) => Promise.resolve().then(() => se).then(({ default: s }) => s(...t)) : e = fetch, (...t) => e(...t);
}, mr = (i) => typeof i == "object" && i !== null && "status" in i && "ok" in i && "json" in i && typeof i.json == "function", ee = async (i, e, t) => {
  await i.setItem(e, JSON.stringify(t));
}, K = async (i, e) => {
  const t = await i.getItem(e);
  if (!t)
    return null;
  try {
    return JSON.parse(t);
  } catch {
    return t;
  }
}, q = async (i, e) => {
  await i.removeItem(e);
};
class ke {
  constructor() {
    this.promise = new ke.promiseConstructor((e, t) => {
      this.resolve = e, this.reject = t;
    });
  }
}
ke.promiseConstructor = Promise;
function Oe(i) {
  const e = i.split(".");
  if (e.length !== 3)
    throw new qe("Invalid JWT structure");
  for (let s = 0; s < e.length; s++)
    if (!ir.test(e[s]))
      throw new qe("JWT not in base64url format");
  return {
    // using base64url lib
    header: JSON.parse(rt(e[0])),
    payload: JSON.parse(rt(e[1])),
    signature: gr(e[2]),
    raw: {
      header: e[0],
      payload: e[1]
    }
  };
}
async function br(i) {
  return await new Promise((e) => {
    setTimeout(() => e(null), i);
  });
}
function kr(i, e) {
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
function Sr(i) {
  return ("0" + i.toString(16)).substr(-2);
}
function Er() {
  const e = new Uint32Array(56);
  if (typeof crypto > "u") {
    const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~", s = t.length;
    let r = "";
    for (let n = 0; n < 56; n++)
      r += t.charAt(Math.floor(Math.random() * s));
    return r;
  }
  return crypto.getRandomValues(e), Array.from(e, Sr).join("");
}
async function Tr(i) {
  const t = new TextEncoder().encode(i), s = await crypto.subtle.digest("SHA-256", t), r = new Uint8Array(s);
  return Array.from(r).map((n) => String.fromCharCode(n)).join("");
}
async function jr(i) {
  if (!(typeof crypto < "u" && typeof crypto.subtle < "u" && typeof TextEncoder < "u"))
    return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."), i;
  const t = await Tr(i);
  return btoa(t).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function G(i, e, t = !1) {
  const s = Er();
  let r = s;
  t && (r += "/PASSWORD_RECOVERY"), await ee(i, `${e}-code-verifier`, r);
  const n = await jr(s);
  return [n, s === n ? "plain" : "s256"];
}
const Or = /^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;
function Pr(i) {
  const e = i.headers.get(De);
  if (!e || !e.match(Or))
    return null;
  try {
    return /* @__PURE__ */ new Date(`${e}T00:00:00.0Z`);
  } catch {
    return null;
  }
}
function Ar(i) {
  if (!i)
    throw new Error("Missing exp claim");
  const e = Math.floor(Date.now() / 1e3);
  if (i <= e)
    throw new Error("JWT has expired");
}
function $r(i) {
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
const Cr = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function Q(i) {
  if (!Cr.test(i))
    throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not");
}
function Pe() {
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
function it(i) {
  return JSON.parse(JSON.stringify(i));
}
var xr = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
const W = (i) => i.msg || i.message || i.error_description || i.error || JSON.stringify(i), Ir = [502, 503, 504];
async function nt(i) {
  var e;
  if (!mr(i))
    throw new Ne(W(i), 0);
  if (Ir.includes(i.status))
    throw new Ne(W(i), i.status);
  let t;
  try {
    t = await i.json();
  } catch (n) {
    throw new Pt(W(n), n);
  }
  let s;
  const r = Pr(i);
  if (r && r.getTime() >= Ot["2024-01-01"].timestamp && typeof t == "object" && t && typeof t.code == "string" ? s = t.code : typeof t == "object" && t && typeof t.error_code == "string" && (s = t.error_code), s) {
    if (s === "weak_password")
      throw new et(W(t), i.status, ((e = t.weak_password) === null || e === void 0 ? void 0 : e.reasons) || []);
    if (s === "session_not_found")
      throw new B();
  } else if (typeof t == "object" && t && typeof t.weak_password == "object" && t.weak_password && Array.isArray(t.weak_password.reasons) && t.weak_password.reasons.length && t.weak_password.reasons.reduce((n, o) => n && typeof o == "string", !0))
    throw new et(W(t), i.status, t.weak_password.reasons);
  throw new or(W(t), i.status || 500, s);
}
const Rr = (i, e, t, s) => {
  const r = { method: i, headers: (e == null ? void 0 : e.headers) || {} };
  return i === "GET" ? r : (r.headers = Object.assign({ "Content-Type": "application/json;charset=UTF-8" }, e == null ? void 0 : e.headers), r.body = JSON.stringify(s), Object.assign(Object.assign({}, r), t));
};
async function y(i, e, t, s) {
  var r;
  const n = Object.assign({}, s == null ? void 0 : s.headers);
  n[De] || (n[De] = Ot["2024-01-01"].name), s != null && s.jwt && (n.Authorization = `Bearer ${s.jwt}`);
  const o = (r = s == null ? void 0 : s.query) !== null && r !== void 0 ? r : {};
  s != null && s.redirectTo && (o.redirect_to = s.redirectTo);
  const a = Object.keys(o).length ? "?" + new URLSearchParams(o).toString() : "", l = await Ur(i, e, t + a, {
    headers: n,
    noResolveJson: s == null ? void 0 : s.noResolveJson
  }, {}, s == null ? void 0 : s.body);
  return s != null && s.xform ? s == null ? void 0 : s.xform(l) : { data: Object.assign({}, l), error: null };
}
async function Ur(i, e, t, s, r, n) {
  const o = Rr(e, s, r, n);
  let a;
  try {
    a = await i(t, Object.assign({}, o));
  } catch (l) {
    throw console.error(l), new Ne(W(l), 0);
  }
  if (a.ok || await nt(a), s != null && s.noResolveJson)
    return a;
  try {
    return await a.json();
  } catch (l) {
    await nt(l);
  }
}
function L(i) {
  var e;
  let t = null;
  qr(i) && (t = Object.assign({}, i), i.expires_at || (t.expires_at = vr(i.expires_in)));
  const s = (e = i.user) !== null && e !== void 0 ? e : i;
  return { data: { session: t, user: s }, error: null };
}
function ot(i) {
  const e = L(i);
  return !e.error && i.weak_password && typeof i.weak_password == "object" && Array.isArray(i.weak_password.reasons) && i.weak_password.reasons.length && i.weak_password.message && typeof i.weak_password.message == "string" && i.weak_password.reasons.reduce((t, s) => t && typeof s == "string", !0) && (e.data.weak_password = i.weak_password), e;
}
function M(i) {
  var e;
  return { data: { user: (e = i.user) !== null && e !== void 0 ? e : i }, error: null };
}
function Lr(i) {
  return { data: i, error: null };
}
function Dr(i) {
  const { action_link: e, email_otp: t, hashed_token: s, redirect_to: r, verification_type: n } = i, o = xr(i, ["action_link", "email_otp", "hashed_token", "redirect_to", "verification_type"]), a = {
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
function Nr(i) {
  return i;
}
function qr(i) {
  return i.access_token && i.refresh_token && i.expires_in;
}
const Ae = ["global", "local", "others"];
var Br = function(i, e) {
  var t = {};
  for (var s in i) Object.prototype.hasOwnProperty.call(i, s) && e.indexOf(s) < 0 && (t[s] = i[s]);
  if (i != null && typeof Object.getOwnPropertySymbols == "function")
    for (var r = 0, s = Object.getOwnPropertySymbols(i); r < s.length; r++)
      e.indexOf(s[r]) < 0 && Object.prototype.propertyIsEnumerable.call(i, s[r]) && (t[s[r]] = i[s[r]]);
  return t;
};
class Mr {
  constructor({ url: e = "", headers: t = {}, fetch: s }) {
    this.url = e, this.headers = t, this.fetch = Ct(s), this.mfa = {
      listFactors: this._listFactors.bind(this),
      deleteFactor: this._deleteFactor.bind(this)
    };
  }
  /**
   * Removes a logged-in session.
   * @param jwt A valid, logged-in JWT.
   * @param scope The logout sope.
   */
  async signOut(e, t = Ae[0]) {
    if (Ae.indexOf(t) < 0)
      throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Ae.join(", ")}`);
    try {
      return await y(this.fetch, "POST", `${this.url}/logout?scope=${t}`, {
        headers: this.headers,
        jwt: e,
        noResolveJson: !0
      }), { data: null, error: null };
    } catch (s) {
      if (v(s))
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
      return await y(this.fetch, "POST", `${this.url}/invite`, {
        body: { email: e, data: t.data },
        headers: this.headers,
        redirectTo: t.redirectTo,
        xform: M
      });
    } catch (s) {
      if (v(s))
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
      const { options: t } = e, s = Br(e, ["options"]), r = Object.assign(Object.assign({}, s), t);
      return "newEmail" in s && (r.new_email = s == null ? void 0 : s.newEmail, delete r.newEmail), await y(this.fetch, "POST", `${this.url}/admin/generate_link`, {
        body: r,
        headers: this.headers,
        xform: Dr,
        redirectTo: t == null ? void 0 : t.redirectTo
      });
    } catch (t) {
      if (v(t))
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
      return await y(this.fetch, "POST", `${this.url}/admin/users`, {
        body: e,
        headers: this.headers,
        xform: M
      });
    } catch (t) {
      if (v(t))
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
      const c = { nextPage: null, lastPage: 0, total: 0 }, u = await y(this.fetch, "GET", `${this.url}/admin/users`, {
        headers: this.headers,
        noResolveJson: !0,
        query: {
          page: (s = (t = e == null ? void 0 : e.page) === null || t === void 0 ? void 0 : t.toString()) !== null && s !== void 0 ? s : "",
          per_page: (n = (r = e == null ? void 0 : e.perPage) === null || r === void 0 ? void 0 : r.toString()) !== null && n !== void 0 ? n : ""
        },
        xform: Nr
      });
      if (u.error)
        throw u.error;
      const h = await u.json(), d = (o = u.headers.get("x-total-count")) !== null && o !== void 0 ? o : 0, f = (l = (a = u.headers.get("link")) === null || a === void 0 ? void 0 : a.split(",")) !== null && l !== void 0 ? l : [];
      return f.length > 0 && (f.forEach((p) => {
        const w = parseInt(p.split(";")[0].split("=")[1].substring(0, 1)), _ = JSON.parse(p.split(";")[1].split("=")[1]);
        c[`${_}Page`] = w;
      }), c.total = parseInt(d)), { data: Object.assign(Object.assign({}, h), c), error: null };
    } catch (c) {
      if (v(c))
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
    Q(e);
    try {
      return await y(this.fetch, "GET", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        xform: M
      });
    } catch (t) {
      if (v(t))
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
    Q(e);
    try {
      return await y(this.fetch, "PUT", `${this.url}/admin/users/${e}`, {
        body: t,
        headers: this.headers,
        xform: M
      });
    } catch (s) {
      if (v(s))
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
    Q(e);
    try {
      return await y(this.fetch, "DELETE", `${this.url}/admin/users/${e}`, {
        headers: this.headers,
        body: {
          should_soft_delete: t
        },
        xform: M
      });
    } catch (s) {
      if (v(s))
        return { data: { user: null }, error: s };
      throw s;
    }
  }
  async _listFactors(e) {
    Q(e.userId);
    try {
      const { data: t, error: s } = await y(this.fetch, "GET", `${this.url}/admin/users/${e.userId}/factors`, {
        headers: this.headers,
        xform: (r) => ({ data: { factors: r }, error: null })
      });
      return { data: t, error: s };
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
  async _deleteFactor(e) {
    Q(e.userId), Q(e.id);
    try {
      return { data: await y(this.fetch, "DELETE", `${this.url}/admin/users/${e.userId}/factors/${e.id}`, {
        headers: this.headers
      }), error: null };
    } catch (t) {
      if (v(t))
        return { data: null, error: t };
      throw t;
    }
  }
}
function at(i = {}) {
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
function Fr() {
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
const X = {
  /**
   * @experimental
   */
  debug: !!(globalThis && $t() && globalThis.localStorage && globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug") === "true")
};
class xt extends Error {
  constructor(e) {
    super(e), this.isAcquireTimeout = !0;
  }
}
class zr extends xt {
}
async function Kr(i, e, t) {
  X.debug && console.log("@supabase/gotrue-js: navigatorLock: acquire lock", i, e);
  const s = new globalThis.AbortController();
  return e > 0 && setTimeout(() => {
    s.abort(), X.debug && console.log("@supabase/gotrue-js: navigatorLock acquire timed out", i);
  }, e), await Promise.resolve().then(() => globalThis.navigator.locks.request(i, e === 0 ? {
    mode: "exclusive",
    ifAvailable: !0
  } : {
    mode: "exclusive",
    signal: s.signal
  }, async (r) => {
    if (r) {
      X.debug && console.log("@supabase/gotrue-js: navigatorLock: acquired", i, r.name);
      try {
        return await t();
      } finally {
        X.debug && console.log("@supabase/gotrue-js: navigatorLock: released", i, r.name);
      }
    } else {
      if (e === 0)
        throw X.debug && console.log("@supabase/gotrue-js: navigatorLock: not immediately available", i), new zr(`Acquiring an exclusive Navigator LockManager lock "${i}" immediately failed`);
      if (X.debug)
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
Fr();
const Wr = {
  url: tr,
  storageKey: sr,
  autoRefreshToken: !0,
  persistSession: !0,
  detectSessionInUrl: !0,
  headers: rr,
  flowType: "implicit",
  debug: !1,
  hasCustomAuthorizationHeader: !1
};
async function lt(i, e, t) {
  return await t();
}
const Z = {};
class le {
  /**
   * Create a new client for use in the browser.
   */
  constructor(e) {
    var t, s;
    this.userStorage = null, this.memoryStorage = null, this.stateChangeEmitters = /* @__PURE__ */ new Map(), this.autoRefreshTicker = null, this.visibilityChangedCallback = null, this.refreshingDeferred = null, this.initializePromise = null, this.detectSessionInUrl = !0, this.hasCustomAuthorizationHeader = !1, this.suppressGetSessionWarning = !1, this.lockAcquired = !1, this.pendingInLock = [], this.broadcastChannel = null, this.logger = console.log, this.instanceID = le.nextInstanceID, le.nextInstanceID += 1, this.instanceID > 0 && I() && console.warn("Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.");
    const r = Object.assign(Object.assign({}, Wr), e);
    if (this.logDebugMessages = !!r.debug, typeof r.debug == "function" && (this.logger = r.debug), this.persistSession = r.persistSession, this.storageKey = r.storageKey, this.autoRefreshToken = r.autoRefreshToken, this.admin = new Mr({
      url: r.url,
      headers: r.headers,
      fetch: r.fetch
    }), this.url = r.url, this.headers = r.headers, this.fetch = Ct(r.fetch), this.lock = r.lock || lt, this.detectSessionInUrl = r.detectSessionInUrl, this.flowType = r.flowType, this.hasCustomAuthorizationHeader = r.hasCustomAuthorizationHeader, r.lock ? this.lock = r.lock : I() && (!((t = globalThis == null ? void 0 : globalThis.navigator) === null || t === void 0) && t.locks) ? this.lock = Kr : this.lock = lt, this.jwks || (this.jwks = { keys: [] }, this.jwks_cached_at = Number.MIN_SAFE_INTEGER), this.mfa = {
      verify: this._verify.bind(this),
      enroll: this._enroll.bind(this),
      unenroll: this._unenroll.bind(this),
      challenge: this._challenge.bind(this),
      listFactors: this._listFactors.bind(this),
      challengeAndVerify: this._challengeAndVerify.bind(this),
      getAuthenticatorAssuranceLevel: this._getAuthenticatorAssuranceLevel.bind(this)
    }, this.persistSession ? (r.storage ? this.storage = r.storage : $t() ? this.storage = globalThis.localStorage : (this.memoryStorage = {}, this.storage = at(this.memoryStorage)), r.userStorage && (this.userStorage = r.userStorage)) : (this.memoryStorage = {}, this.storage = at(this.memoryStorage)), I() && globalThis.BroadcastChannel && this.persistSession && this.storageKey) {
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
    return (t = (e = Z[this.storageKey]) === null || e === void 0 ? void 0 : e.jwks) !== null && t !== void 0 ? t : { keys: [] };
  }
  set jwks(e) {
    Z[this.storageKey] = Object.assign(Object.assign({}, Z[this.storageKey]), { jwks: e });
  }
  get jwks_cached_at() {
    var e, t;
    return (t = (e = Z[this.storageKey]) === null || e === void 0 ? void 0 : e.cachedAt) !== null && t !== void 0 ? t : Number.MIN_SAFE_INTEGER;
  }
  set jwks_cached_at(e) {
    Z[this.storageKey] = Object.assign(Object.assign({}, Z[this.storageKey]), { cachedAt: e });
  }
  _debug(...e) {
    return this.logDebugMessages && this.logger(`GoTrueClient@${this.instanceID} (${jt}) ${(/* @__PURE__ */ new Date()).toISOString()}`, ...e), this;
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
      const t = wr(window.location.href);
      let s = "none";
      if (this._isImplicitGrantCallback(t) ? s = "implicit" : await this._isPKCECallback(t) && (s = "pkce"), I() && this.detectSessionInUrl && s !== "none") {
        const { data: r, error: n } = await this._getSessionFromURL(t, s);
        if (n) {
          if (this._debug("#_initialize()", "error detecting session from URL", n), cr(n)) {
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
      return v(t) ? { error: t } : {
        error: new Pt("Unexpected error during initialization", t)
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
      const n = await y(this.fetch, "POST", `${this.url}/signup`, {
        headers: this.headers,
        body: {
          data: (s = (t = e == null ? void 0 : e.options) === null || t === void 0 ? void 0 : t.data) !== null && s !== void 0 ? s : {},
          gotrue_meta_security: { captcha_token: (r = e == null ? void 0 : e.options) === null || r === void 0 ? void 0 : r.captchaToken }
        },
        xform: L
      }), { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (n) {
      if (v(n))
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
        const { email: u, password: h, options: d } = e;
        let f = null, p = null;
        this.flowType === "pkce" && ([f, p] = await G(this.storage, this.storageKey)), n = await y(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          redirectTo: d == null ? void 0 : d.emailRedirectTo,
          body: {
            email: u,
            password: h,
            data: (t = d == null ? void 0 : d.data) !== null && t !== void 0 ? t : {},
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken },
            code_challenge: f,
            code_challenge_method: p
          },
          xform: L
        });
      } else if ("phone" in e) {
        const { phone: u, password: h, options: d } = e;
        n = await y(this.fetch, "POST", `${this.url}/signup`, {
          headers: this.headers,
          body: {
            phone: u,
            password: h,
            data: (s = d == null ? void 0 : d.data) !== null && s !== void 0 ? s : {},
            channel: (r = d == null ? void 0 : d.channel) !== null && r !== void 0 ? r : "sms",
            gotrue_meta_security: { captcha_token: d == null ? void 0 : d.captchaToken }
          },
          xform: L
        });
      } else
        throw new de("You must provide either an email or phone number and a password");
      const { data: o, error: a } = n;
      if (a || !o)
        return { data: { user: null, session: null }, error: a };
      const l = o.session, c = o.user;
      return o.session && (await this._saveSession(o.session), await this._notifyAllSubscribers("SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (n) {
      if (v(n))
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
        t = await y(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            email: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: ot
        });
      } else if ("phone" in e) {
        const { phone: n, password: o, options: a } = e;
        t = await y(this.fetch, "POST", `${this.url}/token?grant_type=password`, {
          headers: this.headers,
          body: {
            phone: n,
            password: o,
            gotrue_meta_security: { captcha_token: a == null ? void 0 : a.captchaToken }
          },
          xform: ot
        });
      } else
        throw new de("You must provide either an email or phone number and a password");
      const { data: s, error: r } = t;
      return r ? { data: { user: null, session: null }, error: r } : !s || !s.session || !s.user ? { data: { user: null, session: null }, error: new he() } : (s.session && (await this._saveSession(s.session), await this._notifyAllSubscribers("SIGNED_IN", s.session)), {
        data: Object.assign({ user: s.user, session: s.session }, s.weak_password ? { weakPassword: s.weak_password } : null),
        error: r
      });
    } catch (t) {
      if (v(t))
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
    var t, s, r, n, o, a, l, c, u, h, d, f;
    let p, w;
    if ("message" in e)
      p = e.message, w = e.signature;
    else {
      const { chain: _, wallet: k, statement: P, options: g } = e;
      let m;
      if (I())
        if (typeof k == "object")
          m = k;
        else {
          const E = window;
          if ("solana" in E && typeof E.solana == "object" && ("signIn" in E.solana && typeof E.solana.signIn == "function" || "signMessage" in E.solana && typeof E.solana.signMessage == "function"))
            m = E.solana;
          else
            throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.");
        }
      else {
        if (typeof k != "object" || !(g != null && g.url))
          throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");
        m = k;
      }
      const j = new URL((t = g == null ? void 0 : g.url) !== null && t !== void 0 ? t : window.location.href);
      if ("signIn" in m && m.signIn) {
        const E = await m.signIn(Object.assign(Object.assign(Object.assign({ issuedAt: (/* @__PURE__ */ new Date()).toISOString() }, g == null ? void 0 : g.signInWithSolana), {
          // non-overridable properties
          version: "1",
          domain: j.host,
          uri: j.href
        }), P ? { statement: P } : null));
        let C;
        if (Array.isArray(E) && E[0] && typeof E[0] == "object")
          C = E[0];
        else if (E && typeof E == "object" && "signedMessage" in E && "signature" in E)
          C = E;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");
        if ("signedMessage" in C && "signature" in C && (typeof C.signedMessage == "string" || C.signedMessage instanceof Uint8Array) && C.signature instanceof Uint8Array)
          p = typeof C.signedMessage == "string" ? C.signedMessage : new TextDecoder().decode(C.signedMessage), w = C.signature;
        else
          throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields");
      } else {
        if (!("signMessage" in m) || typeof m.signMessage != "function" || !("publicKey" in m) || typeof m != "object" || !m.publicKey || !("toBase58" in m.publicKey) || typeof m.publicKey.toBase58 != "function")
          throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");
        p = [
          `${j.host} wants you to sign in with your Solana account:`,
          m.publicKey.toBase58(),
          ...P ? ["", P, ""] : [""],
          "Version: 1",
          `URI: ${j.href}`,
          `Issued At: ${(r = (s = g == null ? void 0 : g.signInWithSolana) === null || s === void 0 ? void 0 : s.issuedAt) !== null && r !== void 0 ? r : (/* @__PURE__ */ new Date()).toISOString()}`,
          ...!((n = g == null ? void 0 : g.signInWithSolana) === null || n === void 0) && n.notBefore ? [`Not Before: ${g.signInWithSolana.notBefore}`] : [],
          ...!((o = g == null ? void 0 : g.signInWithSolana) === null || o === void 0) && o.expirationTime ? [`Expiration Time: ${g.signInWithSolana.expirationTime}`] : [],
          ...!((a = g == null ? void 0 : g.signInWithSolana) === null || a === void 0) && a.chainId ? [`Chain ID: ${g.signInWithSolana.chainId}`] : [],
          ...!((l = g == null ? void 0 : g.signInWithSolana) === null || l === void 0) && l.nonce ? [`Nonce: ${g.signInWithSolana.nonce}`] : [],
          ...!((c = g == null ? void 0 : g.signInWithSolana) === null || c === void 0) && c.requestId ? [`Request ID: ${g.signInWithSolana.requestId}`] : [],
          ...!((h = (u = g == null ? void 0 : g.signInWithSolana) === null || u === void 0 ? void 0 : u.resources) === null || h === void 0) && h.length ? [
            "Resources",
            ...g.signInWithSolana.resources.map((C) => `- ${C}`)
          ] : []
        ].join(`
`);
        const E = await m.signMessage(new TextEncoder().encode(p), "utf8");
        if (!E || !(E instanceof Uint8Array))
          throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");
        w = E;
      }
    }
    try {
      const { data: _, error: k } = await y(this.fetch, "POST", `${this.url}/token?grant_type=web3`, {
        headers: this.headers,
        body: Object.assign({ chain: "solana", message: p, signature: _r(w) }, !((d = e.options) === null || d === void 0) && d.captchaToken ? { gotrue_meta_security: { captcha_token: (f = e.options) === null || f === void 0 ? void 0 : f.captchaToken } } : null),
        xform: L
      });
      if (k)
        throw k;
      return !_ || !_.session || !_.user ? {
        data: { user: null, session: null },
        error: new he()
      } : (_.session && (await this._saveSession(_.session), await this._notifyAllSubscribers("SIGNED_IN", _.session)), { data: Object.assign({}, _), error: k });
    } catch (_) {
      if (v(_))
        return { data: { user: null, session: null }, error: _ };
      throw _;
    }
  }
  async _exchangeCodeForSession(e) {
    const t = await K(this.storage, `${this.storageKey}-code-verifier`), [s, r] = (t ?? "").split("/");
    try {
      const { data: n, error: o } = await y(this.fetch, "POST", `${this.url}/token?grant_type=pkce`, {
        headers: this.headers,
        body: {
          auth_code: e,
          code_verifier: s
        },
        xform: L
      });
      if (await q(this.storage, `${this.storageKey}-code-verifier`), o)
        throw o;
      return !n || !n.session || !n.user ? {
        data: { user: null, session: null, redirectType: null },
        error: new he()
      } : (n.session && (await this._saveSession(n.session), await this._notifyAllSubscribers("SIGNED_IN", n.session)), { data: Object.assign(Object.assign({}, n), { redirectType: r ?? null }), error: o });
    } catch (n) {
      if (v(n))
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
      const { options: t, provider: s, token: r, access_token: n, nonce: o } = e, a = await y(this.fetch, "POST", `${this.url}/token?grant_type=id_token`, {
        headers: this.headers,
        body: {
          provider: s,
          id_token: r,
          access_token: n,
          nonce: o,
          gotrue_meta_security: { captcha_token: t == null ? void 0 : t.captchaToken }
        },
        xform: L
      }), { data: l, error: c } = a;
      return c ? { data: { user: null, session: null }, error: c } : !l || !l.session || !l.user ? {
        data: { user: null, session: null },
        error: new he()
      } : (l.session && (await this._saveSession(l.session), await this._notifyAllSubscribers("SIGNED_IN", l.session)), { data: l, error: c });
    } catch (t) {
      if (v(t))
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
        this.flowType === "pkce" && ([c, u] = await G(this.storage, this.storageKey));
        const { error: h } = await y(this.fetch, "POST", `${this.url}/otp`, {
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
        return { data: { user: null, session: null }, error: h };
      }
      if ("phone" in e) {
        const { phone: a, options: l } = e, { data: c, error: u } = await y(this.fetch, "POST", `${this.url}/otp`, {
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
      throw new de("You must provide either an email or phone number.");
    } catch (a) {
      if (v(a))
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
      const { data: o, error: a } = await y(this.fetch, "POST", `${this.url}/verify`, {
        headers: this.headers,
        body: Object.assign(Object.assign({}, e), { gotrue_meta_security: { captcha_token: n } }),
        redirectTo: r,
        xform: L
      });
      if (a)
        throw a;
      if (!o)
        throw new Error("An error occurred on token verification.");
      const l = o.session, c = o.user;
      return l != null && l.access_token && (await this._saveSession(l), await this._notifyAllSubscribers(e.type == "recovery" ? "PASSWORD_RECOVERY" : "SIGNED_IN", l)), { data: { user: c, session: l }, error: null };
    } catch (r) {
      if (v(r))
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
      return this.flowType === "pkce" && ([n, o] = await G(this.storage, this.storageKey)), await y(this.fetch, "POST", `${this.url}/sso`, {
        body: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, "providerId" in e ? { provider_id: e.providerId } : null), "domain" in e ? { domain: e.domain } : null), { redirect_to: (s = (t = e.options) === null || t === void 0 ? void 0 : t.redirectTo) !== null && s !== void 0 ? s : void 0 }), !((r = e == null ? void 0 : e.options) === null || r === void 0) && r.captchaToken ? { gotrue_meta_security: { captcha_token: e.options.captchaToken } } : null), { skip_http_redirect: !0, code_challenge: n, code_challenge_method: o }),
        headers: this.headers,
        xform: Lr
      });
    } catch (n) {
      if (v(n))
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
          throw new B();
        const { error: r } = await y(this.fetch, "GET", `${this.url}/reauthenticate`, {
          headers: this.headers,
          jwt: t.access_token
        });
        return { data: { user: null, session: null }, error: r };
      });
    } catch (e) {
      if (v(e))
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
        const { email: s, type: r, options: n } = e, { error: o } = await y(this.fetch, "POST", t, {
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
        const { phone: s, type: r, options: n } = e, { data: o, error: a } = await y(this.fetch, "POST", t, {
          headers: this.headers,
          body: {
            phone: s,
            type: r,
            gotrue_meta_security: { captcha_token: n == null ? void 0 : n.captchaToken }
          }
        });
        return { data: { user: null, session: null, messageId: o == null ? void 0 : o.message_id }, error: a };
      }
      throw new de("You must provide either an email or phone number and a type");
    } catch (t) {
      if (v(t))
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
      const s = e.expires_at ? e.expires_at * 1e3 - Date.now() < Te : !1;
      if (this._debug("#__loadSession()", `session has${s ? "" : " not"} expired`, "expires_at", e.expires_at), !s) {
        if (this.userStorage) {
          const o = await K(this.userStorage, this.storageKey + "-user");
          o != null && o.user ? e.user = o.user : e.user = Pe();
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
      return e ? await y(this.fetch, "GET", `${this.url}/user`, {
        headers: this.headers,
        jwt: e,
        xform: M
      }) : await this._useSession(async (t) => {
        var s, r, n;
        const { data: o, error: a } = t;
        if (a)
          throw a;
        return !(!((s = o.session) === null || s === void 0) && s.access_token) && !this.hasCustomAuthorizationHeader ? { data: { user: null }, error: new B() } : await y(this.fetch, "GET", `${this.url}/user`, {
          headers: this.headers,
          jwt: (n = (r = o.session) === null || r === void 0 ? void 0 : r.access_token) !== null && n !== void 0 ? n : void 0,
          xform: M
        });
      });
    } catch (t) {
      if (v(t))
        return lr(t) && (await this._removeSession(), await q(this.storage, `${this.storageKey}-code-verifier`)), { data: { user: null }, error: t };
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
          throw new B();
        const o = r.session;
        let a = null, l = null;
        this.flowType === "pkce" && e.email != null && ([a, l] = await G(this.storage, this.storageKey));
        const { data: c, error: u } = await y(this.fetch, "PUT", `${this.url}/user`, {
          headers: this.headers,
          redirectTo: t == null ? void 0 : t.emailRedirectTo,
          body: Object.assign(Object.assign({}, e), { code_challenge: a, code_challenge_method: l }),
          jwt: o.access_token,
          xform: M
        });
        if (u)
          throw u;
        return o.user = c.user, await this._saveSession(o), await this._notifyAllSubscribers("USER_UPDATED", o), { data: { user: o.user }, error: null };
      });
    } catch (s) {
      if (v(s))
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
        throw new B();
      const t = Date.now() / 1e3;
      let s = t, r = !0, n = null;
      const { payload: o } = Oe(e.access_token);
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
      if (v(t))
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
          throw new B();
        const { session: r, error: n } = await this._callRefreshToken(e.refresh_token);
        return n ? { data: { user: null, session: null }, error: n } : r ? { data: { user: r.user, session: r }, error: null } : { data: { user: null, session: null }, error: null };
      });
    } catch (t) {
      if (v(t))
        return { data: { user: null, session: null }, error: t };
      throw t;
    }
  }
  /**
   * Gets the session data from a URL string
   */
  async _getSessionFromURL(e, t) {
    try {
      if (!I())
        throw new fe("No browser detected.");
      if (e.error || e.error_description || e.error_code)
        throw new fe(e.error_description || "Error in URL with unspecified error_description", {
          error: e.error || "unspecified_error",
          code: e.error_code || "unspecified_code"
        });
      switch (t) {
        case "implicit":
          if (this.flowType === "pkce")
            throw new Ye("Not a valid PKCE flow url.");
          break;
        case "pkce":
          if (this.flowType === "implicit")
            throw new fe("Not a valid implicit grant flow url.");
          break;
        default:
      }
      if (t === "pkce") {
        if (this._debug("#_initialize()", "begin", "is PKCE flow", !0), !e.code)
          throw new Ye("No code detected.");
        const { data: P, error: g } = await this._exchangeCodeForSession(e.code);
        if (g)
          throw g;
        const m = new URL(window.location.href);
        return m.searchParams.delete("code"), window.history.replaceState(window.history.state, "", m.toString()), { data: { session: P.session, redirectType: null }, error: null };
      }
      const { provider_token: s, provider_refresh_token: r, access_token: n, refresh_token: o, expires_in: a, expires_at: l, token_type: c } = e;
      if (!n || !a || !o || !c)
        throw new fe("No session defined in URL");
      const u = Math.round(Date.now() / 1e3), h = parseInt(a);
      let d = u + h;
      l && (d = parseInt(l));
      const f = d - u;
      f * 1e3 <= Y && console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${h}s`);
      const p = d - h;
      u - p >= 120 ? console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale", p, d, u) : u - p < 0 && console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew", p, d, u);
      const { data: w, error: _ } = await this._getUser(n);
      if (_)
        throw _;
      const k = {
        provider_token: s,
        provider_refresh_token: r,
        access_token: n,
        expires_in: h,
        expires_at: d,
        refresh_token: o,
        token_type: c,
        user: w.user
      };
      return window.location.hash = "", this._debug("#_getSessionFromURL()", "clearing window.location.hash"), { data: { session: k, redirectType: e.type }, error: null };
    } catch (s) {
      if (v(s))
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
      const { data: r, error: n } = t;
      if (n)
        return { error: n };
      const o = (s = r.session) === null || s === void 0 ? void 0 : s.access_token;
      if (o) {
        const { error: a } = await this.admin.signOut(o, e);
        if (a && !(ar(a) && (a.status === 404 || a.status === 401 || a.status === 403)))
          return { error: a };
      }
      return e !== "others" && (await this._removeSession(), await q(this.storage, `${this.storageKey}-code-verifier`)), { error: null };
    });
  }
  /**
   * Receive a notification every time an auth event happens.
   * @param callback A callback function to be invoked when an auth event happens.
   */
  onAuthStateChange(e) {
    const t = yr(), s = {
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
    this.flowType === "pkce" && ([s, r] = await G(
      this.storage,
      this.storageKey,
      !0
      // isPasswordRecovery
    ));
    try {
      return await y(this.fetch, "POST", `${this.url}/recover`, {
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
      if (v(n))
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
      if (v(t))
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
        const { data: h, error: d } = n;
        if (d)
          throw d;
        const f = await this._getUrlForProvider(`${this.url}/user/identities/authorize`, e.provider, {
          redirectTo: (o = e.options) === null || o === void 0 ? void 0 : o.redirectTo,
          scopes: (a = e.options) === null || a === void 0 ? void 0 : a.scopes,
          queryParams: (l = e.options) === null || l === void 0 ? void 0 : l.queryParams,
          skipBrowserRedirect: !0
        });
        return await y(this.fetch, "GET", f, {
          headers: this.headers,
          jwt: (u = (c = h.session) === null || c === void 0 ? void 0 : c.access_token) !== null && u !== void 0 ? u : void 0
        });
      });
      if (r)
        throw r;
      return I() && !(!((t = e.options) === null || t === void 0) && t.skipBrowserRedirect) && window.location.assign(s == null ? void 0 : s.url), { data: { provider: e.provider, url: s == null ? void 0 : s.url }, error: null };
    } catch (s) {
      if (v(s))
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
        return await y(this.fetch, "DELETE", `${this.url}/user/identities/${e.identity_id}`, {
          headers: this.headers,
          jwt: (r = (s = n.session) === null || s === void 0 ? void 0 : s.access_token) !== null && r !== void 0 ? r : void 0
        });
      });
    } catch (t) {
      if (v(t))
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
      return await kr(async (r) => (r > 0 && await br(200 * Math.pow(2, r - 1)), this._debug(t, "refreshing attempt", r), await y(this.fetch, "POST", `${this.url}/token?grant_type=refresh_token`, {
        body: { refresh_token: e },
        headers: this.headers,
        xform: L
      })), (r, n) => {
        const o = 200 * Math.pow(2, r);
        return n && je(n) && // retryable only if the request can be sent before the backoff overflows the tick duration
        Date.now() + o - s < Y;
      });
    } catch (s) {
      if (this._debug(t, "error", s), v(s))
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
    return this._debug("#_handleProviderSignIn()", "provider", e, "options", t, "url", s), I() && !t.skipBrowserRedirect && window.location.assign(s), { data: { provider: e, url: s }, error: null };
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
        !this.storage.isServer && Object.is(this.storage, this.userStorage) && !o && (o = { user: r.user }, await ee(this.userStorage, this.storageKey + "-user", o)), r.user = (e = o == null ? void 0 : o.user) !== null && e !== void 0 ? e : Pe();
      } else if (r && !r.user && !r.user) {
        const o = await K(this.storage, this.storageKey + "-user");
        o && (o != null && o.user) ? (r.user = o.user, await q(this.storage, this.storageKey + "-user"), await ee(this.storage, this.storageKey, r)) : r.user = Pe();
      }
      if (this._debug(s, "session from storage", r), !this._isValidSession(r)) {
        this._debug(s, "session is not valid"), r !== null && await this._removeSession();
        return;
      }
      const n = ((t = r.expires_at) !== null && t !== void 0 ? t : 1 / 0) * 1e3 - Date.now() < Te;
      if (this._debug(s, `session has${n ? "" : " not"} expired with margin of ${Te}s`), n) {
        if (this.autoRefreshToken && r.refresh_token) {
          const { error: o } = await this._callRefreshToken(r.refresh_token);
          o && (console.error(o), je(o) || (this._debug(s, "refresh failed with a non-retryable error, removing the session", o), await this._removeSession()));
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
      throw new B();
    if (this.refreshingDeferred)
      return this.refreshingDeferred.promise;
    const r = `#_callRefreshToken(${e.substring(0, 5)}...)`;
    this._debug(r, "begin");
    try {
      this.refreshingDeferred = new ke();
      const { data: n, error: o } = await this._refreshAccessToken(e);
      if (o)
        throw o;
      if (!n.session)
        throw new B();
      await this._saveSession(n.session), await this._notifyAllSubscribers("TOKEN_REFRESHED", n.session);
      const a = { session: n.session, error: null };
      return this.refreshingDeferred.resolve(a), a;
    } catch (n) {
      if (this._debug(r, "error", n), v(n)) {
        const o = { session: null, error: n };
        return je(n) || await this._removeSession(), (t = this.refreshingDeferred) === null || t === void 0 || t.resolve(o), o;
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
      !s && t.user && await ee(this.userStorage, this.storageKey + "-user", {
        user: t.user
      });
      const r = Object.assign({}, t);
      delete r.user;
      const n = it(r);
      await ee(this.storage, this.storageKey, n);
    } else {
      const r = it(t);
      await ee(this.storage, this.storageKey, r);
    }
  }
  async _removeSession() {
    this._debug("#_removeSession()"), await q(this.storage, this.storageKey), await q(this.storage, this.storageKey + "-code-verifier"), await q(this.storage, this.storageKey + "-user"), this.userStorage && await q(this.userStorage, this.storageKey + "-user"), await this._notifyAllSubscribers("SIGNED_OUT", null);
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
      e && I() && (window != null && window.removeEventListener) && window.removeEventListener("visibilitychange", e);
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
    const e = setInterval(() => this._autoRefreshTokenTick(), Y);
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
              const r = Math.floor((s.expires_at * 1e3 - e) / Y);
              this._debug("#_autoRefreshTokenTick()", `access token expires in ${r} ticks, a tick lasts ${Y}ms, refresh threshold is ${Le} ticks`), r <= Le && await this._callRefreshToken(s.refresh_token);
            });
          } catch (t) {
            console.error("Auto refresh tick failed with error. This is likely a transient error.", t);
          }
        } finally {
          this._debug("#_autoRefreshTokenTick()", "end");
        }
      });
    } catch (e) {
      if (e.isAcquireTimeout || e instanceof xt)
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
    if (this._debug("#_handleVisibilityChange()"), !I() || !(window != null && window.addEventListener))
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
      const [n, o] = await G(this.storage, this.storageKey), a = new URLSearchParams({
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
        return n ? { data: null, error: n } : await y(this.fetch, "DELETE", `${this.url}/factors/${e.factorId}`, {
          headers: this.headers,
          jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
        });
      });
    } catch (t) {
      if (v(t))
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
        const a = Object.assign({ friendly_name: e.friendlyName, factor_type: e.factorType }, e.factorType === "phone" ? { phone: e.phone } : { issuer: e.issuer }), { data: l, error: c } = await y(this.fetch, "POST", `${this.url}/factors`, {
          body: a,
          headers: this.headers,
          jwt: (s = n == null ? void 0 : n.session) === null || s === void 0 ? void 0 : s.access_token
        });
        return c ? { data: null, error: c } : (e.factorType === "totp" && (!((r = l == null ? void 0 : l.totp) === null || r === void 0) && r.qr_code) && (l.totp.qr_code = `data:image/svg+xml;utf-8,${l.totp.qr_code}`), { data: l, error: null });
      });
    } catch (t) {
      if (v(t))
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
          const { data: o, error: a } = await y(this.fetch, "POST", `${this.url}/factors/${e.factorId}/verify`, {
            body: { code: e.code, challenge_id: e.challengeId },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
          });
          return a ? { data: null, error: a } : (await this._saveSession(Object.assign({ expires_at: Math.round(Date.now() / 1e3) + o.expires_in }, o)), await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED", o), { data: o, error: a });
        });
      } catch (t) {
        if (v(t))
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
          return n ? { data: null, error: n } : await y(this.fetch, "POST", `${this.url}/factors/${e.factorId}/challenge`, {
            body: { channel: e.channel },
            headers: this.headers,
            jwt: (s = r == null ? void 0 : r.session) === null || s === void 0 ? void 0 : s.access_token
          });
        });
      } catch (t) {
        if (v(t))
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
      const { payload: o } = Oe(r.access_token);
      let a = null;
      o.aal && (a = o.aal);
      let l = a;
      ((s = (t = r.user.factors) === null || t === void 0 ? void 0 : t.filter((h) => h.status === "verified")) !== null && s !== void 0 ? s : []).length > 0 && (l = "aal2");
      const u = o.amr || [];
      return { data: { currentLevel: a, nextLevel: l, currentAuthenticationMethods: u }, error: null };
    }));
  }
  async fetchJwk(e, t = { keys: [] }) {
    let s = t.keys.find((a) => a.kid === e);
    if (s)
      return s;
    const r = Date.now();
    if (s = this.jwks.keys.find((a) => a.kid === e), s && this.jwks_cached_at + nr > r)
      return s;
    const { data: n, error: o } = await y(this.fetch, "GET", `${this.url}/.well-known/jwks.json`, {
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
      const { header: r, payload: n, signature: o, raw: { header: a, payload: l } } = Oe(s);
      t != null && t.allowExpired || Ar(n.exp);
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
      const u = $r(r.alg), h = await crypto.subtle.importKey("jwk", c, u, !0, [
        "verify"
      ]);
      if (!await crypto.subtle.verify(u, h, o, pr(`${a}.${l}`)))
        throw new qe("Invalid JWT signature");
      return {
        data: {
          claims: n,
          header: r,
          signature: o
        },
        error: null
      };
    } catch (s) {
      if (v(s))
        return { data: null, error: s };
      throw s;
    }
  }
}
le.nextInstanceID = 0;
const Jr = le;
class Hr extends Jr {
  constructor(e) {
    super(e);
  }
}
var Vr = function(i, e, t, s) {
  function r(n) {
    return n instanceof t ? n : new t(function(o) {
      o(n);
    });
  }
  return new (t || (t = Promise))(function(n, o) {
    function a(u) {
      try {
        c(s.next(u));
      } catch (h) {
        o(h);
      }
    }
    function l(u) {
      try {
        c(s.throw(u));
      } catch (h) {
        o(h);
      }
    }
    function c(u) {
      u.done ? n(u.value) : r(u.value).then(a, l);
    }
    c((s = s.apply(i, e || [])).next());
  });
};
class Gr {
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
    const a = Ys(e), l = new URL(a);
    this.realtimeUrl = new URL("realtime/v1", l), this.realtimeUrl.protocol = this.realtimeUrl.protocol.replace("http", "ws"), this.authUrl = new URL("auth/v1", l), this.storageUrl = new URL("storage/v1", l), this.functionsUrl = new URL("functions/v1", l);
    const c = `sb-${l.hostname.split(".")[0]}-auth-token`, u = {
      db: Ws,
      realtime: Hs,
      auth: Object.assign(Object.assign({}, Js), { storageKey: c }),
      global: Ks
    }, h = er(s ?? {}, u);
    this.storageKey = (r = h.auth.storageKey) !== null && r !== void 0 ? r : "", this.headers = (n = h.global.headers) !== null && n !== void 0 ? n : {}, h.accessToken ? (this.accessToken = h.accessToken, this.auth = new Proxy({}, {
      get: (d, f) => {
        throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(f)} is not possible`);
      }
    })) : this.auth = this._initSupabaseAuthClient((o = h.auth) !== null && o !== void 0 ? o : {}, this.headers, h.global.fetch), this.fetch = Xs(t, this._getAccessToken.bind(this), h.global.fetch), this.realtime = this._initRealtimeClient(Object.assign({ headers: this.headers, accessToken: this._getAccessToken.bind(this) }, h.realtime)), this.rest = new fs(new URL("rest/v1", l).href, {
      headers: this.headers,
      schema: h.db.schema,
      fetch: this.fetch
    }), this.storage = new Ms(this.storageUrl.href, this.headers, this.fetch, s == null ? void 0 : s.storage), h.accessToken || this._listenForAuthEvents();
  }
  /**
   * Supabase Functions allows you to deploy and invoke edge functions.
   */
  get functions() {
    return new Ft(this.functionsUrl.href, {
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
    return Vr(this, void 0, void 0, function* () {
      if (this.accessToken)
        return yield this.accessToken();
      const { data: s } = yield this.auth.getSession();
      return (t = (e = s.session) === null || e === void 0 ? void 0 : e.access_token) !== null && t !== void 0 ? t : null;
    });
  }
  _initSupabaseAuthClient({ autoRefreshToken: e, persistSession: t, detectSessionInUrl: s, storage: r, storageKey: n, flowType: o, lock: a, debug: l }, c, u) {
    const h = {
      Authorization: `Bearer ${this.supabaseKey}`,
      apikey: `${this.supabaseKey}`
    };
    return new Hr({
      url: this.authUrl.href,
      headers: Object.assign(Object.assign({}, h), c),
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
    return new Ps(this.realtimeUrl.href, Object.assign(Object.assign({}, e), { params: Object.assign({ apikey: this.supabaseKey }, e == null ? void 0 : e.params) }));
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
const Qr = (i, e, t) => new Gr(i, e, t);
function Xr() {
  if (typeof window < "u" || typeof process > "u" || process.version === void 0 || process.version === null)
    return !1;
  const i = process.version.match(/^v(\d+)\./);
  return i ? parseInt(i[1], 10) <= 18 : !1;
}
Xr() && console.warn("⚠️  Node.js 18 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 20 or later. For more information, visit: https://github.com/orgs/supabase/discussions/37217");
class Zr {
  constructor(e, t) {
    S(this, "client");
    const s = e || "https://yoflhmaayrceswiwvxba.supabase.co", r = t || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = Qr(s, r);
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
      const { data: t, error: s } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: e
        }
      );
      return s ? (console.error(
        "Error calling cart-checkout-session function:",
        s
      ), null) : t;
    } catch (t) {
      return console.error(
        "Error calling cart-checkout-session function:",
        t
      ), null;
    }
  }
}
class Yr {
  constructor(e) {
    S(this, "options");
    S(this, "supabaseService");
    S(this, "inputDetector");
    S(this, "productDetector");
    S(this, "totalExtractor");
    S(this, "_sessionId");
    S(this, "isInitialized", !1);
    S(this, "previousContent", {});
    S(this, "previousProducts", []);
    S(this, "previousTotal", 0);
    this.options = e, this.supabaseService = new Zr(
      e.supabaseUrl,
      e.supabaseAnonKey
    );
  }
  async initialize() {
    if (this.isInitialized)
      return !0;
    try {
      const e = await this.supabaseService.getCheckoutCampaign(
        this.options.checkoutCampaignId
      );
      return e ? (this.inputDetector = new Lt(e.input_mapping), this.productDetector = new Dt(
        e.product_mapping
      ), this.totalExtractor = new Nt(e.total_selector), this.inputDetector.setOnContentUpdate(
        this.handleContentUpdate.bind(this)
      ), this.inputDetector.startListening(), this.isInitialized = !0, console.log("Abandoned cart tool initialized successfully"), !0) : (console.error("Failed to fetch checkout campaign data"), !1);
    } catch (e) {
      return console.error("Failed to initialize abandoned cart tool:", e), !1;
    }
  }
  async handleContentUpdate(e, t) {
    var s, r, n;
    try {
      const o = ((s = this.productDetector) == null ? void 0 : s.detectProducts()) || [], a = ((r = this.totalExtractor) == null ? void 0 : r.extractTotal()) || 0;
      if (!this.hasContentChanged(
        e,
        o,
        a
      )) {
        console.log("Content unchanged, skipping upload");
        return;
      }
      const c = typeof window < "u" ? window.location.href : "", u = {
        organization_id: this.options.organizationId,
        checkout_campaign_id: this.options.checkoutCampaignId,
        content: e,
        products: o,
        url: c,
        total: a,
        id: t
      }, h = await this.supabaseService.submitCartSession(
        u
      );
      h && h.id ? (this._sessionId = h.id, (n = this.inputDetector) == null || n.setSessionId(h.id), this.previousContent = { ...e }, this.previousProducts = [...o], this.previousTotal = a, console.log("Cart session updated successfully:", h.id)) : console.error("Failed to submit cart session");
    } catch (o) {
      console.error("Error handling content update:", o);
    }
  }
  hasContentChanged(e, t, s) {
    if (Object.keys(this.previousContent).length === 0 && this.previousProducts.length === 0 && this.previousTotal === 0)
      return !0;
    const r = JSON.stringify(e) !== JSON.stringify(this.previousContent), n = JSON.stringify(t) !== JSON.stringify(this.previousProducts), o = s !== this.previousTotal;
    return r || n || o;
  }
  destroy() {
    this.inputDetector && this.inputDetector.stopListening(), this.isInitialized = !1, this._sessionId = void 0;
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
}
class ei {
  constructor(e) {
    S(this, "options");
    S(this, "tools", /* @__PURE__ */ new Map());
    S(this, "_isInitialized", !1);
    this.options = e;
  }
  async initialize() {
    var e;
    if (this._isInitialized)
      return !0;
    try {
      if ((e = this.options.features) != null && e.abandonedCart) {
        const t = new Yr(this.options);
        await t.initialize(), this.tools.set("abandonedCart", t);
      }
      return this._isInitialized = !0, console.log("EkteIntelligens SDK initialized successfully"), !0;
    } catch (t) {
      return console.error("Failed to initialize EkteIntelligens SDK:", t), !1;
    }
  }
  // Public API methods
  getAbandonedCartTool() {
    return this.tools.get("abandonedCart");
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
typeof window < "u" && (window.EkteIntelligensSDK = ei);
export {
  ei as EkteIntelligensSDK
};
