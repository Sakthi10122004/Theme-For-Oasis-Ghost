/**
 * forms.js — Production-grade form handler for OASIS Ghost theme
 * Handles Tech Vendor, Freelancer & Non-Profit forms.
 *
 * Features:
 *  - Full inline field-level validation
 *  - fetch() without no-cors — response is readable
 *  - Retry with exponential backoff (up to 3 attempts: 1s, 2s, 3s)
 *  - Secret key sent with every submission
 *  - Success popup only shown on confirmed success from backend
 *  - Clear, specific error messages
 */

(function () {
  'use strict';

  /* ════ CONFIG — keep in sync with Apps Script ════════════ */
  var API_URL    = 'https://script.google.com/macros/s/AKfycbx68Ngco94Bn5ckYc1b30e0GU5QOKoABg6NQncRr-djB5IhE954ApZ1bQQ1QZd1k_-9kw/exec';
  var SECRET_KEY = 'OASIS_SECRET_KEY_CHANGE_ME'; // Change this — must match Apps Script
  var MAX_RETRY  = 3;                             // Total attempts (1 original + 2 retries)
  /* ════════════════════════════════════════════════════════ */


  /* ════════════════════════════════════════════════════════
     SUCCESS POPUP
  ════════════════════════════════════════════════════════ */
  var _popup     = null;
  var _countdown = null;

  function buildPopup() {
    if (_popup) return;
    var backdrop = document.createElement('div');
    backdrop.id        = 'formSuccessBackdrop';
    backdrop.className = 'form-success-backdrop';

    var card = document.createElement('div');
    card.className = 'form-success-card';
    card.innerHTML = [
      '<div class="form-success-icon">',
      '  <svg viewBox="0 0 80 80" fill="none">',
      '    <circle class="fsi-circle" cx="40" cy="40" r="36" stroke="#22c55e" stroke-width="4"/>',
      '    <polyline class="fsi-check" points="22,40 34,52 58,28" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
      '  </svg>',
      '</div>',
      '<h2 class="form-success-title">Submitted Successfully</h2>',
      '<p class="form-success-msg">Thank you! Your response has been recorded.</p>',
      '<p class="form-success-countdown">Redirecting to home in <span id="formSuccessSecs">5</span>s</p>',
      '<div class="form-success-bar"><div class="form-success-bar-fill" id="formSuccessBar"></div></div>'
    ].join('');

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);
    _popup = {
      backdrop: backdrop,
      secsEl:   document.getElementById('formSuccessSecs'),
      barEl:    document.getElementById('formSuccessBar')
    };
  }

  function showSuccessPopup() {
    buildPopup();
    var total     = 5;
    var remaining = total;

    _popup.secsEl.textContent = remaining;
    _popup.barEl.style.transition = 'none';
    _popup.barEl.style.width      = '100%';
    _popup.backdrop.classList.add('active');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        _popup.barEl.style.transition = 'width ' + total + 's linear';
        _popup.barEl.style.width      = '0%';
      });
    });

    if (_countdown) clearInterval(_countdown);
    _countdown = setInterval(function () {
      remaining--;
      _popup.secsEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(_countdown);
        window.location.href = '/';
      }
    }, 1000);
  }


  /* ════════════════════════════════════════════════════════
     INPUT ENFORCERS
  ════════════════════════════════════════════════════════ */

  // Phone: digits only, max 10 characters
  function enforcePhone(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      var c = el.value.replace(/[^0-9]/g, '').slice(0, 10);
      if (el.value !== c) el.value = c;
    });
    el.addEventListener('keydown', function (e) {
      if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
    });
  }

  // Positive integers only (team_size, experience_years, etc.)
  function enforcePositiveInt(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('min', '0');
    el.addEventListener('input', function () {
      var c = el.value.replace(/[^0-9]/g, '');
      if (el.value !== c) el.value = c;
    });
    el.addEventListener('keydown', function (e) {
      if (['-', 'e', 'E', '+', '.'].indexOf(e.key) !== -1) e.preventDefault();
      if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
    });
    el.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasted  = (e.clipboardData || window.clipboardData).getData('text');
      el.value    = pasted.replace(/[^0-9]/g, '');
    });
  }


  /* ════════════════════════════════════════════════════════
     VALIDATION HELPERS
  ════════════════════════════════════════════════════════ */

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  // Exactly 10 digits, must start with 6, 7, 8 or 9
  function isPhone(v) {
    return /^[6-9][0-9]{9}$/.test(v.replace(/[\s\-\+\(\)]/g, ''));
  }

  // Letters, spaces, dots, hyphens — 2 to 50 characters (freelancer name)
  function isName(v) {
    return /^[a-zA-Z\s.\-]{2,50}$/.test(v);
  }

  // Letters and spaces only — 2 to 50 characters (organisation contact name)
  function isContactName(v) {
    return /^[a-zA-Z\s]{2,50}$/.test(v);
  }

  function setFieldError(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    var group = el.closest('.form-group');
    if (group) group.classList.add('has-error');
    el.classList.add('input-error');
    var existing = el.parentNode.querySelector('.field-error-msg');
    if (existing) existing.remove();
    if (msg) {
      var span = document.createElement('span');
      span.className   = 'field-error-msg';
      span.textContent = msg;
      el.parentNode.appendChild(span);
    }
  }

  function clearFieldError(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var group = el.closest('.form-group');
    if (group) group.classList.remove('has-error');
    el.classList.remove('input-error');
    var msg = el.parentNode.querySelector('.field-error-msg');
    if (msg) msg.remove();
  }

  function clearAllErrors(form) {
    form.querySelectorAll('.has-error').forEach(function (g) { g.classList.remove('has-error'); });
    form.querySelectorAll('.input-error').forEach(function (i) { i.classList.remove('input-error'); });
    form.querySelectorAll('.field-error-msg').forEach(function (m) { m.remove(); });
  }

  // rules: [{ id, label, required, type }]
  function validateRules(rules) {
    var firstError = null;
    rules.forEach(function (rule) {
      clearFieldError(rule.id);
      var v      = val(rule.id);
      var errMsg = null;

      if (rule.required && !v) {
        errMsg = rule.label + ' is required.';
      } else if (v) {
        if (rule.type === 'email' && !isEmail(v)) {
          errMsg = 'Please enter a valid email address.';
        } else if (rule.type === 'phone' && !isPhone(v)) {
          errMsg = 'Must be exactly 10 digits and start with 6, 7, 8 or 9.';
        } else if (rule.type === 'name' && !isName(v)) {
          errMsg = 'Only letters, spaces, dots and hyphens allowed (2\u201350 characters).';
        } else if (rule.type === 'contactname' && !isContactName(v)) {
          errMsg = 'Only letters and spaces allowed (2\u201350 characters).';
        } else if (rule.type === 'url' && !v.match(/^https?:\/\/.+/)) {
          errMsg = 'Please enter a valid URL starting with http:// or https://';
        } else if (rule.type === 'posint') {
          var n = parseInt(v, 10);
          if (isNaN(n) || n < 0) errMsg = rule.label + ' must be a positive number.';
        }
      }

      if (errMsg) {
        setFieldError(rule.id, errMsg);
        if (!firstError) firstError = rule.id;
      }
    });
    return firstError; // null = all valid
  }

  function attachLiveClear(form, ids) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input',  function () { clearFieldError(id); });
      el.addEventListener('change', function () { clearFieldError(id); });
    });
  }


  /* ════════════════════════════════════════════════════════
     NETWORK: timeout wrapper + hardened fetch with retry
  ════════════════════════════════════════════════════════ */

  // Races a promise against a timeout — rejects if exceeded
  function fetchWithTimeout(promise, timeout) {
    timeout = timeout || 10000;
    return Promise.race([
      promise,
      new Promise(function (_, reject) {
        setTimeout(function () {
          reject(new Error('Request timeout'));
        }, timeout);
      })
    ]);
  }

  // Errors that are safe to retry (transient failures)
  function isRetryable(err) {
    var msg = err && err.message ? err.message : '';
    return (
      msg === 'Request timeout'     ||
      msg === 'Empty response'      ||
      msg === 'Invalid response'    ||
      msg.indexOf('Failed to fetch') !== -1  ||
      msg.indexOf('NetworkError')   !== -1   ||
      msg.indexOf('Network request failed') !== -1
    );
    // NOTE: 'Server error: 4xx/5xx' and 'success:false' are NOT retried
  }

  async function fetchWithRetry(payload, attempt) {
    attempt = attempt || 1;

    console.log('[forms.js] payload (attempt ' + attempt + '):', payload);

    var retryable = false; // flag — set true only for transient failures

    try {
      const response = await fetchWithTimeout(
        fetch(API_URL, {
          method:  'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body:    JSON.stringify(payload)
        })
      );

      // Non-2xx → server-side error (do NOT retry — it's a real error)
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const text = await response.text();

      // Empty body → transient server issue → retryable
      if (!text || text.trim() === '') {
        retryable = true;
        throw new Error('Empty response');
      }

      // Invalid JSON → transient → retryable
      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        retryable = true;
        throw new Error('Invalid response');
      }

      console.log('[forms.js] response:', result);
      return result; // deliberate server response — caller decides success/fail

    } catch (err) {
      // Timeout also counts as retryable
      if (err.message === 'Request timeout') retryable = true;

      if (retryable && attempt < MAX_RETRY) {
        console.warn('[forms.js] Retry ' + attempt + ' — reason: ' + err.message);
        await new Promise(function (r) { setTimeout(r, attempt * 1000); }); // 1s, 2s, 3s
        return fetchWithRetry(payload, attempt + 1);
      }

      // Bubble up — submit handler will map it to a user-facing message
      throw err;
    }
  }


  /* ════════════════════════════════════════════════════════
     CORE HANDLER FACTORY
  ════════════════════════════════════════════════════════ */

  function makeHandler(formId, statusId, submitBtnId, botFieldId, formType, rules, getData) {
    var form = document.getElementById(formId);
    if (!form) return;

    var statusEl  = document.getElementById(statusId);
    var submitBtn = document.getElementById(submitBtnId);
    var origText  = submitBtn ? submitBtn.textContent : 'Submit';

    attachLiveClear(form, rules.map(function (r) { return r.id; }));

    function setError(msg) {
      if (!statusEl) return;
      statusEl.textContent   = msg;
      statusEl.className     = 'form-status error';
      statusEl.style.display = 'block';
      statusEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function clearStatus() {
      if (!statusEl) return;
      statusEl.textContent   = '';
      statusEl.style.display = 'none';
    }

    function setLoading(loading) {
      if (!submitBtn) return;
      submitBtn.disabled    = loading;
      submitBtn.textContent = loading ? 'Submitting...' : origText;
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // ── Prevent double submission ─────────────────────────────────────
      if (submitBtn && submitBtn.disabled) return;

      clearStatus();
      clearAllErrors(form);

      // ── Honeypot (frontend gate — prevents even sending the request) ──
      var bot = document.getElementById(botFieldId);
      if (bot && bot.value.trim()) return; // Silent reject

      // ── Field validation ──────────────────────────────────────────────
      var firstErrorId = validateRules(rules);
      if (firstErrorId) {
        var firstEl = document.getElementById(firstErrorId);
        if (firstEl) firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setError('Please fill the highlighted fields before submitting.');
        return;
      }

      // ── Submit ────────────────────────────────────────────────────────
      setLoading(true);
      try {
        var payload = {
          formType: formType,
          data:     getData(),
          secret:   SECRET_KEY,
          honeypot: bot ? bot.value : ''   // backend double-check
        };

        var result = await fetchWithRetry(payload);

        if (result && result.success) {
          // Backend confirmed — show success
          form.reset();
          clearAllErrors(form);
          clearStatus();
          showSuccessPopup();
        } else {
          // Deliberate server rejection — show server message, do NOT retry
          var msg = (result && result.message)
            ? result.message
            : 'Submission was rejected. Please check your details and try again.';
          setError(msg);
        }

      } catch (err) {
        console.error('[forms.js] submission error:', err);

        // Structured error → user-friendly message mapping
        var m = err && err.message ? err.message : '';
        var userMsg;

        if (m === 'Request timeout') {
          userMsg = 'The server is taking too long. Please try again.';
        } else if (m === 'Empty response' || m === 'Invalid response') {
          userMsg = 'Server error. Please try again later.';
        } else if (
          m.indexOf('Failed to fetch')  !== -1 ||
          m.indexOf('NetworkError')     !== -1  ||
          m.indexOf('Network request')  !== -1
        ) {
          userMsg = 'Check your internet connection and try again.';
        } else if (m.indexOf('Server error:') !== -1) {
          userMsg = 'The server returned an error. Please try again later.';
        } else {
          userMsg = m || 'Something went wrong. Please try again.';
        }

        setError(userMsg);
      } finally {
        setLoading(false);
      }
    });
  }


  /* ════════════════════════════════════════════════════════
     FORM DEFINITIONS
  ════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {

    /* Phone enforcer */
    enforcePhone('phone');
    enforcePhone('contributor_phone');
    enforcePhone('org_contact_number');

    /* Number-only fields  */
    enforcePositiveInt('team_size');
    enforcePositiveInt('experience_years');

    /* ── TECH VENDOR ──────────────────────────────────────── */
    makeHandler(
      'techForm', 'techStatus', 'techSubmitBtn', 'bot_field',
      'tech_vendor',
      [
        { id: 'organization_name', label: 'Organisation name',            required: true,  type: 'text'   },
        { id: 'contact_person',    label: 'Contact person & designation',  required: true,  type: 'text'   },
        { id: 'email',             label: 'Email address',                 required: true,  type: 'email'  },
        { id: 'phone',             label: 'Phone number',                  required: true,  type: 'phone'  },
        { id: 'team_size',         label: 'Team size',                     required: true,  type: 'posint' },
        { id: 'location',          label: 'Location (city)',               required: true,  type: 'text'   },
        { id: 'website',           label: 'Website',                       required: true,  type: 'url'    },
        { id: 'github',            label: 'GitHub link',                   required: false, type: 'url'    },
        { id: 'experience_years',  label: 'Years of experience',           required: true,  type: 'posint' }
      ],
      function () {
        return {
          organization_name:     val('organization_name'),
          contact_person:        val('contact_person'),
          team_size:             val('team_size'),
          email:                 val('email'),
          phone:                 val('phone'),
          website:               val('website'),
          github:                val('github'),
          location:              val('location'),
          description:           val('description'),
          experience_years:      val('experience_years'),
          expertise:             val('expertise'),
          other_expertise:       val('other_expertise'),
          worked_with_ngos:      val('worked_with_ngos'),
          foss_tools:            val('foss_tools'),
          foss_preference:       val('foss_preference'),
          capacity_building:     val('capacity_building'),
          project_size:          val('project_size'),
          small_projects:        val('small_projects'),
          challenges:            val('challenges'),
          availability:          val('availability'),
          past_projects:         val('past_projects'),
          open_source_alignment: val('open_source_alignment'),
          why_join:              val('why_join'),
          expected_support:      val('expected_support')
        };
      }
    );

    /* ── FREELANCER ───────────────────────────────────────── */
    makeHandler(
      'freelancerForm', 'freelancerStatus', 'freelancerSubmitBtn', 'freelancer_bot_field',
      'freelancer',
      [
        { id: 'contributor_name',         label: 'Full name',               required: true, type: 'name'  },
        { id: 'contributor_phone',        label: 'Phone number',            required: true, type: 'phone' },
        { id: 'contributor_email',        label: 'Email address',           required: true, type: 'email' },
        { id: 'contributor_expertise',    label: 'Area of expertise',       required: true, type: 'text'  },
        { id: 'contributor_contribution', label: 'How you\'d like to help', required: true, type: 'text'  }
      ],
      function () {
        return {
          name:         val('contributor_name'),
          phone:        val('contributor_phone'),
          email:        val('contributor_email'),
          expertise:    val('contributor_expertise'),
          contribution: val('contributor_contribution')
        };
      }
    );

    /* ── NON-PROFIT ───────────────────────────────────────── */
    makeHandler(
      'nonprofitForm', 'nonprofitStatus', 'nonprofitSubmitBtn', 'nonprofit_bot_field',
      'non_profit',
      [
        { id: 'org_name',           label: 'Organisation name', required: true,  type: 'text'        },
        { id: 'org_website',        label: 'Website',           required: false, type: 'url'          },
        { id: 'org_contact_name',   label: 'Contact name',      required: true,  type: 'contactname' },
        { id: 'org_contact_number', label: 'Contact number',    required: true,  type: 'phone'       },
        { id: 'org_email',          label: 'Contact email',     required: true,  type: 'email'       }
      ],
      function () {
        return {
          organization_name: val('org_name'),
          website:           val('org_website'),
          contact_name:      val('org_contact_name'),
          contact_number:    val('org_contact_number'),
          email:             val('org_email')
        };
      }
    );

  });

})();