// Spotify Wrapped Frontend JavaScript

const API_BASE_URL = 'https://wrappedspotify-production.up.railway.app'; // Adjust this to your backend URL

class SpotifyWrapped {
    genreData = [];
    artistData = [];
    trackData = [];
    constructor() {
        this.accessToken = localStorage.getItem('accessToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('getStartedBtn').addEventListener('click', () => this.login());
    }

    checkAuthStatus() {
        if (this.accessToken) {
            this.showDashboard();
            this.loadAllData();
            this.showPieChart(); // langsung tampilkan pie chart setelah login
        }
    }

    login() {
        window.location.href = `${API_BASE_URL}/auth/login`;
    }

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.accessToken = null;
        this.refreshToken = null;
        this.showHero();
    }

    showDashboard() {
        document.getElementById('hero').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('loginBtn').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
    }

    showHero() {
        document.getElementById('hero').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('loginBtn').classList.remove('hidden');
        document.getElementById('logoutBtn').classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loadingSpinner').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingSpinner').classList.add('hidden');
    }

    async loadAllData() {
        this.showLoading();
        try {
            await Promise.all([
                this.loadTopTracks(),
                this.loadTopArtists(),
                this.loadTopGenres(),
                this.loadWrappedData()
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            this.handleError(error);
        } finally {
            this.hideLoading();
        }
    }

    async apiRequest(endpoint) {
        // Tambahkan access_token ke query string jika endpoint membutuhkan
        let url = `${API_BASE_URL}${endpoint}`;
        const needsToken = [
            '/spotify/top-tracks',
            '/spotify/top-artists',
            '/spotify/top-genres',
            '/spotify/wrapped'
        ];
        for (const path of needsToken) {
            if (endpoint.startsWith(path)) {
                // Pisahkan path dan query
                let [base, queryString] = endpoint.split('?');
                let params = new URLSearchParams(queryString || '');
                params.set('access_token', this.accessToken);
                if (path === '/spotify/wrapped') {
                    params.set('refresh_token', this.refreshToken);
                }
                url = `${API_BASE_URL}${base}?${params.toString()}`;
                break;
            }
        }
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 401) {
                await this.refreshAccessToken();
                return this.apiRequest(endpoint);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async refreshAccessToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.access_token;
                localStorage.setItem('accessToken', this.accessToken);
            } else {
                this.logout();
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.logout();
        }
    }

    async loadTopTracks() {
        try {
            const tracks = await this.apiRequest('/spotify/top-tracks');
            this.trackData = tracks;
            this.renderTopTracks(tracks);
        } catch (error) {
            console.error('Error loading top tracks:', error);
        }
    }

    async loadTopArtists() {
        try {
            const artists = await this.apiRequest('/spotify/top-artists');
            this.artistData = artists;
            this.renderTopArtists(artists);
        } catch (error) {
            console.error('Error loading top artists:', error);
        }
    }

    async loadTopGenres() {
        try {
            const genres = await this.apiRequest('/spotify/top-genres');
            this.genreData = genres;
            this.renderTopGenres(genres);
            this.renderPieChart(genres);
        } catch (error) {
            console.error('Error loading top genres:', error);
        }
    }
    renderPieChart(type = 'genre') {
        let labels = [];
        let data = [];
        let backgroundColors = [];
        let title = '';
        if (type === 'genre') {
            const genreCount = {};
            this.genreData.forEach(g => {
                if (typeof g === 'string') {
                    genreCount[g] = (genreCount[g] || 0) + 1;
                } else if (g.genre && g.count) {
                    genreCount[g.genre] = g.count;
                }
            });
            labels = Object.keys(genreCount);
            data = Object.values(genreCount);
            title = 'Your Genre Distribution';
        } else if (type === 'artist') {
            labels = this.artistData.map(a => a.name);
            data = this.artistData.map(a => a.popularity || 1);
            title = 'Your Top Artists (by Popularity)';
        } else if (type === 'track') {
            labels = this.trackData.map(t => t.name);
            data = this.trackData.map(t => t.popularity || 1);
            title = 'Your Top Tracks (by Popularity)';
        } else if (type === 'all') {
            // Gabungkan genre, artist, track
            labels = [
                ...this.genreData.slice(0, 5).map(g => (typeof g === 'string' ? g : g.genre)),
                ...this.artistData.slice(0, 3).map(a => a.name),
                ...this.trackData.slice(0, 3).map(t => t.name)
            ];
            data = [
                ...this.genreData.slice(0, 5).map(g => (typeof g === 'string' ? 1 : g.count)),
                ...this.artistData.slice(0, 3).map(a => a.popularity || 1),
                ...this.trackData.slice(0, 3).map(t => t.popularity || 1)
            ];
            title = 'Your Wrapped: Genre, Artist, Track';
        }
        backgroundColors = labels.map(() => `hsl(${Math.random()*360},70%,60%)`);
        if (this.mainPieChart) {
            this.mainPieChart.destroy();
        }
        const ctx = document.getElementById('mainPieChart').getContext('2d');
        this.mainPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff' } },
                }
            }
        });
        document.getElementById('pieChartTitle').textContent = title;
    }

    showPieChart() {
        document.getElementById('pieChartSection').classList.remove('hidden');
    }
    hidePieChart() {
        document.getElementById('pieChartSection').classList.add('hidden');
    }

    async loadWrappedData() {
        try {
            const wrappedData = await this.apiRequest('/spotify/wrapped');
            this.renderWrappedSummary(wrappedData);
        } catch (error) {
            console.error('Error loading wrapped data:', error);
        }
    }

    renderTopTracks(tracks) {
        const container = document.getElementById('topTracks');
        container.innerHTML = '';

        tracks.slice(0, 5).forEach((track, index) => {
            const trackElement = document.createElement('div');
            trackElement.className = 'track-item fade-in';
            trackElement.style.animationDelay = `${index * 0.1}s`;
            
            trackElement.innerHTML = `
                <div class="track-number">${index + 1}</div>
                <div class="track-info">
                    <div class="track-name">${track.name}</div>
                    <div class="track-artist">${track.artists.join(', ')}</div>
                </div>
            `;
            
            container.appendChild(trackElement);
        });
    }

    renderTopArtists(artists) {
        const container = document.getElementById('topArtists');
        container.innerHTML = '';

        artists.slice(0, 5).forEach((artist, index) => {
            const artistElement = document.createElement('div');
            artistElement.className = 'artist-card fade-in';
            artistElement.style.animationDelay = `${index * 0.1}s`;
            
            artistElement.innerHTML = `
                <div class="artist-image"></div>
                <div class="artist-name font-bold">${artist.name}</div>
                <div class="text-sm text-gray-400">${artist.genres.join(', ')}</div>
            `;
            
            container.appendChild(artistElement);
        });
    }

    renderTopGenres(genres) {
        const container = document.getElementById('topGenres');
        container.innerHTML = '';

        genres.slice(0, 10).forEach((genre, index) => {
            const genreElement = document.createElement('span');
            genreElement.className = 'genre-pill fade-in';
            genreElement.style.animationDelay = `${index * 0.05}s`;
            genreElement.textContent = genre;
            
            container.appendChild(genreElement);
        });
    }

    renderWrappedSummary(data) {
        const container = document.getElementById('wrappedSummary');
        container.innerHTML = '';

        const summaryCards = [
            {
                title: 'Total Listening Time',
                value: this.formatListeningTime(data.total_listening_time),
                icon: '🎵'
            },
            {
                title: 'Top Genre',
                value: data.top_genre || 'Not available',
                icon: '🎸'
            },
            {
                title: 'Favorite Artist',
                value: data.top_artist || 'Not available',
                icon: '🎤'
            },
            {
                title: 'Most Played Track',
                value: data.top_track || 'Not available',
                icon: '🎶'
            }
        ];

        summaryCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'bg-gray-700 rounded-lg p-6 text-center fade-in';
            cardElement.style.animationDelay = `${index * 0.1}s`;
            
            cardElement.innerHTML = `
                <div class="text-4xl mb-2">${card.icon}</div>
                <h4 class="text-lg font-semibold mb-2">${card.title}</h4>
                <p class="text-2xl font-bold text-green-400">${card.value}</p>
            `;
            
            container.appendChild(cardElement);
        });
    }

    formatListeningTime(minutes) {
        if (!minutes) return '0 minutes';
        
        if (minutes < 60) {
            return `${Math.round(minutes)} minutes`;
        } else if (minutes < 1440) {
            return `${Math.round(minutes / 60)} hours`;
        } else {
            return `${Math.round(minutes / 1440)} days`;
        }
    }

    handleError(error) {
        console.error('API Error:', error);
        alert('Error loading data. Please try again later.');
    }
}

// Handle OAuth callback
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const refresh = urlParams.get('refresh');
    
    if (token && refresh) {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refresh);
        window.history.replaceState({}, document.title, '/');
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    handleOAuthCallback();
    const app = new SpotifyWrapped();
    document.getElementById('pieChartGenreBtn').addEventListener('click', () => {
        app.showPieChart();
        app.renderPieChart('genre');
    });
    document.getElementById('pieChartArtistBtn').addEventListener('click', () => {
        app.showPieChart();
        app.renderPieChart('artist');
    });
    document.getElementById('pieChartTrackBtn').addEventListener('click', () => {
        app.showPieChart();
        app.renderPieChart('track');
    });
    document.getElementById('pieChartAllBtn').addEventListener('click', () => {
        app.showPieChart();
        app.renderPieChart('all');
    });
    document.getElementById('receiptBtn').addEventListener('click', () => {
        app.hidePieChart();
        // Nanti bisa tambahkan showReceipt() di sini
    });
});
