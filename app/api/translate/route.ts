import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("q");

  if (!text?.trim()) {
    return NextResponse.json({ result: "" }, { status: 400 });
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|th`;
    const res = await fetch(url, { next: { revalidate: 86400 } }); // cache 24h
    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return NextResponse.json({ result: data.responseData.translatedText });
    }

    return NextResponse.json({ result: text }); // fallback: original text
  } catch {
    return NextResponse.json({ result: text });
  }
}
