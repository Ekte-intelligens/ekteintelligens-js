var h = Object.defineProperty;
var p = (a, t, e) => t in a ? h(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var o = (a, t, e) => p(a, typeof t != "symbol" ? t + "" : t, e);
import { createClient as m } from "@supabase/supabase-js";
class f {
  constructor(t) {
    o(this, "inputMapping");
    o(this, "content", {});
    o(this, "sessionId");
    o(this, "hasEmailOrPhone", !1);
    o(this, "onContentUpdate");
    this.inputMapping = t;
  }
  setOnContentUpdate(t) {
    this.onContentUpdate = t;
  }
  setSessionId(t) {
    this.sessionId = t;
  }
  startListening() {
    this.getTargetInputs().forEach((e) => {
      e.addEventListener("blur", this.handleInputBlur.bind(this));
    });
  }
  stopListening() {
    this.getTargetInputs().forEach((e) => {
      e.removeEventListener("blur", this.handleInputBlur.bind(this));
    });
  }
  getTargetInputs() {
    if (!this.inputMapping)
      return Array.from(document.querySelectorAll("input"));
    if (this.inputMapping.form_selector) {
      const t = document.querySelector(
        this.inputMapping.form_selector
      );
      if (t)
        return Array.from(t.querySelectorAll("input"));
    }
    return this.inputMapping.inputs && this.inputMapping.inputs.length > 0 ? this.inputMapping.inputs.map((t) => document.querySelector(t)).filter((t) => t !== null) : Array.from(document.querySelectorAll("input"));
  }
  handleInputBlur(t) {
    const e = t.target, r = this.getFieldName(e), n = e.value.trim();
    n && (this.content[r] = n, this.isEmailOrPhone(r, n) && (this.hasEmailOrPhone = !0), this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
  }
  getFieldName(t) {
    return t.name || t.id || t.getAttribute("data-field") || t.type || "unknown";
  }
  isEmailOrPhone(t, e) {
    const r = t.toLowerCase();
    return r.includes("email") || r.includes("mail") ? this.isValidEmail(e) : r.includes("phone") || r.includes("tel") ? this.isValidPhone(e) : this.isValidEmail(e) || this.isValidPhone(e);
  }
  isValidEmail(t) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
  }
  isValidPhone(t) {
    return /^[\+]?[0-9\s\-\(\)]{7,}$/.test(t);
  }
  getContent() {
    return { ...this.content };
  }
  hasEmailOrPhoneNumber() {
    return this.hasEmailOrPhone;
  }
}
class g {
  constructor(t) {
    o(this, "productMapping");
    this.productMapping = t;
  }
  detectProducts() {
    const t = [];
    if (!this.productMapping || Object.keys(this.productMapping).length === 0)
      return this.detectCommonProducts();
    for (const [e, r] of Object.entries(this.productMapping)) {
      const n = e.includes(",") ? e.split(",").map((i) => i.trim()) : [e];
      for (const i of n)
        document.querySelectorAll(i).forEach((c) => {
          const l = this.extractProductFromElement(
            c,
            r
          );
          l && Object.keys(l).length > 0 && t.push(l);
        });
    }
    return t;
  }
  detectCommonProducts() {
    const t = [], e = [
      "[data-product-id]",
      ".product-item",
      ".cart-item",
      "[data-sku]",
      ".product",
      ".item"
    ];
    for (const r of e)
      document.querySelectorAll(r).forEach((i) => {
        const s = this.extractProductFromCommonElement(i);
        s && t.push(s);
      });
    return t;
  }
  extractProductFromElement(t, e) {
    try {
      const r = {};
      if (e.id_selector) {
        const n = this.extractValue(t, e.id_selector);
        n !== null && (r.id = n);
      }
      if (e.name_selector) {
        const n = this.extractValue(
          t,
          e.name_selector
        );
        n !== null && (r.name = n);
      }
      if (e.price_selector && (r.price = this.extractPrice(
        t,
        e.price_selector
      )), e.quantity_selector && (r.quantity = this.extractQuantity(
        t,
        e.quantity_selector
      )), e.fields)
        for (const [n, i] of Object.entries(
          e.fields
        )) {
          const s = this.extractValue(
            t,
            i
          );
          s !== null && (n.toLowerCase().includes("price") ? r[n] = this.extractPrice(
            t,
            i
          ) : r[n] = s);
        }
      if (e.additional_fields)
        for (const [n, i] of Object.entries(
          e.additional_fields
        )) {
          const s = this.extractValue(
            t,
            i
          );
          s !== null && (r[n] = s);
        }
      return Object.keys(r).length > 0 ? r : null;
    } catch (r) {
      return console.warn("Error extracting product from element:", r), null;
    }
  }
  extractProductFromCommonElement(t) {
    try {
      const e = {
        id: this.extractValue(t, "data-product-id") || this.extractValue(t, "data-sku") || this.extractValue(t, "id") || "",
        name: this.extractValue(t, "data-product-name") || this.extractValue(t, "title") || this.extractTextContent(
          t,
          ".product-name, .item-name, .title"
        ) || "",
        price: this.extractPrice(t, "data-price") || this.extractPrice(t, "data-price-amount") || 0,
        quantity: this.extractQuantity(t, "data-quantity") || this.extractQuantity(t, "quantity") || 1
      };
      return e.id || e.name ? e : null;
    } catch (e) {
      return console.warn(
        "Error extracting product from common element:",
        e
      ), null;
    }
  }
  extractValue(t, e) {
    var r, n, i;
    try {
      if (e.startsWith("data-"))
        return t.getAttribute(e) || null;
      if (e.startsWith(">"))
        try {
          const c = t.querySelector(e);
          return c && ((r = c.textContent) == null ? void 0 : r.trim()) || null;
        } catch (c) {
          return console.warn(`Invalid selector: ${e}`, c), null;
        }
      if (e.includes(",")) {
        const c = e.split(",").map((l) => l.trim());
        for (const l of c)
          try {
            const u = t.querySelector(l);
            if (u)
              return ((n = u.textContent) == null ? void 0 : n.trim()) || null;
          } catch (u) {
            console.warn(
              `Invalid selector in comma list: ${l}`,
              u
            );
            continue;
          }
        return null;
      }
      const s = t.querySelector(e);
      return s && ((i = s.textContent) == null ? void 0 : i.trim()) || null;
    } catch (s) {
      return console.warn(
        `Error extracting value with selector: ${e}`,
        s
      ), null;
    }
  }
  extractTextContent(t, e) {
    var n;
    const r = t.querySelector(e);
    return r && ((n = r.textContent) == null ? void 0 : n.trim()) || null;
  }
  extractPrice(t, e) {
    const r = this.extractValue(t, e);
    if (!r) return 0;
    const n = r.replace(/[^\d.,]/g, "").replace(",", "."), i = parseFloat(n);
    return isNaN(i) ? 0 : i;
  }
  extractQuantity(t, e) {
    const r = this.extractValue(t, e);
    if (!r) return 1;
    const n = parseInt(r);
    return isNaN(n) ? 1 : n;
  }
}
class y {
  constructor(t) {
    o(this, "totalSelector");
    this.totalSelector = t;
  }
  extractTotal() {
    var t;
    if (!this.totalSelector)
      return 0;
    try {
      const e = document.querySelector(this.totalSelector);
      if (!e)
        return console.warn(`Total selector not found: ${this.totalSelector}`), 0;
      const r = ((t = e.textContent) == null ? void 0 : t.trim()) || "";
      if (!r)
        return console.warn(
          `No text content found for total selector: ${this.totalSelector}`
        ), 0;
      let n = r.replace(/[^\d.,]/g, "");
      n.includes(",") && !n.includes(".") ? n = n.replace(",", ".") : n.includes(",") && n.includes(".") && (n = n.replace(",", ""));
      const i = parseFloat(n);
      return isNaN(i) ? (console.warn(`Could not parse total value: ${r}`), 0) : i;
    } catch (e) {
      return console.warn(
        `Error extracting total with selector: ${this.totalSelector}`,
        e
      ), 0;
    }
  }
  hasTotalSelector() {
    return !!this.totalSelector;
  }
}
class x {
  constructor(t, e) {
    o(this, "client");
    const r = t || "https://yoflhmaayrceswiwvxba.supabase.co", n = e || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = m(r, n);
  }
  async getCheckoutCampaign(t) {
    try {
      const { data: e, error: r } = await this.client.from("organizations_checkout_campaigns").select("*").eq("id", t).single();
      return r ? (console.error("Error fetching checkout campaign:", r), null) : e;
    } catch (e) {
      return console.error("Error fetching checkout campaign:", e), null;
    }
  }
  async submitCartSession(t) {
    try {
      const { data: e, error: r } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: t
        }
      );
      return r ? (console.error(
        "Error calling cart-checkout-session function:",
        r
      ), null) : e;
    } catch (e) {
      return console.error(
        "Error calling cart-checkout-session function:",
        e
      ), null;
    }
  }
}
class I {
  constructor(t) {
    o(this, "options");
    o(this, "supabaseService");
    o(this, "inputDetector");
    o(this, "productDetector");
    o(this, "totalExtractor");
    o(this, "_sessionId");
    o(this, "isInitialized", !1);
    this.options = t, this.supabaseService = new x(
      t.supabaseUrl,
      t.supabaseAnonKey
    );
  }
  async initialize() {
    if (this.isInitialized)
      return !0;
    try {
      const t = await this.supabaseService.getCheckoutCampaign(
        this.options.cartCampaignId
      );
      return t ? (this.inputDetector = new f(t.input_mapping), this.productDetector = new g(
        t.product_mapping
      ), this.totalExtractor = new y(t.total_selector), this.inputDetector.setOnContentUpdate(
        this.handleContentUpdate.bind(this)
      ), this.inputDetector.startListening(), this.isInitialized = !0, console.log("Abandoned cart tool initialized successfully"), !0) : (console.error("Failed to fetch checkout campaign data"), !1);
    } catch (t) {
      return console.error("Failed to initialize abandoned cart tool:", t), !1;
    }
  }
  async handleContentUpdate(t, e) {
    var r, n, i;
    try {
      const s = ((r = this.productDetector) == null ? void 0 : r.detectProducts()) || [], c = ((n = this.totalExtractor) == null ? void 0 : n.extractTotal()) || 0, l = typeof window < "u" ? window.location.href : "", u = {
        organization_id: this.options.organizationId,
        cart_campaign_id: this.options.cartCampaignId,
        content: t,
        products: s,
        url: l,
        total: c,
        id: e
      }, d = await this.supabaseService.submitCartSession(
        u
      );
      d && d.success ? (this._sessionId = d.id, (i = this.inputDetector) == null || i.setSessionId(d.id), console.log("Cart session updated successfully:", d.id)) : console.error("Failed to submit cart session");
    } catch (s) {
      console.error("Error handling content update:", s);
    }
  }
  destroy() {
    this.inputDetector && this.inputDetector.stopListening(), this.isInitialized = !1, this._sessionId = void 0;
  }
  getContent() {
    var t;
    return ((t = this.inputDetector) == null ? void 0 : t.getContent()) || {};
  }
  hasEmailOrPhone() {
    var t;
    return ((t = this.inputDetector) == null ? void 0 : t.hasEmailOrPhoneNumber()) || !1;
  }
  getSessionId() {
    return this._sessionId;
  }
}
class E {
  constructor(t) {
    o(this, "options");
    o(this, "tools", /* @__PURE__ */ new Map());
    o(this, "_isInitialized", !1);
    this.options = t;
  }
  async initialize() {
    var t;
    if (this._isInitialized)
      return !0;
    try {
      if ((t = this.options.features) != null && t.abandonedCart) {
        const e = new I(this.options);
        await e.initialize(), this.tools.set("abandonedCart", e);
      }
      return this._isInitialized = !0, console.log("EkteIntelligens SDK initialized successfully"), !0;
    } catch (e) {
      return console.error("Failed to initialize EkteIntelligens SDK:", e), !1;
    }
  }
  // Public API methods
  getAbandonedCartTool() {
    return this.tools.get("abandonedCart");
  }
  destroy() {
    this.tools.forEach((t) => {
      t.destroy && t.destroy();
    }), this.tools.clear(), this._isInitialized = !1;
  }
  isInitialized() {
    return this._isInitialized;
  }
}
typeof window < "u" && (window.EkteIntelligensSDK = E);
export {
  E as EkteIntelligensSDK
};
