"use client";

import { useState } from "react";


// Reusable Counter component
function Counter({ title }) {
    const [count, setCount] = useState(0);

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-gray-300 p-6 shadow-md w-64">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-4xl font-bold">{count}</p>
            <div className="flex gap-4">
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                    onClick={() => setCount(count - 1)}
                >
                    −
                </button>
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                    onClick={() => setCount(count + 1)}
                >
                    +
                </button>
            </div>
        </div>
    );
}

// Parent component to display all three counters
export default function CounterGroup() {
    return (
        <div className="flex justify-center gap-8 p-10">
            <Counter title="Count #1" />
            <Counter title="Count #2" />
            <Counter title="Count #3" />
        </div>
    );
}

