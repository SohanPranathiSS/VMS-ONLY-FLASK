import React from 'react';
import '../styles/Pagination.css';

const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  console.log('Pagination component props:', {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    showItemsPerPage
  });
  const handlePrevPage = () => {
    if (currentPage > 1) {
      console.log('Pagination: Going to previous page:', currentPage - 1);
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      console.log('Pagination: Going to next page:', currentPage + 1);
      onPageChange(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
      pages.push(
        <button key={1} onClick={() => {
          console.log('Pagination: Going to first page');
          onPageChange(1);
        }} className="pagination-btn">
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="start-ellipsis" className="pagination-ellipsis">...</span>);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => {
            console.log('Pagination: Clicking page button:', i);
            onPageChange(i);
          }}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="end-ellipsis" className="pagination-ellipsis">...</span>);
      }
      pages.push(
        <button key={totalPages} onClick={() => {
          console.log('Pagination: Going to last page:', totalPages);
          onPageChange(totalPages);
        }} className="pagination-btn">
          {totalPages}
        </button>
      );
    }
    
    return pages;
  };

  if (totalPages <= 1 && !showItemsPerPage) return null;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span>
          Showing {totalItems > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
        </span>
      </div>
      
      <div className="pagination-main">
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              onClick={() => {
                console.log('Pagination: Going to first page via first button');
                onPageChange(1);
              }}
              disabled={currentPage === 1}
              className="pagination-btn pagination-first"
              title="First page"
            >
              ««
            </button>
            <button 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-btn pagination-prev"
              title="Previous page"
            >
              ‹
            </button>
            
            {renderPageNumbers()}
            
            <button 
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-next"
              title="Next page"
            >
              ›
            </button>
            <button 
              onClick={() => {
                console.log('Pagination: Going to last page via last button:', totalPages);
                onPageChange(totalPages);
              }}
              disabled={currentPage === totalPages}
              className="pagination-btn pagination-last"
              title="Last page"
            >
              »»
            </button>
          </div>
        )}
        
        {showItemsPerPage && (
          <div className="items-per-page">
            <label htmlFor="itemsPerPage">Show: </label>
            <select 
              id="itemsPerPage"
              value={itemsPerPage} 
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                console.log('Pagination: Items per page changed to:', newValue);
                onItemsPerPageChange(newValue);
              }}
              className="items-per-page-select"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <span> per page</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
