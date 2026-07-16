import { CircularProgress } from "../components/ui/CircularProgress";
import { MOCK_DAILY_NUTRITION } from "../types/nutrition";

export default function Dashboard() {
    return (
        <main className="p-4">
            <h1 className="text-2xl font-bold"> Dashboard</h1>
            <CircularProgress data={MOCK_DAILY_NUTRITION.calories} />
        </main>
    );
}