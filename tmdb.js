const dotenv = require('dotenv');
dotenv.config();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is not defined in environment variables');
}

async function getMeta(id, type) {
    let url;
    let isIMDbId = id.startsWith('tt');

    if (isIMDbId) {
        url = `https://api.themoviedb.org/3/find/${id}?api_key=${TMDB_API_KEY}&external_source=imdb_id&language=es-ES`;
    } else {
        url = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${id}?api_key=${TMDB_API_KEY}&language=es-ES`;
    }
    const res = await fetch(url);
    const data = await res.json();

    let result;
    if (isIMDbId) {
        result = (type === 'movie') ? data.movie_results[0] : data.tv_results[0];
    } else {
        result = data;
    }

    if (!result) return null;

    let detailsData = result;
    if (isIMDbId) {
        const detailsUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${result.id}?api_key=${TMDB_API_KEY}&language=es-ES`;
        const detailsRes = await fetch(detailsUrl);
        detailsData = await detailsRes.json();
    }

    let lastEpisodeDate = null;
    if (type === 'series' && detailsData.last_episode_to_air) {
        lastEpisodeDate = detailsData.last_episode_to_air.air_date;
    }

    // Obtener logo
    const logoUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${result.id}/images?api_key=${TMDB_API_KEY}`;
    const logoRes = await fetch(logoUrl);
    const logoData = await logoRes.json();
    let logoImage = null;
    if (logoData.logos && logoData.logos.length > 0) {
        const logo = logoData.logos.find(img => img.iso_639_1 === 'es') || logoData.logos.find(img => img.iso_639_1 === null);
        logoImage = logo ? `https://image.tmdb.org/t/p/original${logo.file_path}` : null;
    }

    // Obtener reparto y dirección
    const creditsUrl = `https://api.themoviedb.org/3/${type === 'movie' ? 'movie' : 'tv'}/${result.id}/credits?api_key=${TMDB_API_KEY}&language=es-ES`;
    const creditsRes = await fetch(creditsUrl);
    const creditsData = await creditsRes.json();

    let cast = null;
    let directors = null;
    if (creditsData.cast && creditsData.cast.length > 0) {
        cast = creditsData.cast.slice(0, 10).map(actor => actor.name);
        cast = cast.join('#');
        directors = creditsData.crew.filter(person => person.job === 'Director').map(person => person.name);
        directors = directors.join('#');
    }


    return {
        id: `tmdb:${result.id}`,
        name: result.title || result.name,
        poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : null,
        background: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : null,
        logo: logoImage ? logoImage : null,
        description: result.overview,
        releaseDate: result.release_date || result.first_air_date || null,
        lastEpisodeDate: lastEpisodeDate,
        runtime: type === 'movie' ? detailsData.runtime : null,
        vote_average: result.vote_average || 0,
        cast,
        directors
    };
}

module.exports = {
    getMeta,
    TMDB_API_KEY
};
