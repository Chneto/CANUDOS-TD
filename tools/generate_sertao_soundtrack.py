"""
Gerador de Trilha Sonora Autoral para CANUDOS TD
Tema: "A Saga de Canudos: Terra Prometida e Resistência"
Estilo: Cantoria / Bendito Sertanejo / Marcha da Caatinga (Viola, Pífano, Zabumba, Triângulo)
"""

import os
import wave
import struct
import numpy as np

SAMPLE_RATE = 44100
BPM = 90
BEAT_DUR = 60.0 / BPM  # ~0.6667 s per beat
MEASURE_DUR = BEAT_DUR * 4  # 4/4 or 2/4 feel

def midi_to_freq(midi_note):
    return 440.0 * (2.0 ** ((midi_note - 69.0) / 12.0))

# ── 1. Síntese de Viola Sertaneja (Karplus-Strong Plucked String) ──
def synthesize_viola_note(freq, duration_s, velocity=0.8, sample_rate=SAMPLE_RATE):
    n_samples = int(duration_s * sample_rate)
    buffer_len = int(sample_rate / freq)
    if buffer_len < 2:
        buffer_len = 2

    # Excitação inicial (dedo na corda de aço com filtro passa-baixo)
    noise = np.random.uniform(-1.0, 1.0, buffer_len)
    # Suavizar o ruído para simular a carne do polegar/palheta
    noise = np.convolve(noise, [0.25, 0.5, 0.25], mode='same')
    
    buffer = list(noise)
    out = np.zeros(n_samples)
    
    # Coeficiente de perda (amortecimento natural de corda de metal)
    decay = 0.993
    idx = 0
    for i in range(n_samples):
        val = buffer[idx]
        out[i] = val
        next_idx = (idx + 1) % buffer_len
        # Filtro passa-baixo de média móvel Karplus-Strong
        buffer[idx] = (buffer[idx] + buffer[next_idx]) * 0.5 * decay
        idx = next_idx

    # Envelope de volume
    fade_len = min(int(0.005 * sample_rate), n_samples)
    out[:fade_len] *= np.linspace(0.0, 1.0, fade_len)
    out *= velocity
    return out

# ── 2. Síntese de Zabumba (Bumbo de Couro do Sertão) ──
def synthesize_zabumba(hit_type='surdo', sample_rate=SAMPLE_RATE):
    # 'surdo' (batida grave) ou 'bacalhau' (toque agudo no aro)
    if hit_type == 'surdo':
        dur = 0.45
        t = np.linspace(0, dur, int(dur * sample_rate), endpoint=False)
        # Pitch sweep grave de 130 Hz para 50 Hz
        freq_env = 50.0 + 80.0 * np.exp(-t * 22.0)
        phase = 2.0 * np.pi * np.cumsum(freq_env) / sample_rate
        body = np.sin(phase) + 0.3 * np.sin(phase * 2.0)
        amp_env = np.exp(-t * 9.0)
        # Ataque de pele de cabra
        noise = np.random.uniform(-0.15, 0.15, len(t)) * np.exp(-t * 40.0)
        return (body * amp_env + noise) * 0.85
    else:
        dur = 0.18
        t = np.linspace(0, dur, int(dur * sample_rate), endpoint=False)
        freq_env = 220.0 + 120.0 * np.exp(-t * 30.0)
        phase = 2.0 * np.pi * np.cumsum(freq_env) / sample_rate
        body = np.sin(phase) + 0.4 * np.sin(phase * 1.5)
        amp_env = np.exp(-t * 18.0)
        noise = np.random.uniform(-0.25, 0.25, len(t)) * np.exp(-t * 35.0)
        return (body * amp_env + noise) * 0.45

# ── 3. Síntese de Triângulo Metálico ──
def synthesize_triangulo(dur=0.3, sample_rate=SAMPLE_RATE):
    t = np.linspace(0, dur, int(dur * sample_rate), endpoint=False)
    # Ressonâncias inarmônicas metálicas
    f1, f2, f3 = 3450.0, 5620.0, 8100.0
    metal = (np.sin(2.0 * np.pi * f1 * t) * 0.5 +
             np.sin(2.0 * np.pi * f2 * t) * 0.35 +
             np.sin(2.0 * np.pi * f3 * t) * 0.25)
    env = np.exp(-t * 14.0)
    return metal * env * 0.25

# ── 4. Síntese de Pífano / Flauta Sertaneja (Voz dos Benditos) ──
def synthesize_pifano_note(freq, duration_s, sample_rate=SAMPLE_RATE):
    t = np.linspace(0, duration_s, int(duration_s * sample_rate), endpoint=False)
    # Vibrato sertanejo suave (5.5 Hz)
    vibrato = 1.0 + 0.015 * np.sin(2.0 * np.pi * 5.5 * t)
    phase = 2.0 * np.pi * np.cumsum(freq * vibrato) / sample_rate
    
    # Onda suave com harmônicos ímpares (som de bambu/tubo oco)
    flute = np.sin(phase) + 0.22 * np.sin(phase * 2.0) + 0.12 * np.sin(phase * 3.0)
    # Ruído de ar do sopro
    breath = np.random.uniform(-0.06, 0.06, len(t))
    # Envelope de sopro com ataque suave
    attack_len = int(0.04 * sample_rate)
    release_len = int(0.06 * sample_rate)
    env = np.ones(len(t))
    if len(t) > attack_len + release_len:
        env[:attack_len] = np.linspace(0.0, 1.0, attack_len)
        env[-release_len:] = np.linspace(1.0, 0.0, release_len)
    
    return (flute + breath) * env * 0.55

# ── 5. Composição e Arranjo da Trilha ──
def compose_soundtrack():
    # Estrutura: 16 compassos em 90 BPM = ~42.67 segundos
    total_measures = 16
    total_duration = total_measures * MEASURE_DUR
    n_total_samples = int(total_duration * SAMPLE_RATE)
    
    left = np.zeros(n_total_samples)
    right = np.zeros(n_total_samples)

    def mix_into(track, sample, start_time_s, pan=0.0):
        # pan: -1.0 (esq) a +1.0 (dir)
        start_idx = int(start_time_s * SAMPLE_RATE)
        end_idx = start_idx + len(sample)
        if start_idx >= n_total_samples:
            return
        if end_idx > n_total_samples:
            sample = sample[:n_total_samples - start_idx]
            end_idx = n_total_samples
        
        gain_l = np.sqrt(0.5 * (1.0 - pan))
        gain_r = np.sqrt(0.5 * (1.0 + pan))
        left[start_idx:end_idx] += sample * gain_l
        right[start_idx:end_idx] += sample * gain_r

    # A. Padrão de Percussão (Zabumba e Triângulo) — entra no compasso 4
    for m in range(total_measures):
        measure_start = m * MEASURE_DUR
        if m >= 2:  # Bateria entra gradualmente
            # Zabumba: tempo 1 (surdo forte), tempo 2.5 (bacalhau), tempo 3 (surdo seco)
            mix_into(left, synthesize_zabumba('surdo'), measure_start + 0.0, pan=-0.1)
            mix_into(left, synthesize_zabumba('bacalhau'), measure_start + BEAT_DUR * 1.5, pan=0.15)
            mix_into(left, synthesize_zabumba('surdo'), measure_start + BEAT_DUR * 2.0, pan=-0.1)
            mix_into(left, synthesize_zabumba('bacalhau'), measure_start + BEAT_DUR * 3.5, pan=0.15)
            
            # Triângulo nas subdivisões (tchik, tchik, tchik)
            for b in range(4):
                mix_into(left, synthesize_triangulo(0.12), measure_start + b * BEAT_DUR, pan=0.35)
                mix_into(left, synthesize_triangulo(0.18), measure_start + (b + 0.5) * BEAT_DUR, pan=0.45)

    # B. Dedilhado de Viola Sertaneja (Modo Nordestino / Dm - C - Bb - A7)
    # Acordes por compasso:
    # m0-3: Dm | C | Bb | A7 (Intro solo)
    # m4-7: Dm | F | G | A7
    # m8-11: Dm | C | Bb | A7
    # m12-15: Dm | Gm | A7 | Dm (Conclusão do ciclo)
    chord_progressions = [
        # Dm
        [50, 57, 62, 65, 69],  # D3, A3, D4, F4, A4
        # C
        [48, 55, 60, 64, 67],  # C3, G3, C4, E4, G4
        # Bb
        [46, 53, 58, 62, 65],  # Bb2, F3, Bb3, D4, F4
        # A7
        [45, 52, 57, 61, 64],  # A2, E3, A3, C#4, E4
        # Dm
        [50, 57, 62, 65, 69],
        # F
        [41, 48, 53, 57, 60],  # F2, C3, F3, A3, C4
        # G (Modo nordestino / mixolídio)
        [43, 50, 55, 59, 62],  # G2, D3, G3, B3, D4
        # A7
        [45, 52, 57, 61, 64],
        # Dm
        [50, 57, 62, 65, 69],
        # C
        [48, 55, 60, 64, 67],
        # Bb
        [46, 53, 58, 62, 65],
        # A7
        [45, 52, 57, 61, 64],
        # Dm
        [50, 57, 62, 65, 69],
        # Gm
        [43, 50, 55, 58, 62],  # G2, D3, G3, Bb3, D4
        # A7
        [45, 52, 57, 61, 64],
        # Dm (final resolutivo do loop)
        [50, 57, 62, 65, 69],
    ]

    for m, chord in enumerate(chord_progressions):
        measure_start = m * MEASURE_DUR
        bass = chord[0]
        notes = chord[1:]
        
        # Ponteado característico: Baixo no tempo 1 e 3, arpejo rápido nas primas
        mix_into(left, synthesize_viola_note(midi_to_freq(bass), BEAT_DUR * 1.8, velocity=0.75), measure_start, pan=-0.25)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[0]), BEAT_DUR * 0.9, velocity=0.6), measure_start + BEAT_DUR * 0.5, pan=-0.1)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[1]), BEAT_DUR * 0.9, velocity=0.65), measure_start + BEAT_DUR * 1.0, pan=-0.15)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[2]), BEAT_DUR * 0.9, velocity=0.7), measure_start + BEAT_DUR * 1.5, pan=-0.2)
        
        mix_into(left, synthesize_viola_note(midi_to_freq(bass), BEAT_DUR * 1.8, velocity=0.7), measure_start + BEAT_DUR * 2.0, pan=-0.25)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[1]), BEAT_DUR * 0.9, velocity=0.6), measure_start + BEAT_DUR * 2.5, pan=-0.15)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[2]), BEAT_DUR * 0.9, velocity=0.65), measure_start + BEAT_DUR * 3.0, pan=-0.2)
        mix_into(left, synthesize_viola_note(midi_to_freq(notes[0]), BEAT_DUR * 0.9, velocity=0.6), measure_start + BEAT_DUR * 3.5, pan=-0.1)

    # C. Melodia do Pífano / Bendito dos Jagunços (Entra no compasso 4)
    # Melodia em D menor / Modo Nordestino
    melody_events = [
        # Compassos 4-7: Primeira frase do Bendito
        (4 * MEASURE_DUR + 0.0, 74, 1.2),  # D5
        (4 * MEASURE_DUR + 1.5 * BEAT_DUR, 72, 0.6),  # C5
        (4 * MEASURE_DUR + 2.0 * BEAT_DUR, 69, 1.2),  # A4
        (4 * MEASURE_DUR + 3.5 * BEAT_DUR, 70, 0.6),  # Bb4
        
        (5 * MEASURE_DUR + 0.0, 72, 1.8),  # C5
        (5 * MEASURE_DUR + 2.0 * BEAT_DUR, 69, 0.9),  # A4
        (5 * MEASURE_DUR + 3.0 * BEAT_DUR, 65, 0.9),  # F4
        
        (6 * MEASURE_DUR + 0.0, 67, 1.8),  # G4 (Modo nordestino aberto)
        (6 * MEASURE_DUR + 2.0 * BEAT_DUR, 69, 0.8),  # A4
        (6 * MEASURE_DUR + 3.0 * BEAT_DUR, 70, 0.8),  # Bb4
        
        (7 * MEASURE_DUR + 0.0, 69, 2.4),  # A4 (repouso solene)
        
        # Compassos 8-11: Segunda frase (O Clamor no Arraial)
        (8 * MEASURE_DUR + 0.0, 74, 1.2),  # D5
        (8 * MEASURE_DUR + 1.5 * BEAT_DUR, 76, 0.6),  # E5
        (8 * MEASURE_DUR + 2.0 * BEAT_DUR, 77, 1.4),  # F5 (Ponto alto emotivo)
        (8 * MEASURE_DUR + 3.5 * BEAT_DUR, 76, 0.6),  # E5
        
        (9 * MEASURE_DUR + 0.0, 74, 1.5),  # D5
        (9 * MEASURE_DUR + 2.0 * BEAT_DUR, 72, 0.9),  # C5
        (9 * MEASURE_DUR + 3.0 * BEAT_DUR, 70, 0.9),  # Bb4
        
        (10 * MEASURE_DUR + 0.0, 69, 1.5), # A4
        (10 * MEASURE_DUR + 2.0 * BEAT_DUR, 67, 0.9), # G4
        (10 * MEASURE_DUR + 3.0 * BEAT_DUR, 65, 0.9), # F4
        
        (11 * MEASURE_DUR + 0.0, 64, 2.2), # E4
        (11 * MEASURE_DUR + 2.5 * BEAT_DUR, 61, 1.2), # C#4 (tensão para A7)
        
        # Compassos 12-15: Conclusão heróica da resistência
        (12 * MEASURE_DUR + 0.0, 62, 1.8), # D4
        (12 * MEASURE_DUR + 2.0 * BEAT_DUR, 65, 0.9), # F4
        (12 * MEASURE_DUR + 3.0 * BEAT_DUR, 69, 0.9), # A4
        
        (13 * MEASURE_DUR + 0.0, 70, 1.8), # Bb4
        (13 * MEASURE_DUR + 2.0 * BEAT_DUR, 69, 0.9), # A4
        (13 * MEASURE_DUR + 3.0 * BEAT_DUR, 67, 0.9), # G4
        
        (14 * MEASURE_DUR + 0.0, 65, 1.8), # F4
        (14 * MEASURE_DUR + 2.0 * BEAT_DUR, 64, 1.0), # E4
        (14 * MEASURE_DUR + 3.0 * BEAT_DUR, 61, 1.0), # C#4
        
        (15 * MEASURE_DUR + 0.0, 62, 2.6), # D4 (Resolução épica em Dm)
    ]

    for start_t, note, dur in melody_events:
        mix_into(left, synthesize_pifano_note(midi_to_freq(note), dur), start_t, pan=0.05)

    # Masterização simples: Normalizar sem clipping
    max_val = max(np.max(np.abs(left)), np.max(np.abs(right)))
    if max_val > 0.001:
        target_peak = 0.88
        left = (left / max_val) * target_peak
        right = (right / max_val) * target_peak

    # Fade-in inicial de 0.5s e fade-out final de 0.5s para loop impecável
    fade_samples = int(0.6 * SAMPLE_RATE)
    left[:fade_samples] *= np.linspace(0.0, 1.0, fade_samples)
    right[:fade_samples] *= np.linspace(0.0, 1.0, fade_samples)
    left[-fade_samples:] *= np.linspace(1.0, 0.0, fade_samples)
    right[-fade_samples:] *= np.linspace(1.0, 0.0, fade_samples)

    return left, right

def save_wav(filename, left, right, sample_rate=SAMPLE_RATE):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    n_samples = len(left)
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        # Intercalar canais e converter para int16
        frames = bytearray()
        for i in range(n_samples):
            l_val = int(np.clip(left[i] * 32767.0, -32768, 32767))
            r_val = int(np.clip(right[i] * 32767.0, -32768, 32767))
            frames.extend(struct.pack('<hh', l_val, r_val))
        wav_file.writeframes(frames)
    print(f"-> Salvo: {filename} ({n_samples / sample_rate:.1f} segundos)")

if __name__ == "__main__":
    print("Gerando trilha sonora sertaneja de Canudos...")
    left, right = compose_soundtrack()
    
    # 1. Salvar na pasta de áudio do jogo Godot
    godot_path = os.path.join("assets", "audio", "music_caatinga_resistencia.wav")
    save_wav(godot_path, left, right)
    
    # 2. Salvar também nas pastas do jogo web/PC do Miguel
    miguel_path = os.path.join("Miguel", "Canudos", "musica_canudos.wav")
    save_wav(miguel_path, left, right)

    miguel_pc_path = os.path.join("Miguel", "Canudos_PC", "jogo", "musica_canudos.wav")
    save_wav(miguel_pc_path, left, right)
    
    print("Trilha sonora nordestina gerada com sucesso!")
