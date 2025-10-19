<?php
// Pinball Finder - Main Application File
$page_title = "Pinball Finder - Find Pinball Machines Worldwide";
$locations = getSampleLocations();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $page_title; ?></title>
    
    <!-- External CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar Navigation -->
        <div class="sidebar">
            <div class="logo">
                <img src="pinball.png" alt="Pinball Finder Logo">
            </div>
            <div class="nav-item active" data-view="home">
                <i class="fas fa-home"></i>
                <span class="nav-text">Home</span>
            </div>
            <div class="nav-item" data-view="search">
                <i class="fas fa-search"></i>
                <span class="nav-text">Search</span>
            </div>
            <div class="nav-item" data-view="locations">
                <i class="fas fa-map-marker-alt"></i>
                <span class="nav-text">Locations</span>
            </div>
            <div class="nav-item" data-view="machines">
                <i class="fas fa-gamepad"></i>
                <span class="nav-text">Machines</span>
            </div>
            <div class="nav-item" data-view="favorites">
                <i class="fas fa-star"></i>
                <span class="nav-text">Favorites</span>
            </div>
            <div class="nav-item" id="about-nav-btn">
                <i class="fas fa-info-circle"></i>
                <span class="nav-text">About</span>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="header">
                <div class="header-left">
                    <div class="header-icon">
                        <i class="fas fa-map-pin"></i>
                    </div>
                    <h1 id="page-title">Pinball Locations</h1>
                </div>
                <div class="header-controls">
                    <button class="theme-toggle" id="theme-toggle" title="Toggle Dark Mode">
                        <i class="fas fa-moon"></i>
                    </button>
                    <button class="refresh-btn" id="refresh-btn" title="Refresh Data">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content Area -->
            <div class="content-area">
                <!-- Details Panel -->
                <div class="details-panel">
                    <!-- Home View -->
                    <div class="view active" id="home-view">
                        <div class="no-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <h3>Select a Location</h3>
                            <p>Click on a pinball location marker to see details</p>
                        </div>
                    </div>
                    
                    <!-- Search View -->
                    <div class="view" id="search-view">
                        <h3 class="mb-4">Advanced Search</h3>
                        <div class="search-filters">
                            <div class="filter-option active">All Locations</div>
                            <div class="filter-option">Near Me</div>
                            <div class="filter-option">Open Now</div>
                            <div class="filter-option">With Food</div>
                            <div class="filter-option">Free Play</div>
                        </div>
                        <div class="location-list-items" id="search-results"></div>
                    </div>
                    
                    <!-- Locations View -->
                    <div class="view" id="locations-view">
                        <h3 class="mb-4">All Locations</h3>
                        <div class="location-list-items" id="all-locations"></div>
                    </div>
                    
                    <!-- Machines View -->
                    <div class="view" id="machines-view">
                        <h3 class="mb-4">Pinball Machines</h3>
                        <div class="search-filters">
                            <div class="filter-option active">All Machines</div>
                            <div class="filter-option">Classic (Pre-2000)</div>
                            <div class="filter-option">Modern</div>
                            <div class="filter-option">Rare</div>
                        </div>
                        <div class="machine-cards" id="machine-cards"></div>
                    </div>
                    
                    <!-- Favorites View -->
                    <div class="view" id="favorites-view">
                        <h3 class="mb-4">Favorite Locations</h3>
                        <div class="favorites-grid" id="favorites-grid"></div>
                    </div>
                </div>
                
                <!-- Map Container -->
                <div class="map-container">
                    <div id="map"></div>
                    
                    <!-- Search Box -->
                    <div class="map-search-container">
                        <div class="map-search-box" id="map-search-box">
                            <div class="map-search-input-container">
                                <i class="fas fa-search map-search-icon"></i>
                                <input type="text" class="map-search-input" id="map-search-input" placeholder="Search for pinball locations or any address...">
                                <button class="map-search-action" id="clear-search">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                            <div class="map-search-actions">
                                <button class="map-search-action active" id="search-all">
                                    <i class="fas fa-map-marker-alt"></i> All Locations
                                </button>
                                <button class="map-search-action" id="search-favorites">
                                    <i class="fas fa-star"></i> Favorites
                                </button>
                                <button class="map-search-action" id="search-open">
                                    <i class="fas fa-clock"></i> Open Now
                                </button>
                            </div>
                        </div>
                        <div class="search-suggestions" id="search-suggestions"></div>
                    </div>
                    
                    <!-- Search Results Panel -->
                    <div class="search-results" id="search-results-panel">
                        <div class="search-results-header">
                            <div class="search-results-title">Search Results</div>
                            <button class="search-results-close" id="search-results-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="search-results-items" id="search-results-items"></div>
                    </div>
                    
                    <!-- Map Controls -->
                    <div class="map-controls">
                        <div class="map-control-group">
                            <button class="map-control-btn" id="zoom-in">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="map-control-btn" id="zoom-out">
                                <i class="fas fa-minus"></i>
                            </button>
                        </div>
                        <button class="map-control-btn" id="reset-view">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                        <button class="map-control-btn" id="toggle-location-list">
                            <i class="fas fa-list"></i>
                        </button>
                        <button class="map-control-btn" id="toggle-layers">
                            <i class="fas fa-layer-group"></i>
                        </button>
                    </div>
                    
                    <!-- Map Type Selector -->
                    <div class="map-type-selector">
                        <button class="map-type-btn active" id="map-type-street" data-type="street">
                            <i class="fas fa-road"></i>
                            <div class="map-type-tooltip">Default Map</div>
                        </button>
                        <button class="map-type-btn" id="map-type-satellite" data-type="satellite">
                            <i class="fas fa-globe-americas"></i>
                            <div class="map-type-tooltip">Satellite View</div>
                        </button>
                        <button class="map-type-btn" id="map-type-terrain" data-type="terrain">
                            <i class="fas fa-mountain"></i>
                            <div class="map-type-tooltip">Terrain View</div>
                        </button>
                        <button class="map-type-btn" id="map-type-dark" data-type="dark">
                            <i class="fas fa-moon"></i>
                            <div class="map-type-tooltip">Dark Mode</div>
                        </button>
                    </div>
                    
                    <!-- Map Layers -->
                    <div class="map-layers" id="map-layers">
                        <div class="map-layers-header">Map Details</div>
                        <div class="map-layers-options">
                            <div class="map-layers-option active" data-layer="traffic">
                                <i class="fas fa-traffic-light"></i>
                                <span>Traffic</span>
                            </div>
                            <div class="map-layers-option active" data-layer="transit">
                                <i class="fas fa-subway"></i>
                                <span>Transit</span>
                            </div>
                            <div class="map-layers-option" data-layer="biking">
                                <i class="fas fa-bicycle"></i>
                                <span>Biking</span>
                            </div>
                            <div class="map-layers-option" data-layer="places">
                                <i class="fas fa-utensils"></i>
                                <span>Restaurants</span>
                            </div>
                            <div class="map-layers-option" data-layer="landmarks">
                                <i class="fas fa-landmark"></i>
                                <span>Landmarks</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Location List -->
                    <div class="location-list" id="location-list">
                        <div class="location-list-header">
                            <div class="location-list-title">Nearby Locations</div>
                            <button class="location-list-close" id="location-list-close">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="location-list-items" id="location-list-items"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- About Modal -->
    <div class="about-modal" id="about-modal">
        <div class="about-content">
            <div class="about-header">
                <h2>About Pinball Finder</h2>
                <button class="about-close" id="about-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="about-body">
                <div class="about-hero">
                    <div class="hero-icon">
                        <i class="fas fa-map-pin"></i>
                    </div>
                    <h3 class="hero-title">Discover Pinball Machines Worldwide</h3>
                    <p class="hero-description">Your ultimate companion for finding pinball machines anywhere in the world</p>
                </div>

                <div class="about-grid">
                    <div class="about-card">
                        <div class="card-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <h4>Global Search</h4>
                        <p>Search for pinball locations in any city worldwide. Our advanced mapping technology helps you find machines wherever you are.</p>
                    </div>
                    
                    <div class="about-card">
                        <div class="card-icon">
                            <i class="fas fa-database"></i>
                        </div>
                        <h4>Live Database</h4>
                        <p>Access real-time information about pinball machine availability, locations, and operational status across the globe.</p>
                    </div>
                    
                    <div class="about-card">
                        <div class="card-icon">
                            <i class="fas fa-map-marked-alt"></i>
                        </div>
                        <h4>Interactive Maps</h4>
                        <p>Explore pinball locations with our intuitive map interface. See exactly where machines are located with detailed information.</p>
                    </div>
                    
                    <div class="about-card">
                        <div class="card-icon">
                            <i class="fas fa-star"></i>
                        </div>
                        <h4>Personal Collection</h4>
                        <p>Save your favorite locations and build your personal pinball destination list for quick access anytime.</p>
                    </div>
                </div>

                <div class="about-features">
                    <h4>How It Works</h4>
                    <div class="features-list">
                        <div class="feature-item">
                            <span class="feature-number">1</span>
                            <div class="feature-content">
                                <h5>Search Any Location</h5>
                                <p>Enter any city, address, or venue name to find pinball machines in that area</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <span class="feature-number">2</span>
                            <div class="feature-content">
                                <h5>View Machine Details</h5>
                                <p>See available pinball machines, their condition, and location information</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <span class="feature-number">3</span>
                            <div class="feature-content">
                                <h5>Get Directions</h5>
                                <p>One-click navigation to your chosen pinball location</p>
                            </div>
                        </div>
                        <div class="feature-item">
                            <span class="feature-number">4</span>
                            <div class="feature-content">
                                <h5>Save Favorites</h5>
                                <p>Build your personal collection of go-to pinball spots</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="about-mission">
                    <h4>Our Mission</h4>
                    <p>Pinball Finder is dedicated to connecting pinball enthusiasts with machines worldwide. We believe in preserving arcade culture and making it easy for everyone to enjoy the classic game of pinball, whether you're a casual player or serious collector.</p>
                    
                    <div class="mission-stats">
                        <div class="stat">
                            <div class="stat-number"><?php echo count($locations); ?>+</div>
                            <div class="stat-label">Locations</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">50+</div>
                            <div class="stat-label">Countries</div>
                        </div>
                        <div class="stat">
                            <div class="stat-number">1000+</div>
                            <div class="stat-label">Machines</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- External JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    
    <!-- Custom JS -->
    <script src="js/app.js"></script>
</body>
</html>

<?php
function getSampleLocations() {
    return [
        [
            'id' => 1,
            'name' => "Barcade Manhattan",
            'lat' => 40.7211,
            'lng' => -73.9573,
            'address' => "148 West 24th St, New York, NY 10011",
            'distance' => "0.8 km",
            'hours' => "Mon-Fri: 4pm-12am, Sat-Sun: 12pm-2am",
            'phone' => "(212) 582-4575",
            'website' => "www.barcade.com",
            'machines' => [
                ['name' => "The Addams Family", 'year' => 1992],
                ['name' => "Medieval Madness", 'year' => 1997],
                ['name' => "Attack from Mars", 'year' => 1995],
                ['name' => "Theatre of Magic", 'year' => 1995]
            ]
        ],
        [
            'id' => 2,
            'name' => "Modern Pinball NYC",
            'lat' => 40.7589,
            'lng' => -73.9851,
            'address' => "362 8th Ave, New York, NY 10001",
            'distance' => "5.2 km",
            'hours' => "Daily: 11am-11pm",
            'phone' => "(212) 904-1543",
            'website' => "www.modernpinballnyc.com",
            'machines' => [
                ['name' => "Star Wars", 'year' => 2017],
                ['name' => "The Avengers", 'year' => 2012],
                ['name' => "The Walking Dead", 'year' => 2014],
                ['name' => "Game of Thrones", 'year' => 2015],
                ['name' => "AC/DC", 'year' => 2012]
            ]
        ],
        [
            'id' => 3,
            'name' => "Four Quarters East London",
            'lat' => 51.5238,
            'lng' => -0.0765,
            'address' => "187 Rivington St, London EC2A 3EY, UK",
            'distance' => "572 km",
            'hours' => "Mon-Sat: 10am-10pm, Sun: 12pm-8pm",
            'phone' => "+44 20 7729 4782",
            'website' => "www.fourquarters.bar",
            'machines' => [
                ['name' => "The Getaway: High Speed II", 'year' => 1992],
                ['name' => "Twilight Zone", 'year' => 1993],
                ['name' => "Indiana Jones: The Pinball Adventure", 'year' => 1993],
                ['name' => "Terminator 2: Judgment Day", 'year' => 1991]
            ]
        ]
    ];
}
?>