"use client";
import { useEffect, useState } from 'react';
import BubbleMenu from './BubbleMenu';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const navItems = [
        {
            label: 'Explore',
            href: '#explore',
            ariaLabel: 'Explore Characters',
            rotation: -8,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.9)', textColor: '#ffffff' }
        },
        {
            label: 'Chat',
            href: '#chat',
            ariaLabel: 'Chat with Characters',
            rotation: 8,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.8)', textColor: '#ffffff' }
        },
        {
            label: 'Debates',
            href: '#debates',
            ariaLabel: 'Character Debates',
            rotation: -5,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.85)', textColor: '#ffffff' }
        },
        {
            label: 'Library',
            href: '#library',
            ariaLabel: 'Knowledge Library',
            rotation: 5,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.75)', textColor: '#ffffff' }
        },
        {
            label: 'Login',
            href: '/login',
            ariaLabel: 'User Login',
            rotation: -3,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.95)', textColor: '#ffffff' }
        },
        {
            label: 'Signup',
            href: '/signup',
            ariaLabel: 'User Signup',
            rotation: 3,
            hoverStyles: { bgColor: 'rgba(0, 0, 0, 0.9)', textColor: '#ffffff' }
        }
    ];

    // Sophia logo component
    const sophiaLogo = (
        <h1 className="text-2xl font-extrabold text-black tracking-wide">
            Sophia
        </h1>
    );

    // Detect mobile screen
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Add blur effect to background when menu is open (mobile only)
    useEffect(() => {
        if (!isMobile) return;
        const mainContent = document.querySelector('[data-main-content]') as HTMLElement;
        const backgroundElement = document.querySelector('[data-background-blur]') as HTMLElement;
        if (mainContent && backgroundElement) {
            if (isMenuOpen) {
                mainContent.style.filter = 'blur(4px)';
                mainContent.style.transition = 'filter 0.3s ease';
                backgroundElement.style.filter = 'blur(4px)';
                backgroundElement.style.transition = 'filter 0.3s ease';
            } else {
                mainContent.style.filter = 'none';
                backgroundElement.style.filter = 'none';
            }
        }
    }, [isMenuOpen, isMobile]);

    if (isMobile) {
        return (
            <BubbleMenu
                logo={sophiaLogo}
                items={navItems}
                useFixedPosition={true}
                menuBg="#ffffff"
                menuContentColor="#000000"
                menuAriaLabel="Toggle navigation menu"
                onMenuClick={(open) => {
                    setIsMenuOpen(open);
                }}
            />
        );
    }

    // PC Navbar
    return (
        <nav className="flex items-center justify-between px-6 py-3 bg-transparent ">
            {sophiaLogo}
            <ul className="flex gap-4">
                {navItems.map((item) => (
                    <li key={item.label}>
                        <a
                            href={item.href}
                            aria-label={item.ariaLabel}
                            className="px-4 py-2 rounded-full font-semibold text-black transition-colors duration-200 hover:bg-black hover:text-white"
                            style={{
                                transform: `rotate(${item.rotation}deg)`
                            }}
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Navbar;