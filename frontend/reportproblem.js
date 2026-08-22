const STORAGE_KEY = 'urbanpulse_reports';

function getReports() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveReports(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function validateForm(formData) {
    const errors = [];
    if (!formData.problemType) errors.push('Please select a problem type');
    if (formData.problemType === 'Other' && !formData.otherType?.trim()) errors.push('Please specify the problem type');
    if (!formData.description?.trim()) errors.push('Please provide a description');
    if (!formData.priority) errors.push('Please select a priority');
    return errors;
}

async function handleSubmit(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.btn-primary[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const formData = {
        problemType: document.getElementById('problem-type').value,
        otherType: document.getElementById('other-type').value,
        priority: document.querySelector('input[name="priority"]:checked')?.value,
        description: document.getElementById('description').value,
        status: 'Submitted',
        timestamp: new Date().toISOString(),
        id: generateId()
    };

    const photoInput = document.getElementById('photo');
    if (photoInput.files[0]) {
        try {
            formData.photo = await readFileAsDataURL(photoInput.files[0]);
        } catch (err) {
            console.error('Error reading photo:', err);
            alert('Failed to read photo. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
    }

    const errors = validateForm(formData);
    if (errors.length > 0) {
        alert(errors.join('\n'));
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }

    const reports = getReports();
    reports.unshift(formData);
    saveReports(reports);

    alert('Report submitted successfully!');
    window.location.href = 'problems.html';
}

function setupOtherTypeToggle() {
    const problemType = document.getElementById('problem-type');
    const otherWrap = document.getElementById('other-type-wrap');

    problemType.addEventListener('change', function () {
        otherWrap.hidden = this.value !== 'Other';
        if (this.value !== 'Other') {
            document.getElementById('other-type').value = '';
        }
    });
}

function setupPhotoPreview() {
    const photoInput = document.getElementById('photo');
    const uploadArea = document.querySelector('.upload-area');

    photoInput.addEventListener('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                uploadArea.innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width:100%;max-height:200px;border-radius:8px;">
                    <p style="margin-top:10px;color:var(--muted);font-size:0.9rem;">${file.name}</p>
                    <input type="file" id="photo" accept="image/*" style="display:none;">
                `;
                const newInput = uploadArea.querySelector('input');
                newInput.addEventListener('change', arguments.callee);
                newInput.click();
            };
            reader.readAsDataURL(file);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupOtherTypeToggle();
    setupPhotoPreview();

    const form = document.querySelector('.upload-card form') || document.querySelector('.upload-card');
    form.addEventListener('submit', handleSubmit);
});