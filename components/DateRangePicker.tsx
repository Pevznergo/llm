"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Calendar } from "lucide-react";

export function DateRangePicker() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Default to last 7 days if not present
    const defaultEnd = new Date();
    const defaultStart = subDays(defaultEnd, 7);

    const [start, setStart] = useState(searchParams.get("startDate") || format(defaultStart, "yyyy-MM-dd"));
    const [end, setEnd] = useState(searchParams.get("endDate") || format(defaultEnd, "yyyy-MM-dd"));

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(name, value);
            // Reset page on filter change
            params.set("page", "1");
            return params.toString();
        },
        [searchParams]
    );

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStart(value);
        router.push(pathname + "?" + createQueryString("startDate", value));
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEnd(value);
        router.push(pathname + "?" + createQueryString("endDate", value));
    };

    return (
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 text-sm">
            <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-gray-500">From:</span>
                <input
                    type="date"
                    value={start}
                    onChange={handleStartChange}
                    className="bg-transparent border-none focus:ring-0 p-0 text-gray-700 w-32"
                />
            </div>
            <div className="w-px h-4 bg-gray-200"></div>
            <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-gray-500">To:</span>
                <input
                    type="date"
                    value={end}
                    onChange={handleEndChange}
                    className="bg-transparent border-none focus:ring-0 p-0 text-gray-700 w-32"
                />
            </div>
        </div>
    );
}
