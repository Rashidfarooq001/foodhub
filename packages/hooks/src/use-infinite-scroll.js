import { useEffect, useRef } from 'react';
export function useInfiniteScroll(onLoadMore, hasMore) {
    const observerTarget = useRef(null);
    useEffect(() => {
        const target = observerTarget.current;
        if (!target || !hasMore)
            return;
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                onLoadMore();
            }
        }, { threshold: 1.0 });
        observer.observe(target);
        return () => observer.unobserve(target);
    }, [hasMore, onLoadMore]);
    return { observerTarget };
}
