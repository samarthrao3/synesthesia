import { useCallback, useState } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import { attachYouTubeIds, genTags, vibeSong } from './api'
import SongsGrid from './components/songsGrid'

function App() {

  const [songs, setSongs] = useState([])
  const [userMood, setUserMood] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!userMood.trim() || loading) return;

    try {
      setLoading(true);

      const tags = await genTags(userMood);
      const baseSongs = await vibeSong(tags);
      const enriched = await attachYouTubeIds(baseSongs);

      setSongs(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userMood, loading]);

  return (
    <div className='container'>
      <Navbar />
      <form className='search-form' onSubmit={handleSubmit}>
        <input
          type="text"
          className='search-box'
          placeholder='Type your vibe... (e.g., coding late night)'
          value={userMood}
          onChange={e => setUserMood(e.target.value)}
        />
        <button type='submit' className='search-btn'>Generate playlist...</button>
      </form>
      {loading ? <h2 className='loading'> Curating Your playlist... </h2> :
        <div className='playlist-grid'>
          {songs.map(song => {
            return (
              <SongsGrid song={song} key={song.name} />
            )
          })}
        </div>
      }
    </div>
  )
}

export default App
