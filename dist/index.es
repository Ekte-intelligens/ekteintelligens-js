var d = Object.defineProperty;
var h = (c, t, e) => t in c ? d(c, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : c[t] = e;
var s = (c, t, e) => h(c, typeof t != "symbol" ? t + "" : t, e);
import { createClient as p } from "@supabase/supabase-js";
class m {
  constructor(t) {
    s(this, "inputMapping");
    s(this, "content", {});
    s(this, "sessionId");
    s(this, "hasEmailOrPhone", !1);
    s(this, "onContentUpdate");
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
    const e = t.target, i = this.getFieldName(e), r = e.value.trim();
    r && (this.content[i] = r, this.isEmailOrPhone(i, r) && (this.hasEmailOrPhone = !0), this.hasEmailOrPhone && this.onContentUpdate && this.onContentUpdate(this.content, this.sessionId));
  }
  getFieldName(t) {
    return t.name || t.id || t.getAttribute("data-field") || t.type || "unknown";
  }
  isEmailOrPhone(t, e) {
    const i = t.toLowerCase();
    return i.includes("email") || i.includes("mail") ? this.isValidEmail(e) : i.includes("phone") || i.includes("tel") ? this.isValidPhone(e) : this.isValidEmail(e) || this.isValidPhone(e);
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
class f {
  constructor(t) {
    s(this, "productMapping");
    this.productMapping = t;
  }
  detectProducts() {
    const t = [];
    if (!this.productMapping || Object.keys(this.productMapping).length === 0)
      return this.detectCommonProducts();
    for (const [e, i] of Object.entries(this.productMapping)) {
      const r = e.includes(",") ? e.split(",").map((n) => n.trim()) : [e];
      for (const n of r)
        document.querySelectorAll(n).forEach((l) => {
          const a = this.extractProductFromElement(
            l,
            i
          );
          a && Object.keys(a).length > 0 && t.push(a);
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
    for (const i of e)
      document.querySelectorAll(i).forEach((n) => {
        const o = this.extractProductFromCommonElement(n);
        o && t.push(o);
      });
    return t;
  }
  extractProductFromElement(t, e) {
    try {
      const i = {};
      if (e.id_selector) {
        const r = this.extractValue(t, e.id_selector);
        r !== null && (i.id = r);
      }
      if (e.name_selector) {
        const r = this.extractValue(
          t,
          e.name_selector
        );
        r !== null && (i.name = r);
      }
      if (e.price_selector && (i.price = this.extractPrice(
        t,
        e.price_selector
      )), e.quantity_selector && (i.quantity = this.extractQuantity(
        t,
        e.quantity_selector
      )), e.fields)
        for (const [r, n] of Object.entries(
          e.fields
        )) {
          const o = this.extractValue(
            t,
            n
          );
          o !== null && (r.toLowerCase().includes("price") ? i[r] = this.extractPrice(
            t,
            n
          ) : i[r] = o);
        }
      if (e.additional_fields)
        for (const [r, n] of Object.entries(
          e.additional_fields
        )) {
          const o = this.extractValue(
            t,
            n
          );
          o !== null && (i[r] = o);
        }
      return Object.keys(i).length > 0 ? i : null;
    } catch (i) {
      return console.warn("Error extracting product from element:", i), null;
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
    var i, r, n;
    try {
      if (e.startsWith("data-"))
        return t.getAttribute(e) || null;
      if (e.startsWith(">"))
        try {
          const l = t.querySelector(e);
          return l && ((i = l.textContent) == null ? void 0 : i.trim()) || null;
        } catch (l) {
          return console.warn(`Invalid selector: ${e}`, l), null;
        }
      if (e.includes(",")) {
        const l = e.split(",").map((a) => a.trim());
        for (const a of l)
          try {
            const u = t.querySelector(a);
            if (u)
              return ((r = u.textContent) == null ? void 0 : r.trim()) || null;
          } catch (u) {
            console.warn(
              `Invalid selector in comma list: ${a}`,
              u
            );
            continue;
          }
        return null;
      }
      const o = t.querySelector(e);
      return o && ((n = o.textContent) == null ? void 0 : n.trim()) || null;
    } catch (o) {
      return console.warn(
        `Error extracting value with selector: ${e}`,
        o
      ), null;
    }
  }
  extractTextContent(t, e) {
    var r;
    const i = t.querySelector(e);
    return i && ((r = i.textContent) == null ? void 0 : r.trim()) || null;
  }
  extractPrice(t, e) {
    const i = this.extractValue(t, e);
    if (!i) return 0;
    const r = i.replace(/[^\d.,]/g, "").replace(",", "."), n = parseFloat(r);
    return isNaN(n) ? 0 : n;
  }
  extractQuantity(t, e) {
    const i = this.extractValue(t, e);
    if (!i) return 1;
    const r = parseInt(i);
    return isNaN(r) ? 1 : r;
  }
}
class g {
  constructor(t, e) {
    s(this, "client");
    const i = t || "https://yoflhmaayrceswiwvxba.supabase.co", r = e || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZmxobWFheXJjZXN3aXd2eGJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzI5MzQ4MzUsImV4cCI6MTk4ODUxMDgzNX0.dq8OdZylVnB1Gwa_nYLALxUHk2NOPmRlhS_YbA7E8pg";
    this.client = p(i, r);
  }
  async getCheckoutCampaign(t) {
    try {
      const { data: e, error: i } = await this.client.from("organizations_checkout_campaigns").select("*").eq("id", t).single();
      return i ? (console.error("Error fetching checkout campaign:", i), null) : e;
    } catch (e) {
      return console.error("Error fetching checkout campaign:", e), null;
    }
  }
  async submitCartSession(t) {
    try {
      const { data: e, error: i } = await this.client.functions.invoke(
        "cart-checkout-session",
        {
          body: t
        }
      );
      return i ? (console.error(
        "Error calling cart-checkout-session function:",
        i
      ), null) : e;
    } catch (e) {
      return console.error(
        "Error calling cart-checkout-session function:",
        e
      ), null;
    }
  }
}
class y {
  constructor(t) {
    s(this, "options");
    s(this, "supabaseService");
    s(this, "inputDetector");
    s(this, "productDetector");
    s(this, "_sessionId");
    s(this, "isInitialized", !1);
    this.options = t, this.supabaseService = new g(
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
      return t ? (this.inputDetector = new m(t.input_mapping), this.productDetector = new f(
        t.product_mapping
      ), this.inputDetector.setOnContentUpdate(
        this.handleContentUpdate.bind(this)
      ), this.inputDetector.startListening(), this.isInitialized = !0, console.log("Abandoned cart tool initialized successfully"), !0) : (console.error("Failed to fetch checkout campaign data"), !1);
    } catch (t) {
      return console.error("Failed to initialize abandoned cart tool:", t), !1;
    }
  }
  async handleContentUpdate(t, e) {
    var i, r;
    try {
      const n = ((i = this.productDetector) == null ? void 0 : i.detectProducts()) || [], o = typeof window < "u" ? window.location.href : "", l = {
        organization_id: this.options.organizationId,
        cart_campaign_id: this.options.cartCampaignId,
        content: t,
        products: n,
        url: o,
        id: e
      }, a = await this.supabaseService.submitCartSession(
        l
      );
      a && a.success ? (this._sessionId = a.id, (r = this.inputDetector) == null || r.setSessionId(a.id), console.log("Cart session updated successfully:", a.id)) : console.error("Failed to submit cart session");
    } catch (n) {
      console.error("Error handling content update:", n);
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
class I {
  constructor(t) {
    s(this, "options");
    s(this, "tools", /* @__PURE__ */ new Map());
    s(this, "_isInitialized", !1);
    this.options = t;
  }
  async initialize() {
    var t;
    if (this._isInitialized)
      return !0;
    try {
      if ((t = this.options.features) != null && t.abandonedCart) {
        const e = new y(this.options);
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
typeof window < "u" && (window.EkteIntelligensSDK = I);
export {
  I as EkteIntelligensSDK
};
