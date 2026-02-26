// FORM HANDLER UTILITY
class FormHandler {
    constructor(formId, options = {}) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        this.overlay = document.getElementById(options.overlayId);
        this.timerEl = document.getElementById(options.timerId);
        this.redirectUrl = options.redirectUrl || '/';
        this.countdownSeconds = options.countdownSeconds || 5;

        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();

        if (!this.validate()) return;

        // Show loading state on submit button if exists
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.classList.add('loading');

        // Submit the form
        this.form.submit();

        // Show overlay and start countdown
        this.showOverlay();
        this.startCountdown();
    }

    showOverlay() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
        }
    }

    startCountdown() {
        if (!this.timerEl) return;

        let seconds = this.countdownSeconds;
        this.timerEl.innerText = seconds;

        const interval = setInterval(() => {
            seconds--;
            this.timerEl.innerText = seconds;

            if (seconds <= 0) {
                clearInterval(interval);
                window.location.href = this.redirectUrl;
            }
        }, 1000);
    }

    // To be overridden by specific form validations
    validate() {
        return true;
    }

    // Utility method for showing errors
    showError(input, message, errorClass = 'error') {
        let error = input.parentElement.querySelector(`.${errorClass}`);
        if (!error) {
            error = document.createElement('div');
            error.className = errorClass;
            input.parentElement.appendChild(error);
        }
        error.innerText = message;
        error.style.display = 'block';
    }

    // Utility method for clearing errors
    clearError(input, errorClass = 'error') {
        const error = input.parentElement.querySelector(`.${errorClass}`);
        if (error) error.style.display = 'none';
    }
}

// TECH VENDOR FORM
class TechVendorForm extends FormHandler {
    constructor() {
        super('techForm', {
            overlayId: 'techOverlay',
            timerId: 'techTimer',
            redirectUrl: '/'
        });

        this.initTechSpecificHandlers();
    }

    initTechSpecificHandlers() {
        // Phone input - digits only
        const phoneInput = document.getElementById('techPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, "");
            });
        }

        // Name inputs - block numbers
        const orgNameInput = document.querySelector("input[name='entry.2108504704']");
        const contactNameInput = document.querySelector("input[name='entry.2115205576']");
        [orgNameInput, contactNameInput].forEach(input => {
            if (input) {
                input.addEventListener('input', function () {
                    this.value = this.value.replace(/[0-9]/g, "");
                });
            }
        });

        // Other checkbox toggle
        const otherCheckbox = document.getElementById('other_checkbox');
        const otherGroup = document.getElementById('other_input_group');
        const otherText = document.getElementById('other_text_field');

        if (otherCheckbox && otherGroup && otherText) {
            otherCheckbox.addEventListener('change', function () {
                if (this.checked) {
                    otherGroup.style.display = 'block';
                    otherText.setAttribute('required', 'true');
                } else {
                    otherGroup.style.display = 'none';
                    otherText.removeAttribute('required');
                    otherText.value = '';
                }
            });
        }
    }

    validate() {
        let valid = true;

        const orgName = document.querySelector("input[name='entry.2108504704']");
        const contactName = document.querySelector("input[name='entry.2115205576']");
        const email = document.querySelector("input[name='entry.1832784688']");
        const phone = document.getElementById('techPhone');
        const website = document.querySelector("input[name='entry.2035328917']");
        const checkboxes = document.querySelectorAll(
            ".oasis-tech-form input[type='checkbox']:checked"
        );

        // Organisation Name (no numbers)
        if (orgName) {
            if (!/^[A-Za-z .\-]{2,100}$/.test(orgName.value.trim())) {
                this.showError(orgName, "Enter a valid organisation name (letters only, 2-100 characters)");
                valid = false;
            } else this.clearError(orgName);
        }

        // Contact Person Name (no numbers)
        if (contactName) {
            if (!/^[A-Za-z .\-]{2,100}$/.test(contactName.value.trim())) {
                this.showError(contactName, "Enter a valid contact name (letters only, 2-100 characters)");
                valid = false;
            } else this.clearError(contactName);
        }

        // Email
        if (email) {
            if (email.value.trim() !== '' && !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
                this.showError(email, "Enter a valid email address");
                valid = false;
            } else this.clearError(email);
        }

        // Phone
        if (phone) {
            if (phone.value.trim() !== '' && !/^[6-9][0-9]{9}$/.test(phone.value.trim())) {
                this.showError(phone, "Enter valid 10-digit Indian mobile number");
                valid = false;
            } else this.clearError(phone);
        }

        // Website
        if (website) {
            if (website.value.trim() !== '' && !/^https?:\/\/.+\..+/.test(website.value.trim())) {
                this.showError(website, "Enter a valid website URL (include https://)");
                valid = false;
            } else this.clearError(website);
        }

        // Expertise Checkboxes
        if (checkboxes.length === 0) {
            alert("Please select at least one core expertise.");
            valid = false;
        }

        return valid;
    }
}

// NON-PROFITS FORM
class NonProfitForm extends FormHandler {
    constructor() {
        super('orgForm', {
            overlayId: 'orgOverlay',
            timerId: 'orgTimer',
            redirectUrl: '/'
        });

        this.initOrgSpecificHandlers();
    }

    initOrgSpecificHandlers() {
        const nameInputs = [
            document.getElementById("org_name"),
            document.getElementById("org_contact_name")
        ];

        nameInputs.forEach(input => {
            if (input) {
                input.addEventListener('input', function () {
                    this.value = this.value.replace(/[0-9]/g, "");
                });
            }
        });

        const phoneInput = document.getElementById("org_contact_number");
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, "");
            });
        }
    }

    validate() {
        let valid = true;

        const name = document.getElementById("org_name");
        const website = document.getElementById("org_website");
        const contactName = document.getElementById("org_contact_name");
        const phone = document.getElementById("org_contact_number");
        const email = document.getElementById("org_email");

        // Organisation name
        if (!/^[A-Za-z .\-]{2,100}$/.test(name.value.trim())) {
            this.showError(name, "Enter a valid organisation name (letters only, 2-100 characters)");
            valid = false;
        } else this.clearError(name);

        // Website (optional but if provided must be valid)
        if (website.value && !/^https?:\/\/.+\..+/.test(website.value.trim())) {
            this.showError(website, "Enter a valid website URL (include https://)");
            valid = false;
        } else this.clearError(website);

        // Contact name
        if (!/^[A-Za-z .\-]{2,100}$/.test(contactName.value.trim())) {
            this.showError(contactName, "Enter a valid contact name (letters only, 2-100 characters)");
            valid = false;
        } else this.clearError(contactName);

        // Phone (Indian mobile)
        if (!/^[6-9][0-9]{9}$/.test(phone.value.trim())) {
            this.showError(phone, "Enter valid 10-digit Indian mobile number");
            valid = false;
        } else this.clearError(phone);

        // Email
        if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
            this.showError(email, "Enter valid email address");
            valid = false;
        } else this.clearError(email);

        return valid;
    }
}

// FREELANCERS FORM
class FreelancerForm extends FormHandler {
    constructor() {
        super('contributorForm', {
            overlayId: 'overlay',
            timerId: 'timer',
            redirectUrl: '/'
        });

        this.initFreelancerSpecificHandlers();
    }

    initFreelancerSpecificHandlers() {
        const name = document.getElementById("contributor_name");
        if (name) {
            name.addEventListener('input', function () {
                this.value = this.value.replace(/[0-9]/g, "");
            });
        }

        const phoneInput = document.getElementById("contributor_phone");
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, "");
            });
        }
    }

    validate() {
        let valid = true;

        const name = document.getElementById("contributor_name");
        const phone = document.getElementById("contributor_phone");
        const email = this.form.querySelector("input[type='email']");
        const expertise = this.form.querySelector("input[name='entry.1613848900']");
        const contribution = this.form.querySelector("textarea");

        // Name
        if (!/^[A-Za-z .-]{2,50}$/.test(name.value.trim())) {
            this.showError(name, "Enter a valid name (letters only, 2-50 characters)", 'error-message');
            valid = false;
        } else this.clearError(name, 'error-message');

        // Phone
        if (!/^[6-9][0-9]{9}$/.test(phone.value.trim())) {
            this.showError(phone, "Enter valid 10-digit Indian mobile number", 'error-message');
            valid = false;
        } else this.clearError(phone, 'error-message');

        // Email
        if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
            this.showError(email, "Enter a valid email address", 'error-message');
            valid = false;
        } else this.clearError(email, 'error-message');

        // Expertise
        if (expertise.value.trim().length < 3) {
            this.showError(expertise, "Please enter your area of expertise", 'error-message');
            valid = false;
        } else this.clearError(expertise, 'error-message');

        // Contribution
        if (contribution.value.trim().length < 10) {
            this.showError(contribution, "Please describe how you want to contribute (min 10 characters)", 'error-message');
            valid = false;
        } else this.clearError(contribution, 'error-message');

        return valid;
    }
}

// Initialize all forms when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize forms that exist on the page
    if (document.getElementById('techForm')) new TechVendorForm();
    if (document.getElementById('orgForm')) new NonProfitForm();
    if (document.getElementById('contributorForm')) new FreelancerForm();

    // Prevent negative numbers and invalid characters in number inputs globally
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
        // Prevent typing -, e, E, +
        input.addEventListener('keydown', function (e) {
            if (['-', '+', 'e', 'E'].includes(e.key)) {
                e.preventDefault();
            }
        });

        // Ensure pasted or organically changed values are positive
        input.addEventListener('input', function () {
            if (this.value < 0) {
                this.value = Math.abs(this.value);
            }
        });
    });
});