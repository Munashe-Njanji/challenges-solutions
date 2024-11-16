import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const CollatzComparison = () => {
    const [data, setData] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Simulate running the comparison for a smaller range for visualization
        const testRange = { start: 1, end: 100 };
        const memo = new Map();
        const comparisonData = [];

        for (let i = testRange.start; i <= testRange.end; i++) {
            const memoStart = performance.now();
            const memoResult = calculateCollatzMemoized(i, memo);
            const memoTime = performance.now() - memoStart;

            const nonMemoStart = performance.now();
            const nonMemoResult = calculateCollatzNonMemoized(i);
            const nonMemoTime = performance.now() - nonMemoStart;

            comparisonData.push({
                number: i,
                memoized: memoTime,
                nonMemoized: nonMemoTime,
                steps: memoResult.steps,
            });
        }

        setData(comparisonData);

        // Calculate summary statistics
        const summary = {
            memoizedTotal: comparisonData.reduce((sum, item) => sum + item.memoized, 0),
            nonMemoizedTotal: comparisonData.reduce((sum, item) => sum + item.nonMemoized, 0),
            maxSteps: Math.max(...comparisonData.map(item => item.steps))
        };

        setStats(summary);
    }, []);

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-2xl font-bold">Collatz Conjecture Performance Comparison</h2>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-100 rounded-lg">
                        <h3 className="font-semibold">Memoized Total Time</h3>
                        <p>{stats.memoizedTotal.toFixed(2)}ms</p>
                    </div>
                    <div className="p-4 bg-red-100 rounded-lg">
                        <h3 className="font-semibold">Non-memoized Total Time</h3>
                        <p>{stats.nonMemoizedTotal.toFixed(2)}ms</p>
                    </div>
                    <div className="p-4 bg-green-100 rounded-lg">
                        <h3 className="font-semibold">Max Steps</h3>
                        <p>{stats.maxSteps}</p>
                    </div>
                </div>
            )}

            <div className="w-full h-64">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="number" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="memoized" stroke="#3B82F6" name="Memoized" />
                    <Line type="monotone" dataKey="nonMemoized" stroke="#EF4444" name="Non-memoized" />
                </LineChart>
            </div>

            <div className="mt-4 text-sm text-gray-600">
                <p>The graph shows execution time comparison between memoized (blue) and non-memoized (red) implementations.</p>
                <p>Lower values indicate better performance.</p>
            </div>
        </div>
    );
};

export default CollatzComparison;