// Pinball Finder - Main JavaScript Application
let map;
let markers = [];
let userLocationMarker;
let searchMarker;
let poiMarkers = [];
let currentLayer = 'street';
let mapLayers = {
    street: null,
    satellite: null,
    terrain: null,
    dark: null
};

// Application state
const appState = {
    currentView: 'home',
    favorites: JSON.parse(localStorage.getItem('pinballFavorites')) || [],
    searchResults: [],
    filteredLocations: [],
    filteredMachines: [],
    currentTheme: localStorage.getItem('pinballTheme') || 'light',
    activeFilters: {
        locations: 'all',
        machines: 'all'
    }
};

// Initialize theme
function initTheme() {
    document.documentElement.setAttribute('data-theme', appState.currentTheme);
    const themeIcon = document.querySelector('#theme-toggle i');
    if (appState.currentTheme === 'dark') {
        themeIcon.className = 'fas fa-sun';
    } else {
        themeIcon.className = 'fas fa-moon';
    }
}

// Toggle theme
function toggleTheme() {
    if (appState.currentTheme === 'light') {
        appState.currentTheme = 'dark';
    } else {
        appState.currentTheme = 'light';
    }
    localStorage.setItem('pinballTheme', appState.currentTheme);
    initTheme();
}

function initMap() {
    // Default to world view
    const defaultLat = 20;
    const defaultLng = 0;
    
    // Initialize map with world view
    map = L.map('map', {
        zoomControl: false,
        scrollWheelZoom: true,
        smoothWheelZoom: true,
        smoothSensitivity: 1.5,
        minZoom: 2,
        worldCopyJump: true
    }).setView([defaultLat, defaultLng], 2);
    
    // Add tile layers
    mapLayers.street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    mapLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    });
    
    mapLayers.terrain = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
        maxZoom: 17
    });
    
    mapLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    });
    
    // Add sample pinball locations
    addSampleLocations();
    
    // Initialize components
    initMapControls();
    initLocationList();
    initSearch();
    initNavigation();
    loadViewData();
    initTheme();
}

// Initialize navigation functionality
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageTitle = document.getElementById('page-title');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            if (this.id === 'about-nav-btn') {
                document.getElementById('about-modal').classList.add('active');
                return;
            }
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            switchView(view);
            updatePageTitle(view);
        });
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', function() {
        refreshData();
    });
    
    // About close button
    document.getElementById('about-close').addEventListener('click', function() {
        document.getElementById('about-modal').classList.remove('active');
    });
    
    // Close about modal when clicking outside
    document.getElementById('about-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // Search results close button
    document.getElementById('search-results-close').addEventListener('click', function() {
        document.getElementById('search-results-panel').style.display = 'none';
    });
    
    // Search filter buttons
    const searchActions = document.querySelectorAll('.map-search-action');
    searchActions.forEach(action => {
        action.addEventListener('click', function() {
            searchActions.forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            const filterType = this.id.replace('search-', '');
            filterSearchResults(filterType);
        });
    });
}

// Filter search results
function filterSearchResults(filterType) {
    const locations = getSampleLocations();
    let filtered = [];
    
    switch(filterType) {
        case 'all':
            filtered = locations;
            break;
        case 'favorites':
            filtered = locations.filter(location => appState.favorites.includes(location.id));
            break;
        case 'open':
            filtered = locations.filter(loc => !loc.name.includes('Barcade'));
            break;
    }
    
    updateMapMarkers(filtered);
    
    if (document.getElementById('search-results-panel').style.display === 'block') {
        showSearchResults(filtered);
    }
}

// Update map markers based on filter
function updateMapMarkers(locations) {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng], { 
            icon: L.divIcon({
                className: 'pinball-marker',
                iconSize: [24, 24],
                html: ''
            })
        })
        .addTo(map)
        .bindPopup(`
            <div class="popup-title">${location.name}</div>
            <div class="popup-address">${location.address}</div>
            <div class="popup-machines">${location.machines.length} machines available</div>
        `);
        
        marker.locationId = location.id;
        
        marker.on('click', function() {
            showLocationDetails(location);
            highlightMarker(marker);
            
            document.querySelectorAll('.location-list-item').forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.getAttribute('data-id')) === location.id) {
                    item.classList.add('active');
                }
            });
        });
        
        markers.push(marker);
    });
}

// Switch between different views
function switchView(view) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    document.getElementById(`${view}-view`).classList.add('active');
    appState.currentView = view;
    loadViewData(view);
}

// Update page title based on current view
function updatePageTitle(view) {
    const titles = {
        'home': 'Pinball Locations',
        'search': 'Search Locations',
        'locations': 'All Locations', 
        'machines': 'Pinball Machines',
        'favorites': 'Favorite Locations'
    };
    
    document.getElementById('page-title').textContent = titles[view] || 'Pinball Finder';
}

// Load data for the current view
function loadViewData(view = appState.currentView) {
    switch(view) {
        case 'home':
            break;
        case 'search':
            loadSearchView();
            break;
        case 'locations':
            loadLocationsView();
            break;
        case 'machines':
            loadMachinesView();
            break;
        case 'favorites':
            loadFavoritesView();
            break;
    }
}

// Load search view with filters and results
function loadSearchView() {
    const searchResults = document.getElementById('search-results');
    const locations = getSampleLocations();
    
    searchResults.innerHTML = '';
    
    locations.forEach(location => {
        const listItem = createLocationListItem(location);
        searchResults.appendChild(listItem);
    });
    
    const filterOptions = document.querySelectorAll('#search-view .filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            filterOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            filterSearchResults(this.textContent);
        });
    });
}

// Load all locations view
function loadLocationsView() {
    const allLocations = document.getElementById('all-locations');
    const locations = getSampleLocations();
    
    allLocations.innerHTML = '';
    
    locations.forEach(location => {
        const listItem = createLocationListItem(location);
        allLocations.appendChild(listItem);
    });
}

// Load machines view
function loadMachinesView() {
    const machineCards = document.getElementById('machine-cards');
    const machines = getAllMachines();
    
    machineCards.innerHTML = '';
    
    machines.forEach(machine => {
        const card = createMachineCard(machine);
        machineCards.appendChild(card);
    });
    
    const filterOptions = document.querySelectorAll('#machines-view .filter-option');
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            filterOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            filterMachines(this.textContent);
        });
    });
}

// Filter machines based on selected filter
function filterMachines(filter) {
    const machines = getAllMachines();
    let filtered = [];
    
    switch(filter) {
        case 'All Machines':
            filtered = machines;
            break;
        case 'Classic (Pre-2000)':
            filtered = machines.filter(machine => machine.year < 2000);
            break;
        case 'Modern':
            filtered = machines.filter(machine => machine.year >= 2000);
            break;
        case 'Rare':
            filtered = machines.filter(machine => 
                machine.name.includes('Medieval') || 
                machine.name.includes('Addams') ||
                machine.name.includes('Twilight')
            );
            break;
    }
    
    const machineCards = document.getElementById('machine-cards');
    machineCards.innerHTML = '';
    
    filtered.forEach(machine => {
        const card = createMachineCard(machine);
        machineCards.appendChild(card);
    });
}

// Load favorites view
function loadFavoritesView() {
    const favoritesGrid = document.getElementById('favorites-grid');
    
    favoritesGrid.innerHTML = '';
    
    if (appState.favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="no-location w-100">
                <i class="fas fa-star"></i>
                <h3>No Favorites Yet</h3>
                <p>Add locations to your favorites to see them here</p>
            </div>
        `;
        return;
    }
    
    appState.favorites.forEach(favoriteId => {
        const location = getSampleLocations().find(loc => loc.id === favoriteId);
        if (location) {
            const card = createFavoriteCard(location);
            favoritesGrid.appendChild(card);
        }
    });
}

// Create a location list item
function createLocationListItem(location) {
    const listItem = document.createElement('div');
    listItem.className = 'location-list-item';
    listItem.setAttribute('data-id', location.id);
    
    listItem.innerHTML = `
        <div class="location-list-icon">
            <i class="fas fa-map-pin"></i>
        </div>
        <div class="location-list-info">
            <div class="location-list-name">${location.name}</div>
            <div class="location-list-address">${location.address}</div>
        </div>
        <div class="location-list-distance">${location.distance}</div>
    `;
    
    listItem.addEventListener('click', function() {
        showLocationDetails(location);
        
        const marker = markers.find(m => m.locationId === location.id);
        if (marker) {
            highlightMarker(marker);
            map.setView([location.lat, location.lng], 15);
        }
        
        if (appState.currentView !== 'home') {
            switchView('home');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            document.querySelector('.nav-item[data-view="home"]').classList.add('active');
        }
    });
    
    return listItem;
}

// Create a machine card
function createMachineCard(machine) {
    const card = document.createElement('div');
    card.className = 'machine-card';
    
    card.innerHTML = `
        <div class="machine-card-header">
            <div class="machine-card-name">${machine.name}</div>
            <div class="machine-card-year">${machine.year}</div>
        </div>
        <div class="machine-card-locations">
            Available at ${machine.locations.length} location${machine.locations.length !== 1 ? 's' : ''}
        </div>
    `;
    
    card.addEventListener('click', function() {
        alert(`Showing details for ${machine.name}`);
    });
    
    return card;
}

// Create a favorite card
function createFavoriteCard(location) {
    const card = document.createElement('div');
    card.className = 'favorite-card';
    
    card.innerHTML = `
        <button class="favorite-remove" data-id="${location.id}">
            <i class="fas fa-times"></i>
        </button>
        <div class="location-name">${location.name}</div>
        <div class="location-address">${location.address}</div>
        <div class="location-distance">${location.distance}</div>
        <div class="d-flex mt-2">
            <span class="badge bg-primary me-2">${location.machines.length} Machines</span>
            <span class="badge bg-success">Open Now</span>
        </div>
    `;
    
    card.querySelector('.favorite-remove').addEventListener('click', function(e) {
        e.stopPropagation();
        removeFromFavorites(location.id);
    });
    
    card.addEventListener('click', function() {
        showLocationDetails(location);
        
        const marker = markers.find(m => m.locationId === location.id);
        if (marker) {
            highlightMarker(marker);
            map.setView([location.lat, location.lng], 15);
        }
        
        switchView('home');
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        document.querySelector('.nav-item[data-view="home"]').classList.add('active');
    });
    
    return card;
}

// Add location to favorites
function addToFavorites(locationId) {
    if (!appState.favorites.includes(locationId)) {
        appState.favorites.push(locationId);
        localStorage.setItem('pinballFavorites', JSON.stringify(appState.favorites));
        showNotification('Location added to favorites!');
        
        if (appState.currentView === 'favorites') {
            loadFavoritesView();
        }
    }
}

// Remove location from favorites
function removeFromFavorites(locationId) {
    appState.favorites = appState.favorites.filter(id => id !== locationId);
    localStorage.setItem('pinballFavorites', JSON.stringify(appState.favorites));
    showNotification('Location removed from favorites');
    loadFavoritesView();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'alert alert-success position-fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '2000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Refresh data
function refreshData() {
    showNotification('Refreshing data...');
    setTimeout(() => {
        showNotification('Data refreshed successfully!');
        loadViewData();
    }, 1000);
}

// Get all machines from all locations
function getAllMachines() {
    const locations = getSampleLocations();
    const machineMap = new Map();
    
    locations.forEach(location => {
        location.machines.forEach(machine => {
            if (!machineMap.has(machine.name)) {
                machineMap.set(machine.name, {
                    name: machine.name,
                    year: machine.year,
                    locations: [location.name]
                });
            } else {
                const existing = machineMap.get(machine.name);
                existing.locations.push(location.name);
            }
        });
    });
    
    return Array.from(machineMap.values());
}

// Initialize map control buttons
function initMapControls() {
    // Zoom in
    document.getElementById('zoom-in').addEventListener('click', function() {
        map.zoomIn();
    });
    
    // Zoom out
    document.getElementById('zoom-out').addEventListener('click', function() {
        map.zoomOut();
    });
    
    // Reset view
    document.getElementById('reset-view').addEventListener('click', function() {
        map.setView([20, 0], 2);
    });
    
    // Toggle location list
    document.getElementById('toggle-location-list').addEventListener('click', function() {
        const locationList = document.getElementById('location-list');
        if (locationList.style.display === 'block') {
            locationList.style.display = 'none';
        } else {
            locationList.style.display = 'block';
        }
    });
    
    // Close location list
    document.getElementById('location-list-close').addEventListener('click', function() {
        document.getElementById('location-list').style.display = 'none';
    });
    
    // Toggle layers panel
    document.getElementById('toggle-layers').addEventListener('click', function() {
        const layersPanel = document.getElementById('map-layers');
        if (layersPanel.style.display === 'block') {
            layersPanel.style.display = 'none';
        } else {
            layersPanel.style.display = 'block';
        }
    });
    
    // Map type selection
    const mapTypeButtons = document.querySelectorAll('.map-type-btn');
    mapTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            mapTypeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            changeMapLayer(type);
        });
    });
    
    // Map layers selection
    const mapLayersOptions = document.querySelectorAll('.map-layers-option');
    mapLayersOptions.forEach(option => {
        option.addEventListener('click', function() {
            this.classList.toggle('active');
            const layerType = this.getAttribute('data-layer');
            toggleMapLayer(layerType, this.classList.contains('active'));
        });
    });
}

// Toggle map layers
function toggleMapLayer(layerType, isActive) {
    if (!isActive) {
        poiMarkers.forEach(marker => {
            if (marker.layerType === layerType) {
                map.removeLayer(marker);
            }
        });
        poiMarkers = poiMarkers.filter(marker => marker.layerType !== layerType);
        return;
    }
    
    const samplePOIs = getSamplePOIs(layerType);
    
    samplePOIs.forEach(poi => {
        const marker = L.marker([poi.lat, poi.lng], {
            icon: L.divIcon({
                className: `poi-marker ${layerType}`,
                html: `<div style="background-color: ${poi.color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);"></div>`,
                iconSize: [16, 16]
            })
        })
        .addTo(map)
        .bindPopup(`
            <div class="popup-title">${poi.name}</div>
            <div class="popup-address">${poi.address}</div>
            <div class="popup-machines">${poi.type}</div>
        `);
        
        marker.layerType = layerType;
        poiMarkers.push(marker);
    });
}

// Get sample Points of Interest
function getSamplePOIs(layerType) {
    const baseLat = 14.5995;
    const baseLng = 120.9842;
    
    if (layerType === 'places') {
        return [
            {
                name: "Jollibee",
                lat: baseLat + (Math.random() - 0.5) * 0.1,
                lng: baseLng + (Math.random() - 0.5) * 0.1,
                address: "Fast Food Restaurant",
                type: "Restaurant",
                color: "#FF5252"
            },
            {
                name: "McDonald's",
                lat: baseLat + (Math.random() - 0.5) * 0.1,
                lng: baseLng + (Math.random() - 0.5) * 0.1,
                address: "Fast Food Restaurant",
                type: "Restaurant",
                color: "#FF5252"
            }
        ];
    } else if (layerType === 'landmarks') {
        return [
            {
                name: "Rizal Park",
                lat: baseLat + 0.01,
                lng: baseLng + 0.01,
                address: "Historical Park",
                type: "Landmark",
                color: "#2196F3"
            }
        ];
    }
    
    return [];
}

// Initialize search functionality
function initSearch() {
    const searchInput = document.getElementById('map-search-input');
    const searchBox = document.getElementById('map-search-box');
    const suggestions = document.getElementById('search-suggestions');
    const clearButton = document.getElementById('clear-search');
    
    searchInput.addEventListener('focus', function() {
        searchBox.classList.add('expanded');
        suggestions.style.display = 'block';
        showSearchSuggestions();
    });
    
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        searchInput.focus();
        hideSearchSuggestions();
        if (searchMarker) {
            map.removeLayer(searchMarker);
            searchMarker = null;
        }
        document.getElementById('search-results-panel').style.display = 'none';
    });
    
    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target)) {
            hideSearchSuggestions();
        }
    });
    
    searchInput.addEventListener('input', function() {
        if (this.value.length > 0) {
            showSearchSuggestions();
        } else {
            hideSearchSuggestions();
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performLocationSearch(this.value);
        }
    });
}

// Perform search for any location worldwide
function performLocationSearch(query) {
    if (!query.trim()) return;
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                
                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }
                
                searchMarker = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'search-marker',
                        html: '<div style="background-color: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20]
                    })
                })
                .addTo(map)
                .bindPopup(`
                    <div class="popup-title">${result.display_name}</div>
                    <div class="popup-address">${result.type}</div>
                `)
                .openPopup();
                
                map.setView([lat, lng], 13);
                hideSearchSuggestions();
                showNotification(`Navigated to ${query}`);
                checkPinballAvailability(lat, lng);
            } else {
                showNotification('Location not found');
            }
        })
        .catch(error => {
            console.error('Error searching location:', error);
            showNotification('Error searching location. Please try again.');
        });
}

// Check for pinball locations in the searched area
function checkPinballAvailability(lat, lng) {
    const locations = getSampleLocations();
    const radius = 0.5;
    
    const nearbyLocations = locations.filter(location => {
        const distance = Math.sqrt(
            Math.pow(location.lat - lat, 2) + 
            Math.pow(location.lng - lng, 2)
        );
        return distance < radius;
    });
    
    if (nearbyLocations.length > 0) {
        showSearchResults(nearbyLocations);
        showNotification(`Found ${nearbyLocations.length} pinball location${nearbyLocations.length !== 1 ? 's' : ''} in this area`);
    } else {
        showNotification('No pinball locations found in this area');
    }
}

// Show search results in panel
function showSearchResults(results) {
    const resultsContainer = document.getElementById('search-results-items');
    resultsContainer.innerHTML = '';
    
    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'location-list-item';
        resultItem.innerHTML = `
            <div class="location-list-icon" style="background-color: #4CAF50;">
                <i class="fas fa-map-pin"></i>
            </div>
            <div class="location-list-info">
                <div class="location-list-name">${result.name}</div>
                <div class="location-list-address">${result.address}</div>
            </div>
            <div class="location-list-distance">${result.distance}</div>
        `;
        
        resultItem.addEventListener('click', function() {
            const lat = result.lat;
            const lng = result.lng;
            
            if (searchMarker) {
                map.removeLayer(searchMarker);
            }
            
            searchMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'search-marker',
                    html: '<div style="background-color: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);"></div>',
                    iconSize: [20, 20]
                })
            })
            .addTo(map)
            .bindPopup(`
                <div class="popup-title">${result.name}</div>
                <div class="popup-address">${result.address}</div>
            `)
            .openPopup();
            
            map.setView([lat, lng], 15);
            showLocationDetails(result);
            document.getElementById('search-results-panel').style.display = 'none';
        });
        
        resultsContainer.appendChild(resultItem);
    });
    
    document.getElementById('search-results-panel').style.display = 'block';
}

// Show search suggestions
function showSearchSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    const searchInput = document.getElementById('map-search-input').value.toLowerCase();
    
    suggestions.innerHTML = '';
    
    const locations = getSampleLocations();
    const filteredLocations = locations.filter(location => 
        location.name.toLowerCase().includes(searchInput) || 
        location.address.toLowerCase().includes(searchInput)
    );
    
    if (searchInput.length > 2) {
        const searchOption = document.createElement('div');
        searchOption.className = 'search-suggestion';
        searchOption.innerHTML = `
            <div class="suggestion-icon location">
                <i class="fas fa-search"></i>
            </div>
            <div class="suggestion-content">
                <div class="suggestion-title">Search for "${searchInput}"</div>
                <div class="suggestion-description">Find this location on the map</div>
            </div>
        `;
        
        searchOption.addEventListener('click', function() {
            performLocationSearch(searchInput);
            hideSearchSuggestions();
        });
        
        suggestions.appendChild(searchOption);
    }
    
    if (filteredLocations.length > 0) {
        filteredLocations.forEach(location => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.innerHTML = `
                <div class="suggestion-icon pinball">
                    <i class="fas fa-map-pin"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${location.name}</div>
                    <div class="suggestion-description">${location.address}</div>
                </div>
            `;
            
            suggestion.addEventListener('click', function() {
                document.getElementById('map-search-input').value = location.name;
                showLocationDetails(location);
                highlightMarker(markers.find(m => m.locationId === location.id));
                map.setView([location.lat, location.lng], 15);
                hideSearchSuggestions();
            });
            
            suggestions.appendChild(suggestion);
        });
    }
    
    if (searchInput.length === 0) {
        const popularSearches = [
            { name: "New York City", type: "city" },
            { name: "Tokyo", type: "city" },
            { name: "London", type: "city" },
            { name: "Los Angeles", type: "city" }
        ];
        
        popularSearches.forEach(search => {
            const suggestion = document.createElement('div');
            suggestion.className = 'search-suggestion';
            suggestion.innerHTML = `
                <div class="suggestion-icon location">
                    <i class="fas fa-globe-americas"></i>
                </div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${search.name}</div>
                    <div class="suggestion-description">Search for ${search.type}</div>
                </div>
            `;
            
            suggestion.addEventListener('click', function() {
                performLocationSearch(search.name);
                hideSearchSuggestions();
            });
            
            suggestions.appendChild(suggestion);
        });
    }
    
    suggestions.style.display = 'block';
}

// Hide search suggestions
function hideSearchSuggestions() {
    const suggestions = document.getElementById('search-suggestions');
    const searchBox = document.getElementById('map-search-box');
    
    suggestions.style.display = 'none';
    searchBox.classList.remove('expanded');
}

// Change the map layer
function changeMapLayer(type) {
    if (mapLayers[currentLayer]) {
        map.removeLayer(mapLayers[currentLayer]);
    }
    
    if (mapLayers[type]) {
        map.addLayer(mapLayers[type]);
        currentLayer = type;
    }
}

// Initialize location list with sample data
function initLocationList() {
    const locationListItems = document.getElementById('location-list-items');
    const locations = getSampleLocations();
    
    locations.forEach(location => {
        const listItem = createLocationListItem(location);
        locationListItems.appendChild(listItem);
    });
}

// Get sample locations data
function getSampleLocations() {
    return [
        {
            id: 1,
            name: "Barcade Manhattan",
            lat: 40.7211,
            lng: -73.9573,
            address: "148 West 24th St, New York, NY 10011",
            distance: "0.8 km",
            hours: "Mon-Fri: 4pm-12am, Sat-Sun: 12pm-2am",
            phone: "(212) 582-4575",
            website: "www.barcade.com",
            machines: [
                { name: "The Addams Family", year: 1992 },
                { name: "Medieval Madness", year: 1997 },
                { name: "Attack from Mars", year: 1995 },
                { name: "Theatre of Magic", year: 1995 }
            ]
        },
        {
            id: 2,
            name: "Modern Pinball NYC",
            lat: 40.7589,
            lng: -73.9851,
            address: "362 8th Ave, New York, NY 10001",
            distance: "5.2 km",
            hours: "Daily: 11am-11pm",
            phone: "(212) 904-1543",
            website: "www.modernpinballnyc.com",
            machines: [
                { name: "Star Wars", year: 2017 },
                { name: "The Avengers", year: 2012 },
                { name: "The Walking Dead", year: 2014 },
                { name: "Game of Thrones", year: 2015 },
                { name: "AC/DC", year: 2012 }
            ]
        },
        {
            id: 3,
            name: "Four Quarters East London",
            lat: 51.5238,
            lng: -0.0765,
            address: "187 Rivington St, London EC2A 3EY, UK",
            distance: "572 km",
            hours: "Mon-Sat: 10am-10pm, Sun: 12pm-8pm",
            phone: "+44 20 7729 4782",
            website: "www.fourquarters.bar",
            machines: [
                { name: "The Getaway: High Speed II", year: 1992 },
                { name: "Twilight Zone", year: 1993 },
                { name: "Indiana Jones: The Pinball Adventure", year: 1993 },
                { name: "Terminator 2: Judgment Day", year: 1991 }
            ]
        }
    ];
}

// Add sample pinball locations to the map
function addSampleLocations() {
    const locations = getSampleLocations();
    
    const pinballIcon = L.divIcon({
        className: 'pinball-marker',
        iconSize: [24, 24],
        html: ''
    });
    
    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng], { icon: pinballIcon })
            .addTo(map)
            .bindPopup(`
                <div class="popup-title">${location.name}</div>
                <div class="popup-address">${location.address}</div>
                <div class="popup-machines">${location.machines.length} machines available</div>
            `);
        
        marker.locationId = location.id;
        
        marker.on('click', function() {
            showLocationDetails(location);
            highlightMarker(marker);
            
            document.querySelectorAll('.location-list-item').forEach(item => {
                item.classList.remove('active');
                if (parseInt(item.getAttribute('data-id')) === location.id) {
                    item.classList.add('active');
                }
            });
        });
        
        marker.on('mouseover', function() {
            marker.getElement().style.transform = 'scale(1.3)';
        });
        
        marker.on('mouseout', function() {
            marker.getElement().style.transform = 'scale(1)';
        });
        
        markers.push(marker);
    });
}

// Highlight the selected marker
function highlightMarker(selectedMarker) {
    markers.forEach(marker => {
        if (marker === selectedMarker) {
            marker.getElement().style.zIndex = '1000';
            marker.getElement().style.boxShadow = '0 0 0 3px rgba(253, 88, 0, 0.5)';
        } else {
            marker.getElement().style.zIndex = '500';
            marker.getElement().style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.3)';
        }
    });
}

// Show location details in the details panel
function showLocationDetails(location) {
    const homeView = document.getElementById('home-view');
    const isFavorite = appState.favorites.includes(location.id);
    
    let machinesHTML = '';
    location.machines.forEach(machine => {
        machinesHTML += `
            <div class="machine-item">
                <div class="machine-name">${machine.name}</div>
                <div class="machine-year">${machine.year}</div>
            </div>
        `;
    });
    
    homeView.innerHTML = `
        <div class="location-card active">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div class="location-name">${location.name}</div>
                    <div class="location-distance">${location.distance} away</div>
                </div>
                <button class="btn btn-sm ${isFavorite ? 'btn-primary' : 'btn-outline'}" id="favorite-btn" data-id="${location.id}">
                    <i class="fas fa-star"></i> ${isFavorite ? 'Favorited' : 'Favorite'}
                </button>
            </div>
            <div class="location-address">
                <i class="fas fa-map-marker-alt me-1"></i> ${location.address}
            </div>
            <div class="d-flex mt-2">
                <span class="badge bg-primary me-2">${location.machines.length} Machines</span>
                <span class="badge bg-success">Open Now</span>
            </div>
        </div>
        
        <div class="location-card">
            <h5 class="mb-3">Pinball Machines</h5>
            <div class="machine-list">
                ${machinesHTML}
            </div>
        </div>
        
        <div class="location-card">
            <h5 class="mb-3">Location Details</h5>
            <p><strong>Hours:</strong> ${location.hours}</p>
            <p><strong>Phone:</strong> ${location.phone}</p>
            <p><strong>Website:</strong> <a href="#" class="text-primary">${location.website}</a></p>
            <button class="btn btn-primary mt-2 w-100" id="get-directions-btn" data-lat="${location.lat}" data-lng="${location.lng}" data-name="${location.name}">
                <i class="fas fa-directions"></i> Get Directions
            </button>
        </div>
    `;
    
    document.getElementById('favorite-btn').addEventListener('click', function() {
        const locationId = parseInt(this.getAttribute('data-id'));
        
        if (appState.favorites.includes(locationId)) {
            removeFromFavorites(locationId);
            this.classList.remove('btn-primary');
            this.classList.add('btn-outline');
            this.innerHTML = '<i class="fas fa-star"></i> Favorite';
        } else {
            addToFavorites(locationId);
            this.classList.remove('btn-outline');
            this.classList.add('btn-primary');
            this.innerHTML = '<i class="fas fa-star"></i> Favorited';
        }
    });
    
    document.getElementById('get-directions-btn').addEventListener('click', function() {
        const lat = this.getAttribute('data-lat');
        const lng = this.getAttribute('data-lng');
        const name = this.getAttribute('data-name');
        
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(name)}`;
        window.open(url, '_blank');
        showNotification('Opening directions in Google Maps...');
    });
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                map.setView([lat, lng], 13);
                
                if (userLocationMarker) {
                    map.removeLayer(userLocationMarker);
                }
                
                userLocationMarker = L.marker([lat, lng], {
                    icon: L.divIcon({
                        className: 'pulse',
                        iconSize: [20, 20],
                        html: '<div class="pulse"></div>'
                    })
                })
                    .addTo(map)
                    .bindPopup("You are here!")
                    .openPopup();
            },
            error => {
                console.error("Error getting location:", error);
                alert("Unable to get your location. Please enable location services.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    
    const headerIcon = document.querySelector('.header-icon');
    headerIcon.addEventListener('mouseenter', function() {
        this.querySelector('i').style.transform = 'rotate(360deg)';
    });
    
    headerIcon.addEventListener('mouseleave', function() {
        this.querySelector('i').style.transform = 'rotate(0deg)';
    });
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(253, 88, 0, 0.15)';
            this.style.paddingLeft = '25px';
        });
        
        item.addEventListener('mouseleave', function() {
            if (!this.classList.contains('active')) {
                this.style.backgroundColor = 'transparent';
                this.style.paddingLeft = '20px';
            }
        });
    });
});