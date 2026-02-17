/**
 * GSAP type declarations for CDN-loaded GSAP
 */

interface GSAPStatic {
    to(target: any, vars: any): any;
    from(target: any, vars: any): any;
    fromTo(target: any, fromVars: any, toVars: any): any;
    set(target: any, vars: any): any;
    timeline(vars?: any): any;
    registerPlugin(...plugins: any[]): void;
    context(func: () => void, scope?: any): { revert: () => void };
}

interface ScrollTriggerStatic {
    create(vars: any): any;
    refresh(): void;
    getAll(): any[];
    killAll(): void;
}

declare const gsap: GSAPStatic;
declare const ScrollTrigger: ScrollTriggerStatic;

interface Window {
    gsap: GSAPStatic;
    ScrollTrigger: ScrollTriggerStatic;
}
