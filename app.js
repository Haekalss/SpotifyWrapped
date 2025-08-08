// Spotify Wrapped Frontend JavaScript

const API_BASE_URL = 'http://localhost:8080'; // Adjust this to your backend URL

class SpotifyWrapped {
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
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        });

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
            this.renderTopTracks(tracks);
        } catch (error) {
            console.error('Error loading top tracks:', error);
        }
    }

    async loadTopArtists() {
        try {
            const artists = await this.apiRequest('/spotify/top-artists');
            this.renderTopArtists(artists);
        } catch (error) {
            console.error('Error loading top artists:', error);
        }
    }

    async loadTopGenres() {
        try {
            const genres = await this.apiRequest('/spotify/top-genres');
            this.renderTopGenres(genres);
        } catch (error) {
            console.error('Error loading top genres:', error);
        }
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
    new SpotifyWrapped();
});
