import { useState, useEffect } from "react";
import type { FlashcardDTO, PaginatedResponse, UpdateFlashcardCommand } from "../../types";
import FlashcardTable from "./FlashcardTable";
import FlashcardFilters from "./FlashcardFilters";
import PaginationControls from "./PaginationControls";
import EditFlashcardModal from "./EditFlashcardModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

// FlashcardViewModel interface
interface FlashcardViewModel {
  uuid: string;
  front: string;
  back: string;
  method: "ai" | "manual";
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

// Main view model interface
interface FlashcardsListViewModel {
  flashcards: FlashcardViewModel[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalItems: number;
  };
  filters: {
    status: "pending" | "accepted" | "rejected" | null;
    method: "ai" | "manual" | null;
    sort: string | null;
  };
  editingFlashcard: FlashcardViewModel | null;
  isEditModalOpen: boolean;
  deletingFlashcardId: string | null;
  isDeleteModalOpen: boolean;
  isSaving: boolean;
  isDeleting: boolean;
}

const FlashcardsListView = () => {
  // Initialize state with default values
  const [state, setState] = useState<FlashcardsListViewModel>({
    flashcards: [],
    isLoading: true,
    error: null,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      totalItems: 0,
    },
    filters: {
      status: null,
      method: null,
      sort: null,
    },
    editingFlashcard: null,
    isEditModalOpen: false,
    deletingFlashcardId: null,
    isDeleteModalOpen: false,
    isSaving: false,
    isDeleting: false,
  });

  // Function to fetch flashcards from API
  const fetchFlashcards = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: state.pagination.currentPage.toString(),
        limit: state.pagination.limit.toString(),
      });
      
      if (state.filters.status) {
        queryParams.append("status", state.filters.status);
      }
      
      if (state.filters.method) {
        queryParams.append("method", state.filters.method);
      }
      
      if (state.filters.sort) {
        queryParams.append("sort", state.filters.sort);
      }
      
      // Fetch data from API
      const response = await fetch(`/api/flashcards?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching flashcards: ${response.status}`);
      }
      
      const data: PaginatedResponse<FlashcardDTO> = await response.json();
      
      // Map DTOs to ViewModels
      const flashcards: FlashcardViewModel[] = data.data.map((dto) => ({
        uuid: dto.uuid,
        front: dto.front,
        back: dto.back,
        method: dto.method,
        status: dto.status,
        createdAt: new Date(dto.createdAt).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      
      // Update state with fetched data
      setState((prev) => ({
        ...prev,
        flashcards,
        isLoading: false,
        pagination: {
          currentPage: data.page,
          totalPages: data.totalPages,
          limit: data.limit,
          totalItems: data.total,
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  };

  // Fetch flashcards when dependencies change
  useEffect(() => {
    fetchFlashcards();
  }, [
    state.pagination.currentPage,
    state.filters.status,
    state.filters.method,
    state.filters.sort,
  ]);

  // Handler for page changes
  const handlePageChange = (newPage: number) => {
    setState((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        currentPage: newPage,
      },
    }));
  };

  // Handler for filter changes
  const handleFilterChange = (newFilters: Partial<FlashcardsListViewModel["filters"]>) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
      },
      pagination: {
        ...prev.pagination,
        currentPage: 1, // Reset to first page on filter change
      },
    }));
  };

  // Handler for sort changes
  const handleSortChange = (sortKey: string | null) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        sort: sortKey,
      },
      pagination: {
        ...prev.pagination,
        currentPage: 1, // Reset to first page on sort change
      },
    }));
  };

  // Open edit modal
  const handleOpenEditModal = (flashcard: FlashcardViewModel) => {
    setState((prev) => ({
      ...prev,
      editingFlashcard: flashcard,
      isEditModalOpen: true,
    }));
  };

  // Close edit modal
  const handleCloseEditModal = () => {
    setState((prev) => ({
      ...prev,
      isEditModalOpen: false,
      editingFlashcard: null,
      isSaving: false,
    }));
  };

  // Save edited flashcard
  const handleSaveEdit = async (flashcardId: string, data: UpdateFlashcardCommand) => {
    setState((prev) => ({ ...prev, isSaving: true }));
    
    try {
      const response = await fetch(`/api/flashcards/${flashcardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating flashcard: ${response.status}`);
      }
      
      const updatedFlashcard: FlashcardDTO = await response.json();
      
      // Update the flashcard in the list
      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.map((f) =>
          f.uuid === flashcardId
            ? {
                ...f,
                front: updatedFlashcard.front,
                back: updatedFlashcard.back,
              }
            : f
        ),
        isEditModalOpen: false,
        editingFlashcard: null,
        isSaving: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (flashcardId: string) => {
    setState((prev) => ({
      ...prev,
      deletingFlashcardId: flashcardId,
      isDeleteModalOpen: true,
    }));
  };

  // Close delete confirmation modal
  const handleCloseDeleteModal = () => {
    setState((prev) => ({
      ...prev,
      isDeleteModalOpen: false,
      deletingFlashcardId: null,
      isDeleting: false,
    }));
  };

  // Confirm and perform delete
  const handleConfirmDelete = async () => {
    if (!state.deletingFlashcardId) return;
    
    setState((prev) => ({ ...prev, isDeleting: true }));
    
    try {
      const response = await fetch(`/api/flashcards/${state.deletingFlashcardId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting flashcard: ${response.status}`);
      }
      
      // Remove the flashcard from the list and update state
      setState((prev) => ({
        ...prev,
        flashcards: prev.flashcards.filter(
          (f) => f.uuid !== prev.deletingFlashcardId
        ),
        isDeleteModalOpen: false,
        deletingFlashcardId: null,
        isDeleting: false,
        pagination: {
          ...prev.pagination,
          totalItems: prev.pagination.totalItems - 1,
          totalPages: Math.ceil((prev.pagination.totalItems - 1) / prev.pagination.limit),
        },
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDeleting: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
      handleCloseDeleteModal();
    }
  };

  // Retry fetching on error
  const handleRetryFetch = () => {
    fetchFlashcards();
  };

  // Render loading state
  if (state.isLoading && state.flashcards.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <FlashcardFilters
          filters={state.filters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
        
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  // Render error state
  if (state.error && state.flashcards.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <FlashcardFilters
          filters={state.filters}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
        />
        
        <div className="bg-destructive/15 p-4 rounded-md text-destructive">
          <h3 className="font-bold mb-2">Wystąpił błąd podczas ładowania fiszek</h3>
          <p className="mb-4">{state.error}</p>
          <button
            onClick={handleRetryFetch}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // Render main content with filters always visible
  return (
    <div className="space-y-6">
      {/* Filters */}
      <FlashcardFilters
        filters={state.filters}
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
      />

      {/* Conditional content based on flashcards availability */}
      {state.flashcards.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <h3 className="font-bold mb-2 text-xl">Nie znaleziono fiszek</h3>
          <p className="text-muted-foreground">
            {state.filters.status || state.filters.method
              ? "Brak fiszek spełniających wybrane kryteria. Zmień filtry i spróbuj ponownie."
              : "Nie masz jeszcze żadnych fiszek. Utwórz nową!"}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <FlashcardTable
            flashcards={state.flashcards}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
          />

          {/* Pagination */}
          <PaginationControls
            pagination={state.pagination}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {/* Edit Modal */}
      <EditFlashcardModal
        isOpen={state.isEditModalOpen}
        flashcard={state.editingFlashcard}
        onSave={handleSaveEdit}
        onClose={handleCloseEditModal}
        isSaving={state.isSaving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={state.isDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
        isDeleting={state.isDeleting}
      />
    </div>
  );
};

export default FlashcardsListView; 