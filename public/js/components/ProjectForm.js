import { projectApi } from '../api/projectApi.js';
import { showToast }  from './Toast.js';
import { t } from '../i18n/index.js';

export class ProjectForm {
  constructor(onSaved) {
    this._overlay = null;
    this._project = null; // null = create mode, object = edit mode
    this._onSaved = onSaved;
  }

  mount() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'pform-title');
    overlay.innerHTML = `
      <div class="modal project-form-modal">
        <button class="modal__close" aria-label="${t('common.close')}">&times;</button>
        <h2 class="modal__title" id="pform-title">${t('form.addProduct')}</h2>
        <form class="project-form" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pf-title">${t('form.title')} <span class="req">*</span></label>
              <input class="form-input" id="pf-title" name="title" type="text" required maxlength="200" />
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-year">${t('form.year')} <span class="req">*</span></label>
              <input class="form-input" id="pf-year" name="year" type="number"
                min="1900" max="2100" required />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-desc">${t('form.description')} <span class="req">*</span></label>
            <textarea class="form-input form-textarea" id="pf-desc" name="description"
              required maxlength="2000" rows="4"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pf-category">${t('form.category')} <span class="req">*</span></label>
              <select class="form-input form-select" id="pf-category" name="category" required>
                <option value="">${t('form.select')}</option>
                <option value="roof_boxes">${t('form.roofBoxes')}</option>
                <option value="roof_racks">${t('form.roofRacks')}</option>
                <option value="accessories">${t('form.accessories')}</option>
                <option value="bundles">${t('form.bundles')}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-status">${t('form.status')}</label>
              <select class="form-input form-select" id="pf-status" name="status">
                <option value="draft">${t('form.draft')}</option>
                <option value="active">${t('form.active')}</option>
                <option value="sold_out">${t('form.soldOut')}</option>
                <option value="discontinued">${t('form.discontinued')}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pf-price">${t('form.price')} (ISK) <span class="req">*</span></label>
              <input class="form-input" id="pf-price" name="price" type="number" min="0" step="1" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-compare-price">${t('form.comparePrice')} (ISK)</label>
              <input class="form-input" id="pf-compare-price" name="compare_at_price" type="number" min="0" step="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pf-price-eur">Price (EUR)
                <span class="form-hint">Leave blank if this product is ISK-only</span>
              </label>
              <input class="form-input" id="pf-price-eur" name="price_eur" type="number" min="0" step="0.01" placeholder="e.g. 39.95" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="pf-stock">${t('form.stockQty')}</label>
              <input class="form-input" id="pf-stock" name="stock_quantity" type="number" min="0" step="1" value="0" />
            </div>
            <div class="form-group">
              <label class="form-label" for="pf-sku">${t('form.sku')}</label>
              <input class="form-input" id="pf-sku" name="sku" type="text" maxlength="50" placeholder="e.g. FB-PRO-520" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group form-group--check">
              <label class="form-check">
                <input type="checkbox" name="featured" id="pf-featured" />
                <span>${t('form.featured')}</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-tools">${t('form.tags')} <span class="form-hint">${t('form.tagsHint')}</span></label>
            <input class="form-input" id="pf-tools" name="tools_used" type="text"
              placeholder="${t('form.tagsPlaceholder')}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="pf-image">${t('form.imageUrl')}</label>
            <input class="form-input" id="pf-image" name="image_url" type="url" />
          </div>
          <p class="form-error" aria-live="polite"></p>
          <div class="form-actions">
            <button class="btn btn--ghost" type="button" data-action="cancel">${t('form.cancel')}</button>
            <button class="btn btn--primary" type="submit">${t('form.saveProduct')}</button>
          </div>
        </form>
      </div>
    `;

    overlay.querySelector('.modal__close').addEventListener('click',        () => this.close());
    overlay.querySelector('[data-action=cancel]').addEventListener('click', () => this.close());
    overlay.addEventListener('click', e => { if (e.target === overlay) this.close(); });
    overlay.querySelector('.project-form').addEventListener('submit', e => this._onSubmit(e));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    document.body.appendChild(overlay);
    this._overlay = overlay;
  }

  open(project = null) {
    if (!this._overlay) this.mount();
    this._project = project;
    const isEdit = !!project;

    this._overlay.querySelector('#pform-title').textContent = isEdit ? t('form.editProduct') : t('form.addProduct');
    this._overlay.querySelector('[type=submit]').textContent = isEdit ? t('form.saveChanges') : t('form.saveProduct');

    const form = this._overlay.querySelector('.project-form');
    form.reset();
    this._overlay.querySelector('.form-error').textContent = '';

    if (isEdit) {
      form.title.value           = project.title;
      form.description.value     = project.description;
      form.category.value        = project.category;
      form.year.value            = project.year;
      form.featured.checked      = project.featured;
      form.tools_used.value      = (project.tools_used || []).join(', ');
      form.image_url.value       = project.image_url || '';
      form.price.value           = project.price || 0;
      form.price_eur.value       = project.price_eur != null ? project.price_eur : '';
      form.compare_at_price.value = project.compare_at_price || '';
      form.stock_quantity.value   = project.stock_quantity || 0;
      form.sku.value             = project.sku || '';
      form.status.value          = project.status || 'draft';
    }

    requestAnimationFrame(() => this._overlay.classList.add('open'));
    this._overlay.querySelector('#pf-title').focus();
  }

  close() {
    this._overlay?.classList.remove('open');
  }

  async _onSubmit(e) {
    e.preventDefault();
    const form  = e.currentTarget;
    const errEl = this._overlay.querySelector('.form-error');
    const btn   = form.querySelector('[type=submit]');

    errEl.textContent = '';
    btn.disabled = true;

    const data = {
      title:            form.title.value.trim(),
      description:      form.description.value.trim(),
      category:         form.category.value,
      year:             Number(form.year.value),
      featured:         form.featured.checked,
      tools_used:       form.tools_used.value.split(',').map(t => t.trim()).filter(Boolean),
      image_url:        form.image_url.value.trim() || null,
      price:            Number(form.price.value) || 0,
      price_eur:        form.price_eur.value ? Number(form.price_eur.value) : null,
      compare_at_price: form.compare_at_price.value ? Number(form.compare_at_price.value) : null,
      stock_quantity:   Number(form.stock_quantity.value) || 0,
      sku:              form.sku.value.trim() || null,
      status:           form.status.value,
    };

    try {
      if (this._project) {
        await projectApi.update(this._project.id, data);
        showToast(t('form.productUpdated'), 'success');
      } else {
        await projectApi.create(data);
        showToast(t('form.productCreated'), 'success');
      }
      this.close();
      this._onSaved?.();
    } catch (err) {
      errEl.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  }
}
