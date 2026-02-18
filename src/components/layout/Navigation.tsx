import Link from 'next/link';

export default function Navigation() {
    return (
        <nav className="glass container mx-auto my-6 px-6 py-3 sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
                <span className="text-2xl">🐧</span>
                <span className="font-bold text-xl font-heading">Puddlefoot</span>
            </Link>

            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center w-full md:w-auto">
                <Link href="/dashboard" className="font-medium opacity-80 hover:opacity-100 transition-opacity">Dashboard</Link>
                <Link href="/plants" className="font-medium opacity-80 hover:opacity-100 transition-opacity">My Plants</Link>
                <Link href="/assistant" className="font-medium opacity-80 hover:opacity-100 transition-opacity">Assistant</Link>
                <button className="button-primary px-5 py-2 rounded-md w-full md:w-auto">
                    Sign In
                </button>
            </div>
        </nav>
    );
}
