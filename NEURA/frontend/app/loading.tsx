export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0a0f1c]">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00f2ff]"></div>
                <p className="text-[#00f2ff] font-medium animate-pulse">Loading Neura...</p>
            </div>
        </div>
    );
}
