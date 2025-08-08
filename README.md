# Spotify Wrapped Frontend

A modern, responsive frontend for the Spotify Wrapped backend built with vanilla JavaScript, HTML, and Tailwind CSS.

## Features

- **OAuth Integration**: Seamless Spotify login flow
- **Top Tracks**: Display user's most played tracks
- **Top Artists**: Show favorite artists with genre information
- **Top Genres**: Visual representation of music preferences
- **Wrapped Summary**: Comprehensive overview of listening habits
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Spotify-inspired dark theme with green accents

## Setup

1. **Backend Configuration**: Ensure your Spotify Wrapped backend is running on `http://localhost:8080` or update the `API_BASE_URL` in `app.js`

2. **Frontend Setup**:
   - No build process required - this is vanilla JavaScript
   - Simply open `index.html` in your browser
   - Or serve the files using any static file server

3. **Environment Variables** (Backend):
   - Make sure your backend has these environment variables set:
     - `SPOTIFY_CLIENT_ID`
     - `SPOTIFY_CLIENT_SECRET`
     - `SPOTIFY_REDIRECT_URI` (should point to your backend callback)

## File Structure

```
FrontendWrapped/
├── index.html          # Main HTML file
├── app.js             # Main JavaScript application
├── styles.css         # Custom CSS styles
└── README.md          # This file
```

## Usage

1. Open `index.html` in your browser
2. Click "Login with Spotify" to authenticate
3. After successful login, your Spotify data will be displayed
4. View your top tracks, artists, genres, and wrapped summary

## API Endpoints Used

- `GET /auth/login` - Spotify OAuth login
- `GET /spotify/top-tracks` - Get user's top tracks
- `GET /spotify/top-artists` - Get user's top artists
- `GET /spotify/top-genres` - Get user's top genres
- `GET /spotify/wrapped` - Get comprehensive wrapped data
- `POST /auth/refresh` - Refresh access token

## Customization

- **Colors**: Modify the Tailwind classes in `index.html` and `styles.css`
- **API URL**: Update `API_BASE_URL` in `app.js` to point to your backend
- **Styling**: Add custom styles in `styles.css`
- **Features**: Extend the JavaScript in `app.js` to add more functionality

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Development

To run a local development server:

```bash
# Using Python
python -m http.server 3000

# Using Node.js (if you have http-server installed)
npx http-server -p 3000

# Using PHP
php -S localhost:3000
```

Then visit `http://localhost:3000`
