"""Video processing service for LectureIQ.

Provides:
1. YouTube URL parsing and metadata retrieval.
2. YouTube transcript fetching (with timestamp support).
3. Local Audio/Video file transcription via Groq Whisper (with OpenAI fallback).
4. Chunking of transcript segments with associated timestamps for pgvector indexing.
"""

import json
import logging
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx

logger = logging.getLogger("lectureiq.video")


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

    # Try yt-dlp for richer metadata (duration, etc.)
    try:
        cmd = [
            "yt-dlp",
            "--skip-download",
            "--print", "%(title)s\n%(uploader)s\n%(duration)s\n%(thumbnail)s",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
        if res.returncode == 0 and res.stdout:
            lines = res.stdout.strip().splitlines()
            if len(lines) >= 1 and lines[0]:
                title = lines[0].strip()
            if len(lines) >= 2 and lines[1]:
                channel = lines[1].strip()
            if len(lines) >= 3 and lines[2].isdigit():
                duration = int(lines[2])
            if len(lines) >= 4 and lines[3]:
                thumbnail = lines[3].strip()
    except Exception as e:
        logger.debug("yt-dlp metadata fallback failed: %s", e)

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


def transcribe_audio_file(file_path: str) -> List[Dict[str, Any]]:
    """Transcribe a local audio/video file using Groq Whisper API.

    Workflow:
    1. Use ffmpeg to extract/convert audio to 16kHz mono WAV (avoids large upload).
    2. Send to Groq Whisper API (whisper-large-v3-turbo) for transcription with timestamps.
    3. Fall back to OpenAI Whisper API if Groq key not set.
    4. Returns list of {start: int, text: str} segments.
    """
    segments: List[Dict[str, Any]] = []

    # Step 1: Convert to compressed audio (16kHz mono mp3 — small but Whisper-friendly)
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        audio_path = tmp.name

    try:
        ffmpeg_cmd = [
            "ffmpeg", "-y",
            "-i", file_path,
            "-vn",                         # strip video stream
            "-ar", "16000",               # 16kHz sample rate
            "-ac", "1",                   # mono
            "-b:a", "64k",               # 64 kbps — good quality, small file
            audio_path,
        ]
        result = subprocess.run(ffmpeg_cmd, capture_output=True, timeout=300)
        if result.returncode != 0:
            raise RuntimeError(f"ffmpeg failed: {result.stderr.decode()[:500]}")

        audio_size = Path(audio_path).stat().st_size
        logger.info("Audio extracted: %s bytes -> %s", os.path.getsize(file_path), audio_size)

        # Step 2: Transcribe via Groq or OpenAI Whisper
        groq_api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY", "")
        openai_api_key = getattr(settings, "openai_api_key", "") or os.getenv("OPENAI_API_KEY", "")

        if groq_api_key:
            segments = _transcribe_groq(audio_path, groq_api_key)
        elif openai_api_key:
            segments = _transcribe_openai(audio_path, openai_api_key)
        else:
            raise RuntimeError(
                "No transcription API key found. Set GROQ_API_KEY or OPENAI_API_KEY in your .env file."
            )
    finally:
        try:
            os.unlink(audio_path)
        except OSError:
            pass

    # Ensure we always return something
    if not segments:
        segments.append({"start": 0, "text": "Transcription produced no text segments."})

    return segments


def _transcribe_groq(audio_path: str, api_key: str) -> List[Dict[str, Any]]:
    """Call Groq Whisper API and return timestamped segments."""
    segments: List[Dict[str, Any]] = []
    try:
        with open(audio_path, "rb") as audio_file:
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(
                    "https://api.groq.com/openai/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files={"file": (Path(audio_path).name, audio_file, "audio/mpeg")},
                    data={
                        "model": "whisper-large-v3-turbo",
                        "response_format": "verbose_json",
                        "timestamp_granularities": "segment",
                    },
                )
        resp.raise_for_status()
        data = resp.json()
        for seg in data.get("segments", []):
            text = seg.get("text", "").strip()
            if text:
                segments.append({
                    "start": int(seg.get("start", 0)),
                    "text": text,
                })
        # Fallback: if no segments but has text, create single segment
        if not segments and data.get("text"):
            segments.append({"start": 0, "text": data["text"].strip()})
        logger.info("Groq Whisper produced %d segments", len(segments))
    except Exception as e:
        logger.error("Groq transcription failed: %s", e)
        raise
    return segments


def _transcribe_openai(audio_path: str, api_key: str) -> List[Dict[str, Any]]:
    """Call OpenAI Whisper API and return timestamped segments."""
    segments: List[Dict[str, Any]] = []
    try:
        with open(audio_path, "rb") as audio_file:
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files={"file": (Path(audio_path).name, audio_file, "audio/mpeg")},
                    data={
                        "model": "whisper-1",
                        "response_format": "verbose_json",
                        "timestamp_granularities": "segment",
                    },
                )
        resp.raise_for_status()
        data = resp.json()
        for seg in data.get("segments", []):
            text = seg.get("text", "").strip()
            if text:
                segments.append({
                    "start": int(seg.get("start", 0)),
                    "text": text,
                })
        if not segments and data.get("text"):
            segments.append({"start": 0, "text": data["text"].strip()})
        logger.info("OpenAI Whisper produced %d segments", len(segments))
    except Exception as e:
        logger.error("OpenAI transcription failed: %s", e)
        raise
    return segments
