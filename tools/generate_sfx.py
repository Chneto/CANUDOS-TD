import math
import struct
import wave
import os

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        # Normalize and clip
        max_val = max(abs(s) for s in samples) if samples else 1.0
        if max_val < 1e-5:
            max_val = 1.0
        scale = 30000.0 / max_val
        raw = bytearray()
        for s in samples:
            val = int(max(-32767, min(32767, s * scale)))
            raw.extend(struct.pack('<h', val))
        wf.writeframes(raw)
    print(f"Generated {filename} ({len(samples)/SAMPLE_RATE:.2f}s)")

# 1. SFX Musket (Disparo seco de pólvora negra com estalo e eco de vale)
def gen_musket():
    duration = 0.55
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    import random
    random.seed(42)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Explosive initial noise crack
        noise = (random.random() * 2.0 - 1.0)
        env_crack = math.exp(-t * 45.0)
        # Deep low boom (pó de fuzil Mauser/Comblain)
        boom = math.sin(2.0 * math.pi * 90.0 * (1.0 - t*0.8) * t) * math.exp(-t * 12.0)
        # Body resonance
        body = math.sin(2.0 * math.pi * 180.0 * t) * math.exp(-t * 20.0)
        # Echo
        echo = 0.0
        if t > 0.12:
            echo = math.exp(-(t - 0.12) * 8.0) * (random.random() * 0.4 - 0.2)
        s = env_crack * noise * 1.5 + boom * 0.9 + body * 0.5 + echo
        samples.append(s)
    return samples

# 2. SFX Barricade Impact (Pancada sólida em madeira de caatinga e taipa)
def gen_impact():
    duration = 0.35
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    import random
    random.seed(101)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = math.exp(-t * 22.0)
        thud = math.sin(2.0 * math.pi * 110.0 * (1.0 - t) * t) * env
        splinter = (random.random() * 2.0 - 1.0) * math.exp(-t * 35.0) * 0.6
        s = thud + splinter
        samples.append(s)
    return samples

# 3. SFX Wave Horn (Berrante sertanejo convocando para a defesa)
def gen_wave_horn():
    duration = 1.6
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope com ataque e cauda
        env = min(1.0, t / 0.15) * math.exp(-max(0.0, t - 0.8) * 2.5)
        # Pitch glide característico de berrante (140Hz subindo para 185Hz e caindo para 165Hz)
        freq = 140.0 + 45.0 * math.sin(min(1.0, t / 0.7) * math.pi * 0.5)
        # Harmônicos ricos (tubo de chifre)
        s = (math.sin(2.0 * math.pi * freq * t) * 0.6 +
             math.sin(2.0 * math.pi * freq * 2.0 * t) * 0.3 +
             math.sin(2.0 * math.pi * freq * 3.0 * t) * 0.2 +
             math.sin(2.0 * math.pi * freq * 4.0 * t) * 0.1) * env
        samples.append(s)
    return samples

# 4. SFX Mutirão (Sino de capela sertaneja com ressonância dourada)
def gen_mutirao():
    duration = 1.8
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Strike transiente
        env = math.exp(-t * 2.8)
        # Harmônicos do bronze
        s = (math.sin(2.0 * math.pi * 659.25 * t) * 0.6 * env + # E5
             math.sin(2.0 * math.pi * 1318.5 * t) * 0.3 * math.exp(-t * 4.0) +
             math.sin(2.0 * math.pi * 1975.5 * t) * 0.15 * math.exp(-t * 6.0) +
             math.sin(2.0 * math.pi * 830.6 * t) * 0.25 * math.exp(-t * 2.2)) # Terça menor harmônica
        samples.append(s)
    return samples

# 5. SFX Prédica (Ressonância mística com coro e harmônico de órgão sertanejo)
def gen_predica():
    duration = 2.2
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = min(1.0, t / 0.3) * math.exp(-max(0.0, t - 1.2) * 2.0)
        # Acorde menor solene (A - C - E)
        f1 = 220.0
        f2 = 261.63
        f3 = 329.63
        vib = 1.0 + 0.015 * math.sin(2.0 * math.pi * 5.0 * t)
        s = (math.sin(2.0 * math.pi * f1 * vib * t) * 0.4 +
             math.sin(2.0 * math.pi * f2 * vib * t) * 0.35 +
             math.sin(2.0 * math.pi * f3 * vib * t) * 0.3) * env
        samples.append(s)
    return samples

# 6. SFX Vitória (Acorde alegre nordestino de viola e triângulo)
def gen_victory():
    duration = 2.4
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = min(1.0, t / 0.08) * math.exp(-max(0.0, t - 1.0) * 1.8)
        # Acorde de D Maior com nona (D - F# - A - E) em modo Mixolídio
        s = (math.sin(2.0 * math.pi * 293.66 * t) * 0.35 +
             math.sin(2.0 * math.pi * 369.99 * t) * 0.3 +
             math.sin(2.0 * math.pi * 440.00 * t) * 0.25 +
             math.sin(2.0 * math.pi * 659.25 * t) * 0.2) * env
        samples.append(s)
    return samples

# 7. SFX Derrota (Sino solene fúnebre)
def gen_defeat():
    duration = 2.5
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = min(1.0, t / 0.05) * math.exp(-t * 1.5)
        # Grave pesado e sombrio (D2 / 73.4Hz + F2 / 87.3Hz)
        s = (math.sin(2.0 * math.pi * 73.41 * t) * 0.6 +
             math.sin(2.0 * math.pi * 87.31 * t) * 0.4 +
             math.sin(2.0 * math.pi * 146.83 * t) * 0.25) * env
        samples.append(s)
    return samples

if __name__ == '__main__':
    base_dir = "assets/audio"
    write_wav(os.path.join(base_dir, "sfx_musket.wav"), gen_musket())
    write_wav(os.path.join(base_dir, "sfx_impact.wav"), gen_impact())
    write_wav(os.path.join(base_dir, "sfx_wave_horn.wav"), gen_wave_horn())
    write_wav(os.path.join(base_dir, "sfx_mutirao.wav"), gen_mutirao())
    write_wav(os.path.join(base_dir, "sfx_predica.wav"), gen_predica())
    write_wav(os.path.join(base_dir, "sfx_victory.wav"), gen_victory())
    write_wav(os.path.join(base_dir, "sfx_defeat.wav"), gen_defeat())
    print("All SFX generated successfully!")
