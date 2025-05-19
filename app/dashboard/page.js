// Import the CounterGroup component
import CounterGroup from "../component/Counter"; // adjust path if needed

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <CounterGroup />
    </div>
  );
}
