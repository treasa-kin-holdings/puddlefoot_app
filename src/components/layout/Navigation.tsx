import Link from 'next/link';
import HamburgerMenu from '@/components/companion/HamburgerMenu';

export default function Navigation() {
    return (
        <nav className="glass container mx-auto my-6 px-6 py-4 sticky top-4 z-50 flex flex-col items-center gap-4">
            {/* Top Row: Centered enlarged title */}
            <Link href="/" className="text-inherit no-underline text-center w-full">
                <span className="font-bold text-[3rem] font-heading tracking-tight leading-none block">TerraVanta</span>
            </Link>

            {/* Bottom Row: Hamburger menu on the left */}
            <div className="w-full flex justify-start">
                <HamburgerMenu />
            </div>
        </nav>
    );
}
