'use client';

import { StadiumForm } from '@/components/admin/StadiumForm';
import { StadiumNameModal } from '@/components/admin/modals/StadiumNameModal';
import { RelatedList } from '@/components/admin/RelatedList';
import { TabNav } from '@/components/admin/TabNav';
import { Pagination } from '@/components/admin/Pagination';
import { StadiumsTable } from '@/components/admin/tables/StadiumsTable';
import { useStadiumsAdmin } from '@/hooks/admin/useStadiumsAdmin';
import type { Team } from '@/types/spurs-women-admin';

interface StadiumsTabPanelProps {
  stadiumsAdmin: ReturnType<typeof useStadiumsAdmin>;
  teams: Team[];
  loading: boolean;
}

export function StadiumsTabPanel({ stadiumsAdmin, teams, loading }: StadiumsTabPanelProps) {
  const {
    search: stadiumSearch,
    setSearch: setStadiumSearch,
    currentPage: stadiumsCurrentPage,
    setCurrentPage: setStadiumsCurrentPage,
    totalPages: stadiumsTotalPages,
    filteredCount: filteredStadiumsCount,
    paginatedItems: paginatedStadiums,
    perPage: stadiumsPerPage,
    isStadiumEditMode,
    editingStadiumId,
    showStadiumForm,
    stadiumForm,
    setStadiumForm,
    stadiumEditTab,
    setStadiumEditTab,
    relatedStadiumNames,
    handleEditStadium,
    handleCancelEditStadium,
    handleDeleteStadium,
    handleStadiumSubmit,
    showStadiumNameModal,
    editingStadiumNameId,
    stadiumNameForm,
    setStadiumNameForm,
    stadiumNameFormError,
    openNewStadiumName,
    openEditStadiumName,
    closeStadiumNameModal,
    handleDeleteStadiumName,
    handleStadiumNameSubmit,
  } = stadiumsAdmin;

  return (
    <>
      {isStadiumEditMode && (
        <TabNav
          className="mb-4 flex space-x-2"
          tabs={[
            { key: 'details', label: 'Details', panelId: 'stadium-details-panel' },
            { key: 'related', label: 'Related Records', panelId: 'stadium-related-panel' },
          ]}
          activeKey={stadiumEditTab}
          onChange={setStadiumEditTab}
        />
      )}

      {stadiumEditTab === 'details' && (isStadiumEditMode || showStadiumForm) && (
        <div id="stadium-details-panel" role="tabpanel" aria-labelledby="tab-details">
          <StadiumForm
            teams={teams}
            stadiumForm={stadiumForm}
            setStadiumForm={setStadiumForm}
            isStadiumEditMode={isStadiumEditMode}
            editingStadiumId={editingStadiumId}
            loading={loading}
            onSubmit={handleStadiumSubmit}
            onDelete={() => {
              if (editingStadiumId && confirm('Are you sure you want to delete this stadium?')) {
                handleDeleteStadium(editingStadiumId);
              }
            }}
            onCancel={handleCancelEditStadium}
          />
        </div>
      )}

      {stadiumEditTab === 'related' && isStadiumEditMode && (
        <div id="stadium-related-panel" role="tabpanel" aria-labelledby="tab-related" className="space-y-4">
          {/* Stadium Names related list */}
          <RelatedList
            title="Stadium Names"
            records={relatedStadiumNames}
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'valid_from', label: 'Valid From' },
              { key: 'valid_to', label: 'Valid To' },
            ]}
            onNew={openNewStadiumName}
            onRecordClick={openEditStadiumName}
            emptyMessage="No stadium names found"
          />
        </div>
      )}

      {/* Recent Records Preview */}
      <div className="mt-8 spurs-accent-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold spurs-text">
            {stadiumSearch ? `All Stadiums (${filteredStadiumsCount} filtered)` : 'All Stadiums'}
          </h3>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search stadiums by name, slug, city, or country..."
            value={stadiumSearch}
            onChange={(e) => setStadiumSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <StadiumsTable stadiums={paginatedStadiums} onSelect={handleEditStadium} />
        <Pagination
          currentPage={stadiumsCurrentPage}
          totalPages={stadiumsTotalPages}
          totalItems={filteredStadiumsCount}
          perPage={stadiumsPerPage}
          itemLabel="stadiums"
          onPageChange={setStadiumsCurrentPage}
        />
      </div>

      {/* Stadium Name Modal */}
      {showStadiumNameModal && (
        <StadiumNameModal
          editingStadiumNameId={editingStadiumNameId}
          form={stadiumNameForm}
          onChange={setStadiumNameForm}
          error={stadiumNameFormError}
          onCancel={closeStadiumNameModal}
          onDelete={() => {
            if (editingStadiumNameId && confirm('Are you sure you want to delete this stadium name?')) {
              handleDeleteStadiumName(editingStadiumNameId);
              closeStadiumNameModal();
            }
          }}
          onSubmit={handleStadiumNameSubmit}
        />
      )}
    </>
  );
}
