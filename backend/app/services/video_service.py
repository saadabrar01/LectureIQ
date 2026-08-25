"""Video processing service for LectureIQ.

Provides:
1. YouTube URL parsing and metadata retrieval.
2. YouTube transcript fetching (with timestamp support).
3. Audio/Video transcription processing (Whisper).
4. Chunking of transcript segments with associated timestamps for pgvector indexing.
"""

import json
import re
from typing import Any, Dict, List, Optional
import httpx


def extract_youtube_id(url_or_id: str) -> str:
    """Extract YouTube 11-character video ID from various URL formats or raw ID."""
    url_or_id = url_or_id.strip()
    if len(url_or_id) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", url_or_id):
        return url_or_id

    patterns = [
        r"(?:v=|\/vi\/|youtu\.be\/|\/v\/|\/embed\/|\/shorts\/|\/e\/)([^#\&\?\/]{11})",
        r"^([^#\&\?]{11})$",
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)

    raise ValueError(f"Invalid YouTube URL or Video ID: '{url_or_id}'")


def get_youtube_metadata(video_id: str) -> Dict[str, Any]:
    """Fetch basic YouTube video metadata using oEmbed API."""
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    title = f"YouTube Lecture ({video_id})"
    channel = "YouTube Channel"
    thumbnail = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
    duration = 0

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title", title)
                channel = data.get("author_name", channel)
                thumbnail = data.get("thumbnail_url", thumbnail)
    except Exception:
        pass  # Fallback to defaults

    return {
        "video_id": video_id,
        "title": title,
        "channel": channel,
        "thumbnail": thumbnail,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "duration": duration,
    }


def get_youtube_transcript(video_id: str) -> List[Dict[str, Any]]:
    """Fetch transcript segments from YouTube.

    Returns list of dicts: [{'start': int_seconds, 'text': str}]
    """
    segments: List[Dict[str, Any]] = []

    # 1. Try youtube_transcript_api
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=["en", "ur", "hindi", "es", "fr", "de"])
        for item in transcript_list:
            text = item.get("text", "").strip()
            if text:
                segments.append({
                    "start": int(item.get("start", 0)),
                    "text": text
                })
        if segments:
            return segments
    except Exception:
        pass

    # 2. Try yt-dlp fallback
    try:
        import subprocess

        cmd = [
            "yt-dlp",
            "--write-auto-sub",
            "--sub-lang", "en",
            "--skip-download",
            "--print-json",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if res.returncode == 0 and res.stdout:
            data = json.loads(res.stdout)
            subtitles = data.get("automatic_captions", {}).get("en", [])
            for sub in subtitles:
                if sub.get("ext") == "json3":
                    r = httpx.get(sub["url"], timeout=10)
                    if r.status_code == 200:
                        j3 = r.json()
                        for event in j3.get("events", []):
                            t_start = int(event.get("tStartMs", 0) / 1000)
                            segs = event.get("segs", [])
                            line = "".join(s.get("utf8", "") for s in segs).strip()
                            if line and line != "\n":
                                segments.append({"start": t_start, "text": line})
                        if segments:
                            return segments
    except Exception:
        pass

    # 3. Fallback dummy placeholder transcript if no captions exist
    if not segments:
        segments.append({
            "start": 0,
            "text": f"Audio transcript for YouTube video {video_id}. Automated captions are not available for this video."
        })

    return segments


def chunk_transcript_segments(
    segments: List[Dict[str, Any]],
    chunk_size: int = 400,
    chunk_overlap: int = 50
) -> List[Dict[str, Any]]:
    """Group transcript segments into search-optimized chunks while preserving timestamps.

    Returns list of dicts:
      [{'chunk_text': str, 'timestamp_sec': int, 'chunk_index': int}]
    """
    if not segments:
        return []

    chunks: List[Dict[str, Any]] = []
    current_text_parts: List[str] = []
    current_length = 0
    current_start_time = segments[0]["start"]
    chunk_idx = 0

    for seg in segments:
        text = seg["text"].strip()
        if not text:
            continue

        if not current_text_parts:
            current_start_time = seg["start"]

        current_text_parts.append(text)
        current_length += len(text) + 1

        if current_length >= chunk_size:
            chunk_str = " ".join(current_text_parts)
            chunks.append({
                "chunk_text": chunk_str,
                "timestamp_sec": current_start_time,
                "chunk_index": chunk_idx
            })
            chunk_idx += 1
            current_text_parts = [text]
            current_length = len(text)
            current_start_time = seg["start"]

    if current_text_parts:
        chunk_str = " ".join(current_text_parts)
        chunks.append({
            "chunk_text": chunk_str,
            "timestamp_sec": current_start_time,
            "chunk_index": chunk_idx
        })

    return chunks
