export declare function usePagination(initialPage?: number, initialLimit?: number): {
    page: number;
    limit: number;
    setLimit: import("react").Dispatch<import("react").SetStateAction<number>>;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (p: number) => void;
};
