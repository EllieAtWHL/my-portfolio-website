'use client';

import { TeamForm } from '@/components/admin/TeamForm';
import { Pagination } from '@/components/admin/Pagination';
import { TeamsTable } from '@/components/admin/tables/TeamsTable';
import { useTeamsAdmin } from '@/hooks/admin/useTeamsAdmin';

interface TeamsTabPanelProps {
  teamsAdmin: ReturnType<typeof useTeamsAdmin>;
  loading: boolean;
}

export function TeamsTabPanel({ teamsAdmin, loading }: TeamsTabPanelProps) {
  const {
    search: teamSearch,
    setSearch: setTeamSearch,
    currentPage: teamsCurrentPage,
    setCurrentPage: setTeamsCurrentPage,
    totalPages: teamsTotalPages,
    filteredCount: filteredTeamsCount,
    paginatedItems: paginatedTeams,
    perPage: teamsPerPage,
    isTeamEditMode,
    editingTeamId,
    showTeamForm,
    teamForm,
    setTeamForm,
    handleEditTeam,
    handleCancelEditTeam,
    handleDeleteTeam,
    handleTeamSubmit,
  } = teamsAdmin;

  return (
    <>
      {(isTeamEditMode || showTeamForm) && (
        <TeamForm
          teamForm={teamForm}
          setTeamForm={setTeamForm}
          isTeamEditMode={isTeamEditMode}
          editingTeamId={editingTeamId}
          loading={loading}
          onSubmit={handleTeamSubmit}
          onDelete={() => {
            if (editingTeamId && confirm('Are you sure you want to delete this team?')) {
              handleDeleteTeam(editingTeamId);
            }
          }}
          onCancel={handleCancelEditTeam}
        />
      )}

      {/* Recent Records Preview */}
      <div className="mt-8 spurs-accent-card rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold spurs-text">
            {teamSearch ? `All Teams (${filteredTeamsCount} filtered)` : 'All Teams'}
          </h3>
        </div>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search teams by name or short name..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="w-full px-4 py-2 rounded border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <TeamsTable teams={paginatedTeams} onSelect={handleEditTeam} />
        <Pagination
          currentPage={teamsCurrentPage}
          totalPages={teamsTotalPages}
          totalItems={filteredTeamsCount}
          perPage={teamsPerPage}
          itemLabel="teams"
          onPageChange={setTeamsCurrentPage}
        />
      </div>
    </>
  );
}
