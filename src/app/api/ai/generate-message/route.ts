import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { roughText, messageType, schoolName } = await request.json();

    if (!roughText || !messageType || !schoolName) {
      return NextResponse.json(
        { error: 'Missing required fields: roughText, messageType, schoolName' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `You are a professional school communication assistant for Indian schools. Take the rough message below and rewrite it as a polished, professional WhatsApp message from ${schoolName} to parents.

Rules:
- Keep it concise (under 500 characters)
- Warm but professional tone
- Include the school name "${schoolName}"
- Preserve any template variables like {{parent_name}}, {{student_name}}, {{class}}, {{section}}, {{school_name}}, {{amount}}, {{due_date}}, {{fee_type}}, {{date}} — do NOT replace them
- Output ONLY the final message text, nothing else

Message type: ${messageType}
Rough message: ${roughText}`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `Anthropic API error: ${response.status}`;
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    const data = await response.json();
    const generatedText = data?.content?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({ error: 'No content generated' }, { status: 500 });
    }

    return NextResponse.json({ message: generatedText });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
