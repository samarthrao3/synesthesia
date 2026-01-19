import OpenAI from "openai";

const HF_TOKEN = import.meta.env.VITE_HF_API_KEY;
const MUSIC_TOKEN = import.meta.env.VITE_MUSIC_API_KEY;
const MUSIC_BASE_URL = import.meta.env.VITE_MUSIC_BASE_URL;
const GOOGLE_TOKEN = import.meta.env.VITE_GOOGLE_API_KEY;


const SYSTEM_PROMPT = `
Convert to 3–4 Last.fm music tags.
If input is a genre or artist, return a single tag.
Examples:
"coding on a rainy night" → coding,rain,night,chill
"Arctic Monkeys" → arctic monkeys
"Chill" → chill,ambient,relaxed
Return ONLY comma-separated tags.
`;


const hfClient = new OpenAI({
    baseURL: "https://router.huggingface.co/v1",
    apiKey: HF_TOKEN,
    dangerouslyAllowBrowser: true,
});


const tagCache = new Map();
const songCache = new Map();
const youtubeCache = new Map();


export async function genTags(mood) {
    if (tagCache.has(mood)) return tagCache.get(mood);

    const res = await hfClient.chat.completions.create({
        model: "meta-llama/Llama-3.1-8B-Instruct:novita",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: mood },
        ],
    });

    const tags = res.choices[0].message.content
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);

    tagCache.set(mood, tags);
    return tags;
}

export async function vibeSong(tags) {
    const cacheKey = tags.join("|");
    if (songCache.has(cacheKey)) return songCache.get(cacheKey);

    const requests = tags.map(tag =>
        fetch(
            `${MUSIC_BASE_URL}/?method=tag.gettoptracks&tag=${
                tag
            }&api_key=${MUSIC_TOKEN}&format=json`
        ).then(res => res.json())
    );

    const responses = await Promise.all(requests);

    const score = {};

    responses
        .flatMap(r => r.tracks?.track || [])
        .forEach(song => {
            const id = `${song.name}`;
            score[id] ??= { count: 0, data: song };
            score[id].count++;
        });

    const playlist = Object.values(score)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20)
        .map(item => item.data);

    songCache.set(cacheKey, playlist);
    return playlist;
}


async function getYouTubeVideoId(song, artist) {
    const query = `${song} ${artist} official video`;
    if (youtubeCache.has(query)) return youtubeCache.get(query);

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${encodeURIComponent(
        query
    )}&key=${GOOGLE_TOKEN}`;

    const res = await fetch(url);
    const data = await res.json();

    const videoId = data.items?.[0]?.id?.videoId || null;
    youtubeCache.set(query, videoId);

    console.log(videoId)
    return videoId;
}

export async function attachYouTubeIds(songs) {
    return Promise.all(
        songs.map(async song => ({
            ...song,
            videoId: await getYouTubeVideoId(
                song.name,
                song.artist.name
            ),
        }))
    );
}

