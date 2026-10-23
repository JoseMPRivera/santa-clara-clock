import { Clock } from "@/components/Clock";
import { WeatherPanel } from "@/components/WeatherPanel";

export default function Home() {
  return (
    <main className="page">
      <p className="page__place">Santa Clara County, California</p>
      <Clock />
      <WeatherPanel />
    </main>
  );
}
