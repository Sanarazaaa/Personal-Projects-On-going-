// Initialize map
const map = L.map('map');

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Status elements
const statusElement = document.getElementById('status');
const hospitalStatsElement = document.getElementById('hospital-stats');

// Store hospitals data globally
let hospitalsData = [];
let userLocation = null;

// Specialties list
const specialties = {
    emergency: { icon: '🚑', name: 'Emergency' },
    icu: { icon: '🏥', name: 'ICU' },
    cardiology: { icon: '❤️', name: 'Cardiology' },
    pediatrics: { icon: '👶', name: 'Pediatrics' },
    orthopedics: { icon: '🦴', name: 'Orthopedics' },
    neurology: { icon: '🧠', name: 'Neurology' }
};

// Facility status indicators
const facilityStatus = {
    open: { color: '#4CAF50', text: 'Open' },
    busy: { color: '#FFC107', text: 'Busy' },
    closed: { color: '#f44336', text: 'Closed' }
};

// Get nearby hospitals using Overpass API with enhanced data
async function getNearbyHospitals(lat, lon, radius = 5000) {
    const query = `
        [out:json][timeout:25];
        (
            node["amenity"="hospital"](around:${radius},${lat},${lon});
            way["amenity"="hospital"](around:${radius},${lat},${lon});
            relation["amenity"="hospital"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
    `;

    try {
        statusElement.textContent = "Searching for nearby hospitals...";
        statusElement.classList.add('loading');

        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query
        });

        const data = await response.json();
        return enhanceHospitalData(data.elements.filter(element => element.type === 'node' && element.tags));
    } catch (error) {
        console.error('Error fetching hospitals:', error);
        statusElement.textContent = "Error finding hospitals. Please try again.";
        return [];
    }
}

// Enhance hospital data with additional information
function enhanceHospitalData(hospitals) {
    return hospitals.map(hospital => ({
        ...hospital,
        enhancedData: {
            status: getRandomStatus(),
            bedAvailability: getRandomBedCount(),
            specialtiesAvailable: getRandomSpecialties(),
            hasBloodBank: Math.random() > 0.5,
            hasParking: Math.random() > 0.3,
            wheelchairAccessible: Math.random() > 0.2,
            insuranceAccepted: getRandomInsuranceList(),
            waitingTime: getRandomWaitingTime()
        }
    }));
}

// Add hospital markers with enhanced information
function addHospitalMarkers(hospitals) {
    hospitals.forEach(hospital => {
        const marker = L.circleMarker([hospital.lat, hospital.lon], {
            radius: 8,
            fillColor: getStatusColor(hospital.enhancedData.status),
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });

        const popupContent = createPopupContent(hospital);
        marker.bindPopup(popupContent);
        marker.addTo(map);
    });

    updateHospitalStats(hospitals);
    statusElement.classList.remove('loading');
}

// Create detailed popup content
function createPopupContent(hospital) {
    const name = hospital.tags.name || 'Unnamed Hospital';
    const { enhancedData } = hospital;
    
    return `
        <div class="custom-popup">
            <div class="popup-header">
                <h3>${name}</h3>
                <button onclick="toggleFavorite('${name}')" class="favorite-btn">
                    ${isFavorite(name) ? '★' : '☆'}
                </button>
            </div>
            
            <div class="status-indicator">
                <span class="status-dot status-${enhancedData.status}"></span>
                <span>${facilityStatus[enhancedData.status].text}</span>
            </div>

            <p><strong>Waiting Time:</strong> ${enhancedData.waitingTime}</p>
            <p><strong>Bed Availability:</strong> ${enhancedData.bedAvailability}</p>
            
            <div class="specialties-section">
                <strong>Available Specialties:</strong><br>
                ${enhancedData.specialtiesAvailable.map(specialty => 
                    `<span class="facility-badge">${specialties[specialty].icon} ${specialties[specialty].name}</span>`
                ).join('')}
            </div>

            <div class="facilities-section">
                ${enhancedData.hasBloodBank ? '<span class="facility-badge">🩸 Blood Bank</span>' : ''}
                ${enhancedData.hasParking ? '<span class="facility-badge">🅿️ Parking</span>' : ''}
                ${enhancedData.wheelchairAccessible ? '<span class="facility-badge">♿ Wheelchair Access</span>' : ''}
            </div>

            <p><strong>Insurance Accepted:</strong> ${enhancedData.insuranceAccepted.join(', ')}</p>
            
            <div class="action-buttons">
                <button onclick="getDirections(${hospital.lat}, ${hospital.lon})" class="control-btn">
                    <i class="fas fa-directions"></i> Directions
                </button>
                <button onclick="shareLocation(${hospital.lat}, ${hospital.lon}, '${name}')" class="control-btn">
                    <i class="fas fa-share"></i> Share
                </button>
            </div>
        </div>
    `;
}

// Helper functions for random data generation
function getRandomStatus() {
    return ['open', 'busy', 'closed'][Math.floor(Math.random() * 3)];
}

function getRandomBedCount() {
    return `${Math.floor(Math.random() * 50)} beds available`;
}

function getRandomSpecialties() {
    return Object.keys(specialties)
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 4) + 2);
}

function getRandomInsuranceList() {
    const insuranceProviders = ['Sehat Sahulat', 'EFU', 'Jubilee', 'Adamjee'];
    return insuranceProviders.filter(() => Math.random() > 0.5);
}

function getRandomWaitingTime() {
    return `${Math.floor(Math.random() * 60)} minutes`;
}

function getStatusColor(status) {
    return facilityStatus[status].color;
}

// Favorites system
function toggleFavorite(hospitalName) {
    let favorites = JSON.parse(localStorage.getItem('favoriteHospitals') || '[]');
    if (favorites.includes(hospitalName)) {
        favorites = favorites.filter(name => name !== hospitalName);
    } else {
        favorites.push(hospitalName);
    }
    localStorage.setItem('favoriteHospitals', JSON.stringify(favorites));
    updateFavoritesList();
}

function isFavorite(hospitalName) {
    const favorites = JSON.parse(localStorage.getItem('favoriteHospitals') || '[]');
    return favorites.includes(hospitalName);
}

function updateFavoritesList() {
    const favorites = JSON.parse(localStorage.getItem('favoriteHospitals') || '[]');
    const favoritesList = document.getElementById('favorites-list');
    if (favorites.length > 0) {
        favoritesList.innerHTML = `
            <h4>Favorite Hospitals</h4>
            ${favorites.map(name => `<div class="favorite-item">${name}</div>`).join('')}
        `;
    } else {
        favoritesList.innerHTML = '';
    }
}

// Night mode toggle
document.getElementById('toggleNightMode').addEventListener('click', function() {
    document.body.classList.toggle('night-mode');
});

// Filter and sort functionality
document.getElementById('specialtyFilter').addEventListener('change', filterHospitals);
document.getElementById('facilityFilter').addEventListener('change', filterHospitals);
document.getElementById('sortDistance').addEventListener('click', sortByDistance);

function filterHospitals() {
    // Implementation of filtering logic
}

function sortByDistance() {
    if (!userLocation) return;
    
    hospitalsData.sort((a, b) => {
        const distA = getDistance(userLocation, [a.lat, a.lon]);
        const distB = getDistance(userLocation, [b.lat, b.lon]);
        return distA - distB;
    });
    
    map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });
    
    addHospitalMarkers(hospitalsData);
}

// Distance calculation
function getDistance(point1, point2) {
    return map.distance(point1, point2);
}

// Share location
function shareLocation(lat, lon, hospitalName) {
    const url = `https://www.google.com/maps?q=${lat},${lon}`;
    if (navigator.share) {
        navigator.share({
            title: hospitalName,
            text: `Location of ${hospitalName}`,
            url: url
        });
    } else {
        window.open(url, '_blank');
    }
}

// Initialize the app
function initializeApp() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async function(position) {
            userLocation = [position.coords.latitude, position.coords.longitude];
            map.setView(userLocation, 13);

            // Add user location marker
            L.circleMarker(userLocation, {
                radius: 8,
                fillColor: '#4CAF50',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup('Your Location');

            // Get and display nearby hospitals
            hospitalsData = await getNearbyHospitals(userLocation[0], userLocation[1]);
            addHospitalMarkers(hospitalsData);
            updateFavoritesList();

        }, function(error) {
            handleLocationError(error);
        });
    } else {
        handleLocationError({ code: 0, message: "Geolocation not supported" });
    }
}

// Error handling
function handleLocationError(error) {
    console.error("Error getting location:", error);
    statusElement.textContent = "Error getting your location. Using default view.";
    map.setView([30.3753, 69.3451], 6);
}

// Start the app
initializeApp();