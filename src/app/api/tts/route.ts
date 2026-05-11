import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, langCode, rate = 1.0 } = await req.json();

    if (!text || !langCode) {
      return NextResponse.json(
        { error: 'Text and langCode are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Sarvam API key is not configured' },
        { status: 500 }
      );
    }

    // Mapping of simple language codes to Sarvam target language codes
    const sarvamLangMap: Record<string, string> = {
      'hi': 'hi-IN',
      'bn': 'bn-IN',
      'gu': 'gu-IN',
      'kn': 'kn-IN',
      'ml': 'ml-IN',
      'mr': 'mr-IN',
      'or': 'or-IN',
      'pa': 'pa-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'hi-IN': 'hi-IN',
      'bn-IN': 'bn-IN',
      'gu-IN': 'gu-IN',
      'kn-IN': 'kn-IN',
      'ml-IN': 'ml-IN',
      'mr-IN': 'mr-IN',
      'or-IN': 'or-IN',
      'pa-IN': 'pa-IN',
      'ta-IN': 'ta-IN',
      'te-IN': 'te-IN',
    };

    const targetLanguageCode = sarvamLangMap[langCode];
    
    if (!targetLanguageCode) {
      return NextResponse.json(
        { error: 'Language not supported by Sarvam AI TTS' },
        { status: 400 }
      );
    }

    // Call Sarvam API (Streaming)
    const response = await fetch('https://api.sarvam.ai/text-to-speech/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': apiKey,
      },
      body: JSON.stringify({
        text: text,
        target_language_code: targetLanguageCode,
        speaker: 'shubh', // valid speaker for v3
        model: 'bulbul:v3',
        pace: rate,
        speech_sample_rate: 22050,
        output_audio_codec: 'mp3',
        enable_preprocessing: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Sarvam AI error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate speech with Sarvam AI' },
        { status: response.status }
      );
    }

    // Stream the audio response back directly
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during speech synthesis' },
      { status: 500 }
    );
  }
}
