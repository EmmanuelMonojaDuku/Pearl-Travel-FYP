#!/usr/bin/env python3
"""
Universal VLC-Compliant Video & Audio Generator for Pearl Travel Malaba OSBP Guide.
Generates:
  1. Malaba_Border_Clearance_4K_Guide.mp4 (English Master with H.264 High 4.1, SAR 1:1, DAR 16:9, faststart, 192k AAC stereo)
  2. Malaba_Border_Clearance_Swahili_4K.mp4 (Swahili Master with H.264 High 4.1, SAR 1:1, DAR 16:9, faststart, 192k AAC stereo)
  3. Malaba_OSBP_Inspector_Okello_Audio_Narration.mp3 (192k MP3 stereo standalone audio track)
  4. Synchronized SRT & VTT subtitle files for English and Swahili
"""

import os
import shutil
import subprocess

BASE_DIR = '/app/applet'
ASSETS_IMG_DIR = os.path.join(BASE_DIR, 'src/assets/images')
PUBLIC_VIDEOS_DIR = os.path.join(BASE_DIR, 'public/videos')
DIST_VIDEOS_DIR = os.path.join(BASE_DIR, 'dist/videos')
TMP_DIR = '/tmp/malaba_vlc_build'

os.makedirs(TMP_DIR, exist_ok=True)
os.makedirs(PUBLIC_VIDEOS_DIR, exist_ok=True)
os.makedirs(DIST_VIDEOS_DIR, exist_ok=True)

IMAGES = [
    os.path.join(ASSETS_IMG_DIR, 'malaba_border_intro_1789375133477.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_passport_clearance_1789375152233.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_interstate_pass_1789375165908.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_tmp_office_1789375177805.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_customs_health_1789375190085.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_final_exit_1789375203378.jpg'),
    os.path.join(ASSETS_IMG_DIR, 'malaba_pearl_app_1789375216363.jpg'),
]

EN_SCENES = [
    {
        'title': 'Welcome to Malaba OSBP',
        'text': 'Welcome to Uganda! I am Inspector David Okello from Immigration.',
        'subtitle': 'Welcome to Uganda, the Pearl of Africa! I am Inspector David Okello from Immigration.',
    },
    {
        'title': 'Passport & eVisa Clearance',
        'text': 'Present your valid passport and approved eVisa at the clearance counters.',
        'subtitle': 'Present your valid passport and approved eVisa at the clearance counters.',
    },
    {
        'title': 'EAC Interstate Passes',
        'text': 'EAC citizens may cross using an Interstate Pass or National ID.',
        'subtitle': 'East African Community citizens may cross using an Interstate Pass or National ID.',
    },
    {
        'title': 'Temporary Movement Passes',
        'text': 'Temporary Movement Passes are issued here for residents without passports.',
        'subtitle': 'Temporary Movement Passes are issued here for residents without passports.',
    },
    {
        'title': 'Port Health & Customs',
        'text': 'Verify your Yellow Fever card at Port Health and declare goods at Customs.',
        'subtitle': 'Verify your Yellow Fever card at Port Health and declare goods at Customs.',
    },
    {
        'title': 'Border Stamp & Exit Gate',
        'text': 'Receive your entry stamp and proceed safely through the final exit gate.',
        'subtitle': 'Receive your entry stamp and proceed safely through the final exit gate.',
    },
    {
        'title': 'Pearl Travel Border Guide',
        'text': 'Safe travels in the Pearl of Africa with Pearl Travel Border Guide.',
        'subtitle': 'Safe travels in the Pearl of Africa with Pearl Travel Border Guide.',
    },
]

SW_SCENES = [
    {
        'title': 'Karibu Malaba OSBP',
        'text': 'Karibu Uganda, Lulu ya Afrika! Naitwa Mkaguzi David Okello.',
        'subtitle': 'Karibu Uganda, Lulu ya Afrika! Naitwa Mkaguzi David Okello kutoka Uhamiaji.',
    },
    {
        'title': 'Ukaguzi wa Pasipoti na Visa',
        'text': 'Wasilisha pasipoti yako na visa halali katika madirisha ya ukaguzi.',
        'subtitle': 'Wasilisha pasipoti yako na visa halali katika madirisha ya ukaguzi.',
    },
    {
        'title': 'Pasi za Safari za EAC',
        'text': 'Raia wa Afrika Mashariki tumia Pasi ya Safari au Kitambulisho.',
        'subtitle': 'Raia wa Jumuiya ya Afrika Mashariki wanaweza kutumia Pasi ya Safari au Kitambulisho.',
    },
    {
        'title': 'Pasi za Muda (TMP)',
        'text': 'Pasi ya muda ya kusafiri inatolewa hapa kwa wasio na pasipoti.',
        'subtitle': 'Pasi ya muda ya kusafiri inatolewa hapa kwa wakazi wasio na pasipoti.',
    },
    {
        'title': 'Afya ya Mpaka na Forodha',
        'text': 'Thibitisha cheti cha Homa ya Manjano na ukague mizigo forodha.',
        'subtitle': 'Thibitisha cheti cha Homa ya Manjano na ukague mizigo katika kituo cha forodha.',
    },
    {
        'title': 'Muhuri wa Kuingia na Geti Kuu',
        'text': 'Pokea muhuri wa kuingia na kuelekea geti kuu la kutokea.',
        'subtitle': 'Pokea muhuri wa kuingia na kuelekea geti kuu la kuingia nchini Uganda.',
    },
    {
        'title': 'Mwongozo wa Pearl Travel',
        'text': 'Safari njema ukitumia mfumo rasmi wa Pearl Travel.',
        'subtitle': 'Safari njema ukitumia mfumo rasmi wa mwongozo wa mpaka wa Pearl Travel.',
    },
]


def build_audio_track(scenes, lang_code, out_wav_path):
    print(f'Building audio track for language: {lang_code}...')
    scene_wavs = []
    for i, sc in enumerate(scenes):
        v_raw = os.path.join(TMP_DIR, f'v_{lang_code}_{i}.wav')
        subprocess.run(
            ['ffmpeg', '-y', '-f', 'lavfi', '-i', f"flite=text='{sc['text']}':voice=rms", v_raw],
            check=True,
            stderr=subprocess.PIPE,
        )

        sc_exact = os.path.join(TMP_DIR, f'sc_{lang_code}_{i}_6s.wav')
        filter_str = (
            'sine=frequency=587.33:duration=0.55,afade=t=in:ss=0:d=0.04,afade=t=out:st=0.3:d=0.25,volume=0.32[chime];'
            'sine=frequency=110:duration=6,volume=0.015[amb];'
            '[0:a]adelay=450|450,volume=1.85[voice];'
            '[chime][voice][amb]amix=inputs=3:dropout_transition=0:normalize=0,apad,atrim=0:6,loudnorm=I=-16:TP=-1.5:LRA=7[outa]'
        )
        subprocess.run(
            [
                'ffmpeg',
                '-y',
                '-i',
                v_raw,
                '-filter_complex',
                filter_str,
                '-map',
                '[outa]',
                '-c:a',
                'pcm_s16le',
                '-ar',
                '48000',
                sc_exact,
            ],
            check=True,
            stderr=subprocess.PIPE,
        )
        scene_wavs.append(sc_exact)

    concat_txt = os.path.join(TMP_DIR, f'audio_concat_{lang_code}.txt')
    with open(concat_txt, 'w') as f:
        for sw in scene_wavs:
            f.write(f"file '{sw}'\n")

    subprocess.run(
        [
            'ffmpeg',
            '-y',
            '-f',
            'concat',
            '-safe',
            '0',
            '-i',
            concat_txt,
            '-c:a',
            'pcm_s16le',
            '-ar',
            '48000',
            out_wav_path,
        ],
        check=True,
        stderr=subprocess.PIPE,
    )
    print(f'Finished audio track {out_wav_path}')


def build_silent_video_track(out_mp4_path):
    print('Building pristine 1920x1080 1:1 SAR video stream...')
    filter_inputs = []
    filter_graph_parts = []

    for i, img in enumerate(IMAGES):
        filter_inputs.extend(['-loop', '1', '-t', '6.0', '-i', img])
        filter_graph_parts.append(
            f'[{i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=25[v{i}]'
        )

    all_v = ''.join([f'[v{i}]' for i in range(len(IMAGES))])
    filter_graph_parts.append(f'{all_v}concat=n={len(IMAGES)}:v=1:a=0[outv]')

    full_filter = ';'.join(filter_graph_parts)

    cmd = (
        ['ffmpeg', '-y']
        + filter_inputs
        + [
            '-filter_complex',
            full_filter,
            '-map',
            '[outv]',
            '-c:v',
            'libx264',
            '-preset',
            'fast',
            '-profile:v',
            'high',
            '-level',
            '4.1',
            '-pix_fmt',
            'yuv420p',
            '-color_primaries',
            'bt709',
            '-color_trc',
            'bt709',
            '-colorspace',
            'bt709',
            '-r',
            '25',
            '-g',
            '50',
            '-keyint_min',
            '25',
            '-aspect',
            '16:9',
            '-an',
            out_mp4_path,
        ]
    )

    subprocess.run(cmd, check=True)
    print(f'Finished silent video track {out_mp4_path}')


def mux_vlc_mp4(video_path, audio_wav_path, out_mp4_path):
    print(f'Muxing universal VLC MP4 -> {out_mp4_path}...')
    cmd = [
        'ffmpeg',
        '-y',
        '-i',
        video_path,
        '-i',
        audio_wav_path,
        '-c:v',
        'copy',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-ar',
        '48000',
        '-ac',
        '2',
        '-shortest',
        '-movflags',
        '+faststart',
        out_mp4_path,
    ]
    subprocess.run(cmd, check=True)
    print(f'Created {out_mp4_path}')


def create_mp3(audio_wav_path, out_mp3_path):
    print(f'Encoding standalone MP3 -> {out_mp3_path}...')
    cmd = [
        'ffmpeg',
        '-y',
        '-i',
        audio_wav_path,
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        '-ar',
        '44100',
        '-ac',
        '2',
        out_mp3_path,
    ]
    subprocess.run(cmd, check=True)
    print(f'Created {out_mp3_path}')


def generate_subtitles(scenes, lang_code):
    srt_lines = []
    vtt_lines = ['WEBVTT - Malaba One-Stop Border Post Passenger Orientation\n']

    for i, sc in enumerate(scenes):
        start_sec = i * 6.0
        end_sec = (i + 1) * 6.0

        sh = int(start_sec // 3600)
        sm = int((start_sec % 3600) // 60)
        ss = int(start_sec % 60)
        sms = 0

        eh = int(end_sec // 3600)
        em = int((end_sec % 3600) // 60)
        es = int(end_sec % 60)
        ems = 0

        srt_time = f'{sh:02d}:{sm:02d}:{ss:02d},{sms:03d} --> {eh:02d}:{em:02d}:{es:02d},{ems:03d}'
        vtt_time = f'{sh:02d}:{sm:02d}:{ss:02d}.{sms:03d} --> {eh:02d}:{em:02d}:{es:02d}.{ems:03d}'

        srt_lines.append(f'{i + 1}\n{srt_time}\n{sc["subtitle"]}\n')
        vtt_lines.append(f'{vtt_time}\n{sc["subtitle"]}\n')

    srt_path = os.path.join(PUBLIC_VIDEOS_DIR, f'Malaba_OSBP_Subtitles_{lang_code.upper()}.srt')
    vtt_path = os.path.join(PUBLIC_VIDEOS_DIR, f'Malaba_OSBP_Subtitles_{lang_code.upper()}.vtt')

    with open(srt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(srt_lines) + '\n')
    with open(vtt_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(vtt_lines) + '\n')

    shutil.copy(srt_path, os.path.join(DIST_VIDEOS_DIR, os.path.basename(srt_path)))
    shutil.copy(vtt_path, os.path.join(DIST_VIDEOS_DIR, os.path.basename(vtt_path)))


def main():
    raw_video = os.path.join(TMP_DIR, 'raw_video_1080p.mp4')
    build_silent_video_track(raw_video)

    en_audio_wav = os.path.join(TMP_DIR, 'audio_en_master.wav')
    build_audio_track(EN_SCENES, 'en', en_audio_wav)

    sw_audio_wav = os.path.join(TMP_DIR, 'audio_sw_master.wav')
    build_audio_track(SW_SCENES, 'sw', sw_audio_wav)

    # English MP4
    en_mp4 = os.path.join(PUBLIC_VIDEOS_DIR, 'Malaba_Border_Clearance_4K_Guide.mp4')
    mux_vlc_mp4(raw_video, en_audio_wav, en_mp4)
    shutil.copy(en_mp4, os.path.join(DIST_VIDEOS_DIR, os.path.basename(en_mp4)))

    # Swahili MP4
    sw_mp4 = os.path.join(PUBLIC_VIDEOS_DIR, 'Malaba_Border_Clearance_Swahili_4K.mp4')
    mux_vlc_mp4(raw_video, sw_audio_wav, sw_mp4)
    shutil.copy(sw_mp4, os.path.join(DIST_VIDEOS_DIR, os.path.basename(sw_mp4)))

    # Standalone MP3 (Inspector Okello Narration)
    mp3_out = os.path.join(PUBLIC_VIDEOS_DIR, 'Malaba_OSBP_Inspector_Okello_Audio_Narration.mp3')
    create_mp3(en_audio_wav, mp3_out)
    shutil.copy(mp3_out, os.path.join(DIST_VIDEOS_DIR, os.path.basename(mp3_out)))

    # Subtitles
    generate_subtitles(EN_SCENES, 'en')
    generate_subtitles(SW_SCENES, 'sw')

    print('ALL VIDEO AND AUDIO ASSETS REGENERATED SUCCESSFULLY!')


if __name__ == '__main__':
    main()
