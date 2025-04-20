import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Add current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (pages[pages.length - 1] !== i - 1) {
        // Add ellipsis if there's a gap
        pages.push(-1); // -1 represents ellipsis
      }
      pages.push(i);
    }

    // Add last page if not already included
    if (totalPages > 1) {
      if (pages[pages.length - 1] !== totalPages - 1) {
        // Add ellipsis if there's a gap
        pages.push(-1); // -1 represents ellipsis
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex justify-between items-center px-0 py-5 max-md:flex-col max-md:items-start max-sm:flex-col max-sm:items-start">
      <button
        className="flex items-center px-3.5 py-2 text-sm bg-white rounded-lg border border-gray-300 border-solid shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-slate-700 cursor-pointer"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ margin: '0 5px' }}
        >
          <path d="M15.8332 9.99984H4.1665M4.1665 9.99984L9.99984 15.8332M4.1665 9.99984L9.99984 4.1665" stroke="#344054" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <span>Previous</span>
      </button>

      <div className="flex gap-0.5 items-center max-md:flex-wrap max-sm:flex-wrap">
        {pageNumbers.map((pageNumber, index) => (
          pageNumber === -1 ? (
            <div key={`ellipsis-${index}`} className="w-10 h-10 text-sm text-gray-500 rounded-lg flex items-center justify-center">
              ...
            </div>
          ) : (
            <button
              key={pageNumber}
              className={`w-10 h-10 text-sm rounded-lg flex items-center justify-center cursor-pointer ${
                pageNumber === currentPage
                  ? 'bg-[#E8DEF8] text-[#6941C6]'
                  : 'text-gray-500'
              }`}
              onClick={() => onPageChange(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          )
        ))}
      </div>

      <button
        className="flex items-center px-3.5 py-2 text-sm bg-white rounded-lg border border-gray-300 border-solid shadow-[0px_1px_2px_rgba(16,24,40,0.05)] text-slate-700 cursor-pointer"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <span>Next</span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ margin: '0 5px' }}
        >
          <path d="M4.16675 9.99984H15.8334M15.8334 9.99984L10.0001 4.1665M15.8334 9.99984L10.0001 15.8332" stroke="#344054" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
      </button>
    </nav>
  );
};
