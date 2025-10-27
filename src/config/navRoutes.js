// src/config/navRoutes.js
export default {
  home: {
    Title: "Home", rows: [
      { 
        r1: { cols: 12, snip: "/snips/home1.html" } },
      { 
        r2: { cols: 12, snip: "/snips/home2.html" } }
    ]
  },
  about: {
    Title: "About", rows: [
      {
        r1: [
          { cols: 4, snip: "/snips/about1a-list.html" },
          { cols: 4, snip: "/snips/about1b-text.html" },
          { cols: 4, snip: "/snips/about1c-img.html" }
        ]
      }
    ]
  },
  product: {
    Title: "Products", rows: [
      { 
        r1: { cols: 12, snip: "/snips/products.html" } }
    ]
  },
  contact: {
    Title: "Contact", rows: [
      { 
        r1: { cols: 12, snip: "/snips/contact1.html" } },
      { 
        r2: { cols: 12, snip: "/snips/contact2.html" } }
    ]
  }
};