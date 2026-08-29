"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePagination = usePagination;
const react_1 = require("react");
function usePagination(initialPage = 1, initialLimit = 10) {
    const [page, setPage] = (0, react_1.useState)(initialPage);
    const [limit, setLimit] = (0, react_1.useState)(initialLimit);
    const nextPage = () => setPage((prev) => prev + 1);
    const prevPage = () => setPage((prev) => Math.max(1, prev - 1));
    const goToPage = (p) => setPage(Math.max(1, p));
    return { page, limit, setLimit, nextPage, prevPage, goToPage };
}
