let djData = null;

async function fetchData() {
    if (!djData) {
        const response = await fetch("dj-list.json");
        djData = await response.json();
    }
}

async function loadTable(dateKey) {
    await fetchData();
    const data = djData;
    const tbody = document.getElementById('timetableBody');
    tbody.innerHTML = '';

    // Collect unique music styles
    const stylesSet = new Set();
    Object.values(data[dateKey]).forEach(stage => {
        stage.forEach(dj => {
            dj.Style.forEach(style => stylesSet.add(style));
        });
    });

    // Create and insert music style buttons statically
    const styleButtonsDiv = document.getElementById('styleButtons');
    styleButtonsDiv.innerHTML = '';
    const styles = [
        'Techno', 'House', 'Trap', 'Dubstep', 'Bass', 'Hardstyle', 'Future Bass',
        'Progressive House', 'Tech House', 'Trance', 'Big Room', 'Melodic Techno',
        'Hip Hop', 'Psytrance', 'Deep House'
    ];
    styles.forEach(style => {
        const button = document.createElement('button');
        button.textContent = style;
        button.setAttribute('onclick', `toggleStyleFilter('${style}')`);
        styleButtonsDiv.appendChild(button);
    });

    const stages = Object.keys(data[dateKey]);
    const maxRows = Math.max(...stages.map(stage => data[dateKey][stage].length));
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        let kineticFieldShowtime = null;
        stages.forEach((stage, index) => {
            const cell = document.createElement('td');
            const dj = data[dateKey][stage][i];
            if (dj) {
                const isFavorite = getFavorites().includes(dj.DJ);
                cell.classList.add('dj-cell');
                cell.innerHTML = `<button onclick="toggleFavorite('${dj.DJ}', this)" class="favorite">${isFavorite ? '❤️' : '♡'}</button><strong>${dj.DJ}</strong><br>${dj.Showtime}<br>${dj.Style.join(', ')}`;
                cell.dataset.style = dj.Style.join(', ');
                if (index === 0) {
                    kineticFieldShowtime = dj.Showtime;
                } else if (kineticFieldShowtime && new Date(`1970-01-01T${dj.Showtime}:00Z`) < new Date(`1970-01-01T${kineticFieldShowtime}:00Z`)) {
                    cell.innerHTML = '';
                }
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    }

    // Add image at the bottom of the table
    const imgContainer = document.getElementById('official-setlist-div');
    imgContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = `${dateKey}.jpeg`;
    img.alt = `${dateKey} image`;
    img.style.cursor = 'pointer';
    img.onclick = () => window.open(img.src, '_blank');
    imgContainer.appendChild(img);
}

function selectDate(dateKey, button) {
    document.querySelectorAll('.date-select button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    loadTable(dateKey);
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites')) || [];
}

function toggleFavorite(djName, button) {
    let favorites = getFavorites();
    if (favorites.includes(djName)) {
        favorites = favorites.filter(fav => fav !== djName);
        button.innerHTML = '♡';
    } else {
        favorites.push(djName);
        button.innerHTML = '❤️';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

let selectedStyle = null;

function toggleStyleFilter(style) {
    const button = document.querySelector(`button[onclick="toggleStyleFilter('${style}')"]`);
    if (selectedStyle === style) {
        selectedStyle = null;
        button.classList.remove('selected');
    } else {
        if (selectedStyle) {
            document.querySelector(`button[onclick="toggleStyleFilter('${selectedStyle}')"]`).classList.remove('selected');
        }
        selectedStyle = style;
        button.classList.add('selected');
    }
    filterTable();
}

function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#timetableBody tr');
    rows.forEach(row => {
        let showRow = false;
        row.querySelectorAll('td').forEach(cell => {
            const djName = cell.querySelector('strong')?.innerText.toLowerCase() || '';
            const styles = cell.dataset.style?.toLowerCase() || '';
            const styleMatch = !selectedStyle || styles.includes(selectedStyle.toLowerCase());
            if (styleMatch && (searchInput === '' || djName.includes(searchInput))) {
                showRow = true;
            }
        });
        row.style.display = showRow ? '' : 'none';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadTable('17JAN');
});
