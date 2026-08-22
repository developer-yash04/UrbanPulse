const STORAGE_KEY = 'urbanpulse_reports';

function getReports() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusClass(status) {
    const classes = {
        'Submitted': 'pending',
        'In Progress': 'progress',
        'Resolved': 'resolved'
    };
    return classes[status] || 'pending';
}

function createReportCard(report) {
    const card = document.createElement('article');
    card.className = 'report-card';
    card.dataset.id = report.id;

    const photoHtml = report.photo
        ? `<img src="${report.photo}" alt="Report photo" class="report-photo">`
        : `<div class="report-photo placeholder">No photo</div>`;

    const typeLabel = report.problemType === 'Other' ? report.otherType : report.problemType;

    card.innerHTML = `
        <div class="report-media">${photoHtml}</div>
        <div class="report-content">
            <div class="report-header">
                <h3 class="report-type">${typeLabel}</h3>
                <span class="report-status ${getStatusClass(report.status)}">${report.status}</span>
            </div>
            <p class="report-description">${report.description}</p>
            <div class="report-meta">
                <span class="report-priority priority-${report.priority?.toLowerCase()}">${report.priority}</span>
                <time class="report-time" datetime="${report.timestamp}">${formatDate(report.timestamp)}</time>
            </div>
        </div>
    `;

    return card;
}

function renderReports() {
    const grid = document.getElementById('reports-grid');
    const emptyState = document.getElementById('empty-state');
    const reports = getReports();

    if (reports.length === 0) {
        grid.innerHTML = '';
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;
    grid.innerHTML = '';
    reports.forEach(report => {
        grid.appendChild(createReportCard(report));
    });
}

function setupFilter() {
    const filterSelect = document.getElementById('status-filter');
    if (!filterSelect) return;

    filterSelect.addEventListener('change', function () {
        const filter = this.value;
        const cards = document.querySelectorAll('.report-card');

        cards.forEach(card => {
            const status = card.querySelector('.report-status').textContent;
            if (filter === 'all' || status === filter) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderReports();
    setupFilter();
});