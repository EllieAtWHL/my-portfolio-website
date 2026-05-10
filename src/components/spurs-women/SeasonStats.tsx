'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Match } from '@/lib/data/matches';

interface SeasonStatsProps {
  matches: Match[];
  seasonName: string;
}

interface Stats {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  cleanSheets: number;
  attendedMatches: number;
  totalAttendance: number;
  averageAttendance: number;
  winPercentage: number;
  pointsPerGame: number;
  goalDifference: number;
  // Cup stats
  cupMatches: number;
  cupWins: number;
  cupDraws: number;
  cupLosses: number;
  cupGoalsScored: number;
  cupGoalsConceded: number;
  // Total competitive matches (league + cups)
  allCompetitiveMatches: number;
}

export default function SeasonStats({ matches, seasonName }: SeasonStatsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const calculateStats = (): Stats => {
    console.log('All matches for stats:', matches.map(m => ({ 
      id: m.id, 
      competition: m.competitions?.name, 
      spurs_score: m.spurs_score, 
      opponent_score: m.opponent_score 
    })));

    // Filter matches by competition type
    const leagueMatches = matches.filter(match => {
      const hasScore = match.spurs_score !== null && match.opponent_score !== null;
      const isWSL = match.competitions?.name?.toLowerCase().includes('super league');
      return hasScore && isWSL;
    });
    
    const cupMatches = matches.filter(match => 
      match.spurs_score !== null && 
      match.opponent_score !== null &&
      match.competitions?.name &&
      !match.competitions.name.toLowerCase().includes('super league') &&
      !match.competitions.name.toLowerCase().includes('friendly')
    );
    
    // For main stats, use only league matches (WSL)
    const completedMatches = leagueMatches;

    const totalMatches = completedMatches.length;
    const wins = completedMatches.filter(match => 
      match.spurs_score! > match.opponent_score!
    ).length;
    const draws = completedMatches.filter(match => 
      match.spurs_score === match.opponent_score
    ).length;
    const losses = completedMatches.filter(match => 
      match.spurs_score! < match.opponent_score!
    ).length;

    const goalsScored = completedMatches.reduce((sum, match) => 
      sum + (match.spurs_score || 0), 0
    );
    const goalsConceded = completedMatches.reduce((sum, match) => 
      sum + (match.opponent_score || 0), 0
    );

    const cleanSheets = completedMatches.filter(match => 
      match.opponent_score === 0
    ).length;

    // Attendance includes all competitive matches (league + cup)
    const allCompetitiveMatches = [...leagueMatches, ...cupMatches];
    const attendedMatches = allCompetitiveMatches.filter(match => match.attended).length;
    const matchesWithAttendance = allCompetitiveMatches.filter(match => 
      match.attendance !== null && match.attendance > 0
    );
    const totalAttendance = matchesWithAttendance.reduce((sum, match) => 
      sum + (match.attendance || 0), 0
    );
    const averageAttendance = matchesWithAttendance.length > 0 
      ? Math.round(totalAttendance / matchesWithAttendance.length)
      : 0;

    const winPercentage = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;
    const pointsPerGame = totalMatches > 0 ? ((wins * 3 + draws) / totalMatches) : 0;
    const goalDifference = goalsScored - goalsConceded;

    // Calculate cup stats
    const cupWins = cupMatches.filter(match => 
      match.spurs_score! > match.opponent_score!
    ).length;
    const cupDraws = cupMatches.filter(match => 
      match.spurs_score === match.opponent_score
    ).length;
    const cupLosses = cupMatches.filter(match => 
      match.spurs_score! < match.opponent_score!
    ).length;
    const cupGoalsScored = cupMatches.reduce((sum, match) => 
      sum + (match.spurs_score || 0), 0
    );
    const cupGoalsConceded = cupMatches.reduce((sum, match) => 
      sum + (match.opponent_score || 0), 0
    );

    return {
      totalMatches,
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      cleanSheets,
      attendedMatches,
      totalAttendance,
      averageAttendance,
      winPercentage,
      pointsPerGame,
      goalDifference,
      cupMatches: cupMatches.length,
      cupWins,
      cupDraws,
      cupLosses,
      cupGoalsScored,
      cupGoalsConceded,
      allCompetitiveMatches: allCompetitiveMatches.length
    };
  };

  const stats = calculateStats();

  const renderContent = () => {
    if (stats.totalMatches === 0) {
      return (
        <Card variant="spursAccent" padding="lg" clickable={false}>
          <p className="text-gray-600 dark:text-gray-400">
            No completed matches available for statistics calculation.
          </p>
        </Card>
      );
    }

    return (
      <Card variant="spursAccent" padding="lg" clickable={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* League Record Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg spurs-text">League Record</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Matches:</span>
                <span className="font-medium">{stats.totalMatches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Wins:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.wins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Draws:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.draws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Losses:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.losses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Win %:</span>
                <span className="font-medium">{stats.winPercentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Points/Game:</span>
                <span className="font-medium">{stats.pointsPerGame.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg spurs-text">Goals</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goals Scored:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.goalsScored}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goals Conceded:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.goalsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goal Difference:</span>
                <span className={`font-medium ${stats.goalDifference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Clean Sheets:</span>
                <span className="font-medium">{stats.cleanSheets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goals/Game:</span>
                <span className="font-medium">
                  {stats.totalMatches > 0 ? (stats.goalsScored / stats.totalMatches).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Cup Record Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg spurs-text">Cup Record</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Matches:</span>
                <span className="font-medium">{stats.cupMatches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Wins:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.cupWins}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Draws:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">{stats.cupDraws}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Losses:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.cupLosses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goals Scored:</span>
                <span className="font-medium text-green-600 dark:text-green-400">{stats.cupGoalsScored}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goals Conceded:</span>
                <span className="font-medium text-red-600 dark:text-red-400">{stats.cupGoalsConceded}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Goal Difference:</span>
                <span className={`font-medium ${(stats.cupGoalsScored - stats.cupGoalsConceded) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {(stats.cupGoalsScored - stats.cupGoalsConceded) > 0 ? '+' : ''}{stats.cupGoalsScored - stats.cupGoalsConceded}
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Section */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg spurs-text">Attendance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Games Attended:</span>
                <span className="font-medium">{stats.attendedMatches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Attendance Rate:</span>
                <span className="font-medium">
                  {stats.allCompetitiveMatches > 0 ? `${stats.attendedMatches}/${stats.allCompetitiveMatches}` : '0/0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Attendance %:</span>
                <span className="font-medium">
                  {stats.allCompetitiveMatches > 0 ? `${((stats.attendedMatches / stats.allCompetitiveMatches) * 100).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mb-8">
      {/* Header with title and expand/collapse button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="spurs-text text-2xl font-bold">Season Statistics</h2>
        <Button
          variant="spurs"
          size="xs"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Collapse statistics' : 'Expand statistics'}
        >
          {isExpanded ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </Button>
      </div>

      {isExpanded && renderContent()}
    </div>
  );
}
