function SongsGrid(props) {

    return (
        <div className="track-card">
            <div className="image-wrapper">
                <iframe 
                    width="100%"
                    height="200"
                    src={`https://www.youtube.com/embed/${props.song.videoId}`}
                    title={`${props.song.artist.name} - ${props.song.name}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="track-image"
                />
            </div>
            <div className="track-info">
                <h3 className="song-title">{props.song.name}</h3>
                <p className="artist-name">{props.song.artist.name}</p>
            </div>
        </div>
    )
}

export default SongsGrid