"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInfiniteScroll = useInfiniteScroll;
const react_1 = require("react");
function useInfiniteScroll(onLoadMore, hasMore) {
    const observerTarget = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
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
