export default function AccountPagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (page <= 1 && totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </button>
      <span>Página {page}</span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Siguiente
      </button>
    </nav>
  );
}
