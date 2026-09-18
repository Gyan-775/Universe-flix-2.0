CREATE TABLE IF NOT EXISTS movies (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  original_title TEXT,
  release_date DATE,
  year INTEGER,
  overview TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  runtime INTEGER,
  tmdb_rating NUMERIC(4,2),
  tmdb_vote_count INTEGER,
  imdb_rating NUMERIC(4,2),
  imdb_id TEXT,
  imdb_url TEXT,
  popularity NUMERIC(12,4),
  trailer_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS movies_release_date_idx ON movies (release_date DESC);
CREATE INDEX IF NOT EXISTS movies_rating_idx ON movies (tmdb_rating DESC);
CREATE INDEX IF NOT EXISTS movies_popularity_idx ON movies (popularity DESC);

CREATE TABLE IF NOT EXISTS universes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  poster_path TEXT,
  backdrop_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS genres (
  id BIGSERIAL PRIMARY KEY,
  tmdb_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS movie_genres (movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE, PRIMARY KEY (movie_id, genre_id));
CREATE INDEX IF NOT EXISTS movie_genres_genre_idx ON movie_genres (genre_id);
CREATE TABLE IF NOT EXISTS universe_movies (movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, universe_id BIGINT NOT NULL REFERENCES universes(id) ON DELETE CASCADE, membership_type TEXT NOT NULL DEFAULT 'primary', position INTEGER, PRIMARY KEY (movie_id, universe_id));
CREATE INDEX IF NOT EXISTS universe_movies_universe_idx ON universe_movies (universe_id, membership_type);
CREATE TABLE IF NOT EXISTS movie_cast (id BIGSERIAL PRIMARY KEY, movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, person_tmdb_id INTEGER, name TEXT NOT NULL, character_name TEXT, profile_path TEXT, cast_order INTEGER, UNIQUE (movie_id, person_tmdb_id));
CREATE TABLE IF NOT EXISTS movie_directors (movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, person_tmdb_id INTEGER, name TEXT NOT NULL, PRIMARY KEY (movie_id, person_tmdb_id));
CREATE TABLE IF NOT EXISTS movie_videos (id BIGSERIAL PRIMARY KEY, movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, tmdb_video_id TEXT UNIQUE, name TEXT, site TEXT, video_key TEXT, video_type TEXT, official BOOLEAN);
CREATE TABLE IF NOT EXISTS watch_order_relationships (from_movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, to_movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE, relationship_type TEXT NOT NULL CHECK (relationship_type IN ('prerequisite','recommended_before','release_order')), position INTEGER, PRIMARY KEY (from_movie_id, to_movie_id, relationship_type));

CREATE TABLE IF NOT EXISTS anonymous_sessions (id UUID PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS anonymous_taste_profiles (session_id UUID PRIMARY KEY REFERENCES anonymous_sessions(id) ON DELETE CASCADE, profile JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS anonymous_interactions (id BIGSERIAL PRIMARY KEY, session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE, event_type TEXT NOT NULL, movie_id BIGINT REFERENCES movies(id) ON DELETE SET NULL, payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE INDEX IF NOT EXISTS anonymous_interactions_session_idx ON anonymous_interactions (session_id, created_at DESC);
