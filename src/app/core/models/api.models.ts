// =============================================================================
// FERINO — API Models (generated from swagger.json)
// =============================================================================

// --------------- AUTH ---------------
export interface LoginRequestDTO {
  login: string;      // email, max 100
  password: string;   // min 8, max 72
}

export interface TokenResponseDTO {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface LogoutRequestDTO {
  refreshToken?: string;
}

// --------------- USERS ---------------
export interface CreateUserRequestDTO {
  name: string;              // max 250
  nickname: string;          // max 100
  password: string;          // min 8, max 72
  registrationToken: string; // JWT obtained in step 2 (valid 30 min)
}

export interface SendEmailTokenRequestDTO {
  login: string;      // email, max 100
}

export interface VerifyEmailRequestDTO {
  login: string;      // email used in step 1
  token: string;      // 6-digit code
}

export interface VerifyEmailResponseDTO {
  registrationToken: string;  // JWT valid for 30 min, used in step 3
}

export interface ResetPasswordRequestDTO {
  email: string;       // max 100
  token: string;       // 6-digit code
  newPassword: string; // min 8, max 72
}

export interface UserResponseDTO {
  id: string;         // uuid
  name: string;
  nickname: string;
  login: string;
}

export interface PageUserResponseDTO extends PageDTO<UserResponseDTO> {}

// --------------- CLUBS ---------------
export type JoinPolicy = 'OPEN' | 'INVITE_ONLY';

export interface CreateClubRequestDTO {
  name: string;       // min 1
  nickname?: string;  // min 3, max 24
}

export interface UpdateClubRequestDTO {
  name?: string;
  nickname?: string;
  joinPolicy?: JoinPolicy;
}

export interface ClubResponseDTO {
  id: string;         // uuid
  name: string;
  nickname: string;
  joinPolicy: JoinPolicy;
}

// --------------- CLUB MEMBERSHIP ---------------
export type MembershipRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface JoinClubRequestDTO {
  token?: string;
}

export interface InviteTokenResponseDTO {
  token: string;
  expiresAt: string;  // ISO date-time
}

export interface ClubMembershipRequestResponseDTO {
  id: number;
  clubId: string;     // uuid
  userId: string;     // uuid
  name: string;
  nickname: string;
  status: MembershipRequestStatus;
  requestedAt: string;        // ISO date-time
  reviewedAt?: string | null; // ISO date-time
}

export interface PageClubMembershipRequestResponseDTO
  extends PageDTO<ClubMembershipRequestResponseDTO> {}

// --------------- NOTIFICATIONS ---------------
export type NotificationType =
  | 'MEMBERSHIP_REQUEST'
  | 'MEMBERSHIP_APPROVED'
  | 'MEMBERSHIP_REJECTED';

export interface NotificationResponseDTO {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;  // ISO date-time
}

export interface PageNotificationResponseDTO extends PageDTO<NotificationResponseDTO> {}

// --------------- CLUB MEMBERS ---------------
export type ClubRole = 'DIRECTOR' | 'MEMBER';

export interface AddClubMemberRequestDTO {
  name: string;       // max 250
  rating?: number;    // 1-5
}

export interface UpdateClubMemberRequestDTO {
  name?: string;
  rating?: number;    // 1-5
  clubRole?: ClubRole;
  timesMvp?: number;
  timesChampion?: number;
}

export interface ClubMemberResponseDTO {
  id: number;
  userId?: string | null;    // uuid, null when member has no account
  name: string;
  rating?: number;
  timesMvp?: number;
  timesChampion?: number;
  teamId?: number;
  clubRole: ClubRole;
  isOwner: boolean;
}

export interface PageClubMemberResponseDTO extends PageDTO<ClubMemberResponseDTO> {}

// --------------- JERSEYS ---------------
export interface AddJerseyRequestDTO {
  name: string;           // max 100
  hexColor: string;       // #RRGGBB
  isGoalkeeperJersey: boolean;
}

export interface UpdateJerseyRequestDTO {
  name?: string;
  hexColor?: string;
  isGoalkeeperJersey?: boolean;
}

export interface ClubJerseyResponseDTO {
  id: number;
  name: string;
  hexColor: string;
  isGoalkeeperJersey: boolean;
  clubId: string;     // uuid
}

// --------------- MATCHES ---------------
export interface CreateMatchRequestDTO {
  clubId: string;     // uuid
  dateTime: string;   // ISO date-time
}

export interface BatchMatchRequestDTO {
  clubId: string;     // uuid
  dayOfWeek: string;  // MONDAY | TUESDAY | ...
  time: string;       // HH:mm
  startDate: string;  // yyyy-MM-dd
  endDate: string;    // yyyy-MM-dd
  zoneId: string;     // e.g. America/Sao_Paulo
}

export interface MatchResponseDTO {
  id: string;         // uuid
  clubId: string;     // uuid
  dateTime: string;   // ISO date-time
  teamChampionId?: number | null;
  clubMemberMvpId?: number | null;
}

export interface PageMatchResponseDTO extends PageDTO<MatchResponseDTO> {}

export interface SetMatchResultRequestDTO {
  teamChampionId: number;
  clubMemberMvpId: number;
}

// --------------- MATCH PARTICIPANTS ---------------
export type MatchPosition = 'LINE' | 'GOAL';

export interface MatchParticipantResponseDTO {
  id: number;
  matchId: string;    // uuid
  clubMemberId: number;
  position: MatchPosition;
  teamId?: number | null;
}

// --------------- TEAMS ---------------
export interface CreateTeamRequestDTO {
  matchId: string;    // uuid
  clubJerseyId: number;
}

export interface UpdateTeamRequestDTO {
  clubJerseyId: number;
}

export interface UpdateTeamJerseyRequestDTO {
  clubJerseyId: number;
}

export interface TeamResponseDTO {
  id: number;
  matchId: string;    // uuid
  clubJerseyId?: number | null;
  score: number;
}

export interface PageTeamResponseDTO extends PageDTO<TeamResponseDTO> {}

// --------------- TEAM GENERATION ---------------
export interface GenerateTeamsRequestDTO {
  matchId: string;    // uuid
  lineMemberIds: number[];
  goalkeeperMemberIds: number[];
  maxLinePlayers: number; // >= 1
}

export interface GeneratedTeamDTO {
  teamId: number;
  totalScore: number
  lineMemberIds: number[];
  goalkeeperMemberId?: number;
}

export interface GenerateTeamsResponseDTO {
  matchId: string;    // uuid
  teamCount: number;
  teams: GeneratedTeamDTO[];
  unassignedGoalkeeperMemberIds: number[];
}

// --------------- PLAYER SWAP ---------------
export interface PlayerSwapDTO {
  memberIdFrom: number;
  memberIdTo: number;
}

export interface SwapPlayersRequestDTO {
  matchId: string;    // uuid
  swaps: PlayerSwapDTO[];
}

// --------------- PAGINATION ---------------
export interface PageDTO<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
  numberOfElements: number;
}

export interface PageableParams {
  page?: number;
  size?: number;
  sort?: string;
}

// --------------- ERRORS ---------------
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  properties?: Record<string, unknown>;
  errors?: { field: string; message: string }[];
}

// --------------- UI HELPERS ---------------
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

