// === COMPLETE DOM EXTRACTION ===
const domInventory = {
  timestamp: new Date().toISOString(),
  url: window.location.href,
  
  // All interactive elements
  buttons: [],
  links: [],
  forms: [],
  inputs: [],
  
  // Data display elements
  dataContainers: [],
  
  // Navigation
  navigation: [],
  
  // Dynamic elements
  modals: [],
  dropdowns: [],
  
  // Special attributes
  dataAttributes: [],
  testIds: [],
  
  // Meta
  bodyHTML: null
};

// Helper: Generate best selector
function getBestSelector(el) {
  // Priority: ID > data-testid > data-* > unique class > path
  if (el.id && !el.id.match(/[0-9a-f]{8}-/)) { // Avoid UUIDs
    return `#${el.id}`;
  }
  
  if (el.dataset.testid) return `[data-testid="${el.dataset.testid}"]`;
  if (el.dataset.qa) return `[data-qa="${el.dataset.qa}"]`;
  if (el.dataset.cy) return `[data-cy="${el.dataset.cy}"]`;
  
  // Check for stable data attributes
  const dataAttrs = Object.keys(el.dataset)
    .filter(k => !k.match(/react|random|id|key/i))
    .map(k => `[data-${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}="${el.dataset[k]}"]`);
  
  if (dataAttrs.length) return dataAttrs[0];
  
  // Name attribute
  if (el.name) return `[name="${el.name}"]`;
  
  // Unique class combo (avoid random hashes)
  const classes = Array.from(el.classList)
    .filter(c => !c.match(/^[a-z0-9]{5,}$/i)) // Filter hash-like classes
    .slice(0, 2)
    .join('.');
  
  if (classes) return `.${classes}`;
  
  // Fall back to tag + nth-of-type
  const parent = el.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === el.tagName);
    const index = siblings.indexOf(el) + 1;
    return `${el.tagName.toLowerCase()}:nth-of-type(${index})`;
  }
  
  return el.tagName.toLowerCase();
}

// Extract all data-* attributes sitewide
document.querySelectorAll('[data-testid], [data-qa], [data-cy]').forEach(el => {
  domInventory.testIds.push({
    selector: getBestSelector(el),
    attributes: {...el.dataset},
    tag: el.tagName.toLowerCase(),
    text: el.textContent.trim().substring(0, 50)
  });
});

// Buttons
document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]').forEach(btn => {
  domInventory.buttons.push({
    selector: getBestSelector(btn),
    text: btn.textContent.trim() || btn.value || btn.ariaLabel,
    type: btn.type || 'button',
    ariaLabel: btn.ariaLabel,
    disabled: btn.disabled,
    attributes: {...btn.dataset},
    classes: Array.from(btn.classList)
  });
});

// Links
document.querySelectorAll('a[href]').forEach(link => {
  if (link.textContent.trim()) { // Skip empty links
    domInventory.links.push({
      selector: getBestSelector(link),
      text: link.textContent.trim(),
      href: link.href,
      ariaLabel: link.ariaLabel,
      attributes: {...link.dataset}
    });
  }
});

// Forms
document.querySelectorAll('form').forEach(form => {
  const fields = [];
  
  form.querySelectorAll('input, textarea, select').forEach(field => {
    fields.push({
      selector: getBestSelector(field),
      type: field.type || field.tagName.toLowerCase(),
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
      required: field.required,
      label: field.labels?.[0]?.textContent.trim() || field.ariaLabel,
      attributes: {...field.dataset}
    });
  });
  
  domInventory.forms.push({
    selector: getBestSelector(form),
    action: form.action,
    method: form.method,
    fields: fields,
    attributes: {...form.dataset}
  });
});

// All inputs (including those outside forms)
document.querySelectorAll('input, textarea, select').forEach(input => {
  domInventory.inputs.push({
    selector: getBestSelector(input),
    type: input.type || input.tagName.toLowerCase(),
    name: input.name,
    id: input.id,
    placeholder: input.placeholder,
    value: input.value,
    label: input.labels?.[0]?.textContent.trim() || input.ariaLabel,
    attributes: {...input.dataset}
  });
});

// Data containers (tables, lists, grids)
document.querySelectorAll('table, ul, ol, [role="grid"], [role="list"]').forEach(container => {
  const type = container.tagName === 'TABLE' ? 'table' : 
               container.role === 'grid' ? 'grid' : 'list';
  
  let structure = {};
  
  if (type === 'table') {
    structure = {
      headers: Array.from(container.querySelectorAll('th')).map(th => th.textContent.trim()),
      rowSelector: 'tbody tr',
      cellSelector: 'td'
    };
  } else {
    structure = {
      itemSelector: container.tagName === 'UL' || container.tagName === 'OL' ? 'li' : '[role="listitem"]'
    };
  }
  
  domInventory.dataContainers.push({
    type: type,
    selector: getBestSelector(container),
    structure: structure,
    attributes: {...container.dataset}
  });
});

// Navigation elements
document.querySelectorAll('nav, [role="navigation"], [role="menubar"], [role="tablist"]').forEach(nav => {
  domInventory.navigation.push({
    selector: getBestSelector(nav),
    type: nav.role || 'nav',
    items: Array.from(nav.querySelectorAll('a, button, [role="tab"], [role="menuitem"]')).map(item => ({
      selector: getBestSelector(item),
      text: item.textContent.trim(),
      href: item.href
    })),
    attributes: {...nav.dataset}
  });
});

// Modals
document.querySelectorAll('[role="dialog"], .modal, [data-modal]').forEach(modal => {
  domInventory.modals.push({
    selector: getBestSelector(modal),
    visible: modal.style.display !== 'none' && !modal.hidden,
    trigger: modal.dataset.trigger || null,
    closeSelector: getBestSelector(modal.querySelector('[data-dismiss], .close, button[aria-label*="close" i]')),
    attributes: {...modal.dataset}
  });
});

// Dropdowns
document.querySelectorAll('[role="menu"], .dropdown, select').forEach(dd => {
  domInventory.dropdowns.push({
    selector: getBestSelector(dd),
    trigger: dd.dataset.toggle || null,
    options: Array.from(dd.querySelectorAll('option, [role="menuitem"]')).map(opt => opt.textContent.trim()),
    attributes: {...dd.dataset}
  });
});

// Save body HTML
domInventory.bodyHTML = document.body.outerHTML;

// Copy to clipboard
copy(JSON.stringify(domInventory, null, 2));
console.log('✓ DOM inventory extracted and copied to clipboard');
console.log('Buttons:', domInventory.buttons.length);
console.log('Forms:', domInventory.forms.length);
console.log('Inputs:', domInventory.inputs.length);
console.log('Data containers:', domInventory.dataContainers.length);
