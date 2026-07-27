const TEAM_COLORS = ['#1565c0', '#555555', '#00a844', '#d63050', '#f39c12', '#7c4dff'];

export function fallbackTeamColor(index: number): string {
  return TEAM_COLORS[index % TEAM_COLORS.length];
}
