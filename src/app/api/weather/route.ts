import { NextResponse } from "next/server";
import { getWeather } from "@/lib/nws";

// Lets a CDN or browser reuse a response briefly; the NWS data refreshes about hourly.
const CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET() {
  try {
    return NextResponse.json(await getWeather(), {
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  } catch (error) {
    console.error("Weather lookup failed:", error);
    return NextResponse.json(
      { error: "Weather service unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
