let djData = null;
let selectedDateKey = '17JAN'; // Default value

async function fetchData() {
    if (!djData) {
        const response = await fetch("dj-list.json");
        djData = await response.json();
    }
}

async function loadTable(dateKey) {
    selectedDateKey = dateKey; // Update selectedDateKey
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

    const stages = Object.keys(data[dateKey]);
    const timeSlots = [
        '03:00-03:30', '03:30-04:00', '04:00-05:00', '05:00-06:00', '06:00-07:00',
        '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00'
    ];

    function convertTo24Hour(time) {
        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return `${hours.padStart(2, '0')}:${minutes}`;
    }

    for (let i = 0; i < timeSlots.length; i++) {
        const row = document.createElement('tr');
        stages.forEach(stage => {
            const cell = document.createElement('td');
            const dj = data[dateKey][stage].find(dj => {
                const [startTime, endTime] = dj.Showtime.split(' - ').map(convertTo24Hour);
                const [slotStart, slotEnd] = timeSlots[i].split('-');
                return startTime >= slotStart && startTime < slotEnd;
            });
            if (dj) {
                const isFavorite = getFavorites().includes(dj.DJ.toLowerCase());
                cell.classList.add('dj-cell');
                cell.innerHTML = `<button onclick="toggleFavorite('${dj.DJ}', this)" class="favorite">${isFavorite ? '❤️' : '♡'}</button><strong>${dj.DJ}</strong><br>${dj.Showtime}<br>${dj.Style.join(', ')}`;
                cell.dataset.style = dj.Style.join(', ');
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

    // Reset filters
    selectedStyle = null;
    document.querySelectorAll('#styleButtons button').forEach(btn => btn.classList.remove('selected'));
    document.getElementById('only-fav').classList.remove('selected');
    document.getElementById('searchInput').value = '';

    loadTable(dateKey);
}

function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites'))?.map(fav => fav.toLowerCase()) || [];
}

function toggleFavorite(djName, button) {
    let favorites = getFavorites();
    const djNameLower = djName.toLowerCase();
    if (favorites.includes(djNameLower)) {
        favorites = favorites.filter(fav => fav !== djNameLower);
        button.innerHTML = '♡';
    } else {
        favorites.push(djNameLower);
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

// Create and insert music style buttons statically
const styleButtonsDiv = document.getElementById('styleButtons');
styleButtonsDiv.innerHTML = '';

const favButton = document.createElement('button');
favButton.textContent = "❤️";
favButton.id = "only-fav";
styleButtonsDiv.appendChild(favButton);

const styles = [
    'Techno', 'House', 'Trap', 'Dubstep', 'Bass', 'Hardstyle', 'Future Bass',
    'Progressive House', 'Tech House', 'Trance', 'Big Room', 'Melodic Techno',
    'Hip Hop', 'Psytrance'
];
styles.forEach(style => {
    const button = document.createElement('button');
    button.textContent = style;
    button.setAttribute('onclick', `toggleStyleFilter('${style}')`);
    styleButtonsDiv.appendChild(button);
});

document.getElementById('only-fav').addEventListener('click', () => {
    const onlyFavButton = document.getElementById('only-fav');
    onlyFavButton.classList.toggle('selected');
    filterTable();
});

function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const onlyFavSelected = document.getElementById('only-fav').classList.contains('selected');
    const filteredData = {};

    Object.keys(djData).forEach(dateKey => {
        filteredData[dateKey] = {};
        Object.keys(djData[dateKey]).forEach(stage => {
            filteredData[dateKey][stage] = djData[dateKey][stage].filter(dj => {
                const djName = dj.DJ.toLowerCase();
                const styles = dj.Style.join(', ').toLowerCase();
                const styleMatch = !selectedStyle || styles.includes(selectedStyle.toLowerCase());
                const isFavorite = getFavorites().includes(dj.DJ.toLowerCase());
                return styleMatch && (searchInput === '' || djName.includes(searchInput) || styles.includes(searchInput)) && (!onlyFavSelected || isFavorite);
            });
        });
    });

    const tbody = document.getElementById('timetableBody');
    tbody.innerHTML = '';

    const stages = Object.keys(filteredData[selectedDateKey]); // Using selectedDateKey
    const maxRows = Math.max(...stages.map(stage => filteredData[selectedDateKey][stage].length));
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');
        stages.forEach(stage => {
            const cell = document.createElement('td');
            const dj = filteredData[selectedDateKey][stage][i]; // Using selectedDateKey
            if (dj) {
                const isFavorite = getFavorites().includes(dj.DJ.toLowerCase());
                cell.classList.add('dj-cell');
                cell.innerHTML = `<button onclick="toggleFavorite('${dj.DJ}', this)" class="favorite">${isFavorite ? '❤️' : '♡'}</button><strong>${dj.DJ}</strong><br>${dj.Showtime}<br>${dj.Style.join(', ')}`;
                cell.dataset.style = dj.Style.join(', ');
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTable(selectedDateKey); // Using selectedDateKey
});
