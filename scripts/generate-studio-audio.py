#!/usr/bin/env python3
"""Deterministic original instrumental miniatures for the VORALEAF studio.

No recordings, commercial melodies, sample libraries or external services are used.
The synthesis is deliberately gentle: plucked-string harmonic models, a soft
struck-string voice, warm pads, a quiet bass and brushed-noise percussion.
These are background compositions, not a treatment or clinical intervention.

Requires numpy, scipy, ffmpeg and ffprobe. MP3s and the manifest are web assets;
temporary PCM masters and loudness measurements stay outside public/.
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io import wavfile

RATE = 44100
TEMPO = 80
BEAT = 60 / TEMPO
BARS = 12
DURATION = BARS * 4 * BEAT
SAMPLES = round(DURATION * RATE)


def frequency(midi: int) -> float:
    return 440 * 2 ** ((midi - 69) / 12)


def pan_mono(note: np.ndarray, pan: float) -> np.ndarray:
    angle = (max(-1, min(1, pan)) + 1) * math.pi / 4
    return np.column_stack((note * math.cos(angle), note * math.sin(angle)))


def add(target: np.ndarray, note: np.ndarray, start: float, gain: float, pan: float = 0) -> None:
    """Mix tails around the loop boundary rather than truncating them."""
    position = round(start * RATE) % SAMPLES
    stereo = pan_mono(note, pan) * gain
    while len(stereo):
        count = min(len(stereo), SAMPLES - position)
        target[position:position + count] += stereo[:count]
        stereo = stereo[count:]
        position = 0


def guitar(midi: int, seed: int, bright: float = 1.0) -> np.ndarray:
    rng = np.random.default_rng(seed + midi * 29)
    seconds = 3.5
    time = np.arange(round(seconds * RATE)) / RATE
    fundamental = frequency(midi)
    voice = np.zeros(len(time))
    # Frequency-dependent decays and a pluck-position comb give the voice a
    # rounded acoustic-string character without a repeated sampled attack.
    for harmonic in range(1, 23):
        if fundamental * harmonic > 10000:
            break
        pluck = math.sin(math.pi * harmonic * .19)
        gain = pluck / harmonic ** 1.12 * math.exp(-harmonic / (15 * bright))
        decay = (2.0 + .15 * bright) / (1 + .14 * harmonic)
        inharmonic = math.sqrt(1 + .000025 * harmonic * harmonic)
        phase = rng.uniform(-.035, .035)
        vibrato = .00018 * np.sin(2 * np.pi * 4.1 * time)
        voice += gain * np.sin(2 * np.pi * fundamental * harmonic * inharmonic * (time + vibrato * time) + phase) * np.exp(-time / decay)
    attack = 1 - np.exp(-time / .0024)
    voice *= attack
    # Very low-level pick/body sound, filtered below the abrasive high band.
    noise = rng.normal(0, 1, len(time))
    noise = signal.sosfilt(signal.butter(2, [350, 2300], 'bandpass', fs=RATE, output='sos'), noise)
    voice += noise * np.exp(-time / .018) * .035
    voice *= (1 - np.exp(-(seconds - time) / .04))
    voice /= max(.2, np.max(np.abs(voice)))
    return voice.astype(np.float64)


def piano(midi: int) -> np.ndarray:
    time = np.arange(round(3.8 * RATE)) / RATE
    fundamental = frequency(midi)
    voice = np.zeros(len(time))
    for harmonic, level in [(1, 1), (2, .31), (3, .14), (4, .055), (5, .018)]:
        voice += level * np.sin(2 * np.pi * fundamental * harmonic * (1 + .00006 * harmonic) * time) * np.exp(-time / (1.7 / (1 + harmonic * .18)))
    voice *= (1 - np.exp(-time / .005))
    return voice * .65


def pad(midi: int) -> np.ndarray:
    time = np.arange(round(5.5 * RATE)) / RATE
    fundamental = frequency(midi)
    voice = np.zeros(len(time))
    for cents, amplitude in [(-3, .28), (0, .44), (3, .28)]:
        f = fundamental * 2 ** (cents / 1200)
        voice += amplitude * (np.sin(2 * np.pi * f * time) + .11 * np.sin(2 * np.pi * 2 * f * time))
    envelope = np.minimum(time / .85, 1) * np.exp(-np.maximum(time - 2.4, 0) / 1.1)
    return voice * envelope * .2


def bass(midi: int) -> np.ndarray:
    time = np.arange(round(2.9 * RATE)) / RATE
    f = frequency(midi)
    voice = np.sin(2 * np.pi * f * time) + .24 * np.sin(2 * np.pi * 2 * f * time) + .08 * np.sin(2 * np.pi * 3 * f * time)
    return voice * (1 - np.exp(-time / .012)) * np.exp(-time / 1.0) * .7


def brush(seed: int, kind: str) -> np.ndarray:
    rng = np.random.default_rng(seed)
    duration = .20 if kind == 'shaker' else .34
    time = np.arange(round(duration * RATE)) / RATE
    noise = rng.normal(0, 1, len(time))
    bands = [1800, 6200] if kind == 'shaker' else [550, 4200]
    filtered = signal.sosfilt(signal.butter(2, bands, 'bandpass', fs=RATE, output='sos'), noise)
    envelope = (1 - np.exp(-time / .004)) * np.exp(-time / (.035 if kind == 'shaker' else .095))
    return filtered * envelope


TRACKS = [
    {
        'id': 'golden-hour', 'title': 'Golden Hour', 'seed': 73119, 'bright': 1.0,
        'description': 'Warm acoustic-style arpeggios, soft struck-string notes and an easy country pulse.',
        'chords': [[50, 57, 62, 66], [47, 54, 59, 62], [43, 55, 59, 62], [45, 57, 61, 64], [50, 57, 62, 66], [47, 54, 59, 62], [43, 55, 59, 62], [45, 57, 61, 64], [50, 57, 62, 66], [43, 55, 59, 62], [40, 55, 59, 64], [45, 57, 61, 64]],
        'melody': [[74, 78], [78, 74], [71, 74], [76, 73], [74, 81], [78, 74], [79, 78], [76, 73], [74, 78], [71, 74], [76, 79], [76, 73]],
    },
    {
        'id': 'meadow', 'title': 'Meadow', 'seed': 29107, 'bright': .86,
        'description': 'Light fingerpicked-style strings, a gentle bass and spacious pastoral chords.',
        'chords': [[43, 55, 59, 62], [48, 55, 60, 64], [40, 55, 59, 64], [50, 57, 62, 66]] * 3,
        'melody': [[74, 71], [72, 76], [71, 67], [69, 66], [67, 71], [72, 76], [79, 76], [74, 69], [71, 74], [76, 72], [71, 67], [69, 66]],
    },
    {
        'id': 'quiet-roots', 'title': 'Quiet Roots', 'seed': 11867, 'bright': .72,
        'description': 'A slower-feeling arrangement of rounded plucks, warm pads and sparse melodic notes.',
        'chords': [[48, 55, 59, 64], [41, 53, 57, 60], [45, 55, 60, 64], [43, 55, 59, 62]] * 3,
        'melody': [[72, 76], [69, 72], [76, 72], [74, 71], [72, 67], [69, 72], [76, 79], [74, 71], [76, 72], [69, 65], [72, 76], [74, 71]],
    },
]


def compose(track: dict) -> np.ndarray:
    mix = np.zeros((SAMPLES, 2), dtype=np.float64)
    rng = np.random.default_rng(track['seed'])
    cache: dict[int, np.ndarray] = {}
    for chord in track['chords']:
        for midi in chord:
            if midi not in cache:
                cache[midi] = guitar(midi, track['seed'], track['bright'])
    pattern = [0, 2, 1, 3, 2, 1, 3, 2]
    for bar, chord in enumerate(track['chords']):
        start = bar * 4 * BEAT
        quiet = track['id'] == 'quiet-roots'
        for step, note_index in enumerate(pattern):
            if quiet and step in [3, 6]:
                continue
            timing = start + step * BEAT / 2 + rng.uniform(-.006, .006)
            add(mix, cache[chord[note_index]], timing, .105 * rng.uniform(.88, 1.05), -.24 if step % 2 == 0 else .20)
        # A softly rolled chord and low root create a country/acoustic bed.
        for index, midi in enumerate(chord):
            add(mix, cache[midi], start + .018 * index, .032, -.38 + index * .20)
        add(mix, bass(chord[0] - 12), start, .12, -.03)
        if not quiet or bar % 2 == 0:
            add(mix, bass(chord[0] - 12), start + 2 * BEAT, .072, .04)
        for index, midi in enumerate(chord[1:]):
            add(mix, pad(midi), start, .25 if quiet else .18, -.48 + index * .44)
        for index, midi in enumerate(track['melody'][bar]):
            if quiet and index == 1 and bar % 2:
                continue
            add(mix, piano(midi), start + (.55 + index * 1.85) * BEAT, .055 if quiet else .07, .20 if index == 0 else -.14)
        for beat in range(4):
            if not quiet or beat in [1, 3]:
                add(mix, brush(track['seed'] + bar * 17 + beat, 'shaker'), start + (beat + .5) * BEAT, .026 if quiet else .035, -.35 if beat % 2 else .35)
            if beat in [1, 3] and not quiet:
                add(mix, brush(track['seed'] + bar * 23 + beat, 'brush'), start + beat * BEAT, .026, .12)
    # A small circular multi-tap room preserves the musical loop's tails.
    dry = mix.copy()
    for seconds, gain, swap in [(.109, .10, False), (.227, .10, True), (.367, .075, False), (.513, .055, True), (.791, .035, False)]:
        tap = np.roll(dry, round(seconds * RATE), axis=0)
        mix += tap[:, ::-1] * gain if swap else tap * gain
    # Settle filter state using three periods, retaining the middle period.
    filters = np.vstack((signal.butter(2, 35, 'highpass', fs=RATE, output='sos'), signal.butter(2, 8400, 'lowpass', fs=RATE, output='sos')))
    extended = np.tile(mix, (3, 1))
    mix = signal.sosfilt(filters, extended, axis=0)[SAMPLES:SAMPLES * 2]
    mix = np.tanh(mix * 1.15) / 1.15
    peak = float(np.max(np.abs(mix)))
    mix *= .80 / max(.80, peak)
    return mix


def loudness(path: Path) -> dict:
    command = ['ffmpeg', '-hide_banner', '-nostats', '-i', str(path), '-af', 'loudnorm=I=-18:TP=-2:LRA=7:print_format=json', '-f', 'null', '-']
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    return json.loads(result.stderr[result.stderr.rfind('{'):result.stderr.rfind('}') + 1])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'public/assets/audio')
    parser.add_argument('--qa-dir', type=Path, default=Path(tempfile.gettempdir()) / 'voraleaf-audio-masters')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    args.qa_dir.mkdir(parents=True, exist_ok=True)
    manifest = {'version': 1, 'tempoBpm': TEMPO, 'tracks': [], 'rights': 'Original procedural compositions created for VORALEAF; no third-party samples or intentionally reproduced melodies. These are instrumental background tracks, not clinical therapy.'}
    qa = []
    for track in TRACKS:
        print('Composing', track['title'], flush=True)
        pcm = compose(track)
        master = args.qa_dir / (track['id'] + '.wav')
        wavfile.write(master, RATE, np.round(pcm * 32767).astype(np.int16))
        initial = loudness(master)
        normalization = f"loudnorm=I=-18:TP=-2:LRA=7:measured_I={initial['input_i']}:measured_TP={initial['input_tp']}:measured_LRA={initial['input_lra']}:measured_thresh={initial['input_thresh']}:offset={initial['target_offset']}:linear=true"
        output = args.output / (track['id'] + '.mp3')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(master), '-af', normalization, '-ar', str(RATE), '-ac', '2', '-codec:a', 'libmp3lame', '-b:a', '96k', '-id3v2_version', '3', '-metadata', 'title=' + track['title'], '-metadata', 'artist=VORALEAF', '-metadata', 'comment=Original procedural instrumental composition; not clinical therapy', str(output)], check=True)
        measured = loudness(output)
        probe = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration,size:stream=codec_name,sample_rate,channels,bit_rate', '-of', 'json', str(output)], text=True))
        assert float(measured['input_tp']) < -1.0, (output, measured)
        assert abs(float(measured['input_i']) + 18) <= 1.0, (output, measured)
        assert 32 <= float(probe['format']['duration']) <= 48
        manifest['tracks'].append({'id': track['id'], 'title': track['title'], 'description': track['description'], 'src': '/assets/audio/' + output.name, 'durationSeconds': DURATION, 'format': 'audio/mpeg', 'composition': 'Original deterministic procedural instrumental', 'clinicalClaim': False})
        qa.append({'id': track['id'], 'path': str(output), 'loudness': measured, 'probe': probe, 'listeningReview': 'Not auditioned; objective loudness, stream, duration and size checks completed.'})
        print(track['id'], output.stat().st_size, measured['input_i'], measured['input_tp'], flush=True)
    (args.output / 'audio-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (args.qa_dir / 'audio-qa.json').write_text(json.dumps(qa, indent=2) + '\n')
    total = sum(path.stat().st_size for path in args.output.glob('*') if path.is_file())
    assert total <= 1_500_000, f'Web music exceeds the 1.5 MB budget: {total}'
    print('Total web audio bytes:', total)


if __name__ == '__main__':
    main()
