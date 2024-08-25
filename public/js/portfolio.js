document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('portfolioSearch');
    const tableBody = document.getElementById('portfolioTableBody');
    const rows = Array.from(tableBody.getElementsByTagName('tr'));

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        rows.forEach(row => {
            const symbol = row.querySelector('.symbol').textContent.toLowerCase();
            const name = row.querySelector('.name').textContent.toLowerCase();
            if (symbol.includes(query) || name.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
});