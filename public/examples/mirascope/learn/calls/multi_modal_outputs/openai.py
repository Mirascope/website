import io
import wave

from pydub.playback import play
from pydub import AudioSegment

from mirascope.core import openai


@openai.call(
    "gpt-4o-audio-preview",
    call_params={
        "audio": {"voice": "alloy", "format": "wav"}, # [!code highlight]
        "modalities": ["text", "audio"], # [!code highlight]
    },
)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response = recommend_book(genre="fantasy")

print(response.audio_transcript) # [!code highlight]

if audio := response.audio: # [!code highlight]
    audio_io = io.BytesIO(audio)

    with wave.open(audio_io, "rb") as f:
        audio_segment = AudioSegment.from_raw(
            audio_io,
            sample_width=f.getsampwidth(),
            frame_rate=f.getframerate(),
            channels=f.getnchannels(),
        )

    play(audio_segment)
