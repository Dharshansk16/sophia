"use client";
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    // Sophia logo component
    const sophiaLogo = (
        <h1 className="text-3xl font-extrabold text-black tracking-wide cursor-pointer" onClick={() => router.push('/')}>
            Sophia
        </h1>
    );

    return (
        <nav className="flex items-center justify-between px-6 py-3 bg-transparent shadow">
            {sophiaLogo}
            <div>
                {user ? (
                    <button
                        className="px-4 py-2 rounded-full font-semibold text-white bg-black hover:bg-gray-800 transition"
                        onClick={async () => {
                            await signOut();
                            router.push('/');
                        }}
                    >
                        Logout
                    </button>
                ) : (
                    <button
                        className="px-4 py-2 rounded-full font-semibold text-white bg-black hover:bg-gray-800 transition"
                        onClick={async () => {
                            router.push('/auth/login');
                        }}
                    >
                        Login
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
