import { NextResponse } from "next/server";
import { getWeather } from "@/lib/nws";

export async function GET() {
  try {
    return NextResponse.json(await getWeather());
  } catch (error) {
    console.error("Weather lookup failed:", error);
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
  }
}
