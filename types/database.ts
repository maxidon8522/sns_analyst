export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TimeSlot = 'early_morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';
export type VideoLength = 'short' | 'medium' | 'long' | 'extra_long';
export type ThumbnailType = 'none' | 'face' | 'text' | 'emo';
export type SoundType = 'trend' | 'chill' | 'auto_voice' | 'my_voice' | 'asmr';
export type LocationTag = 'room' | 'school' | 'cafe' | 'city' | 'trip';
export type ActionTag = 'study' | 'eat' | 'play' | 'routine' | 'talk' | 'shopping';
export type CompanionTag = 'solo' | 'local_friend' | 'jp_friend' | 'none';
export type LanguageElement = 'jp_only' | 'foreign_practice' | 'none';
export type RealityLevel = 'perfect' | 'natural' | 'real';
export type MoodTag = 'happy' | 'calm' | 'tired' | 'emo';
export type InfoDensity = 'high' | 'medium' | 'low';
export type HookVisual = 'impact' | 'beauty' | 'mystery' | 'normal';
export type HookText = 'question' | 'conclusion' | 'emotion' | 'none';
export type VideoStructure = 'time' | 'list' | 'reason' | 'montage';
export type VideoTempo = 'fast' | 'normal' | 'slow';
export type TelopAmount = 'full' | 'point' | 'none';
export type FilterType = 'bright' | 'dark' | 'raw';
export type EndingType = 'happy' | 'bad' | 'question' | 'none';
export type CaptionStyle = 'diary' | 'info' | 'short';
export type TargetAudience = 'new' | 'existing' | 'fan';
export type ContentOrigin = 'original' | 'trend' | 'copy';
export type ProductionCost = 'high' | 'medium' | 'low';
export type CampaignPurpose = 'view' | 'save' | 'comment';

export interface AnalysisTags {
  basic: {
    time_slot: TimeSlot;
    length: VideoLength;
    thumbnail_type: ThumbnailType;
    sound_type: SoundType;
  };
  content: {
    location: LocationTag;
    action: ActionTag;
    companion: CompanionTag;
    language_element: LanguageElement;
    reality_level: RealityLevel;
    mood: MoodTag;
    info_density: InfoDensity;
  };
  editing: {
    hook_visual: HookVisual;
    hook_text: HookText;
    structure: VideoStructure;
    tempo: VideoTempo;
    telop_amount: TelopAmount;
    filter: FilterType;
    ending: EndingType;
  };
  strategy: {
    caption_style: CaptionStyle;
    target: TargetAudience;
    cta: boolean;
    origin: ContentOrigin;
    cost: ProductionCost;
    purpose: CampaignPurpose;
  };
}

export interface Database {
  public: {
    Tables: {
      videos: {
        Row: {
          id: string;
          ig_media_id: string;
          permalink: string | null;
          thumbnail_url: string | null;
          media_url: string | null;
          caption: string | null;
          posted_at: string | null;
          analysis_tags: AnalysisTags | null;
          self_score: number | null;
          created_at: string;
          reach: number | null;
          shares: number | null;
          profile_visits: number | null;
          follows: number | null;
          manual_input_done: boolean | null;
        };
        Insert: {
          id?: string;
          ig_media_id: string;
          permalink?: string | null;
          thumbnail_url?: string | null;
          media_url?: string | null;
          caption?: string | null;
          posted_at?: string | null;
          analysis_tags?: AnalysisTags | null;
          self_score?: number | null;
          created_at?: string;
          reach?: number | null;
          shares?: number | null;
          profile_visits?: number | null;
          follows?: number | null;
          manual_input_done?: boolean | null;
        };
        Update: {
          id?: string;
          ig_media_id?: string;
          permalink?: string | null;
          thumbnail_url?: string | null;
          media_url?: string | null;
          caption?: string | null;
          posted_at?: string | null;
          analysis_tags?: AnalysisTags | null;
          self_score?: number | null;
          created_at?: string;
          reach?: number | null;
          shares?: number | null;
          profile_visits?: number | null;
          follows?: number | null;
          manual_input_done?: boolean | null;
        };
        Relationships: [];
      };
      metrics_logs: {
        Row: {
          id: number;
          video_id: string;
          fetched_at: string;
          views: number | null;
          likes: number | null;
          saves: number | null;
          comments: number | null;
        };
        Insert: {
          id?: number;
          video_id: string;
          fetched_at?: string;
          views?: number | null;
          likes?: number | null;
          saves?: number | null;
          comments?: number | null;
        };
        Update: {
          id?: number;
          video_id?: string;
          fetched_at?: string;
          views?: number | null;
          likes?: number | null;
          saves?: number | null;
          comments?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'metrics_logs_video_id_fkey';
            columns: ['video_id'];
            referencedRelation: 'videos';
            referencedColumns: ['id'];
          },
        ];
      };
      account_insights: {
        Row: {
          id: string;
          date: string;
          followers_count: number | null;
          profile_views: number | null;
          website_clicks: number | null;
          reach_daily: number | null;
          impressions_daily: number | null;
          online_peak_hour: number | null;
          audience_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          followers_count?: number | null;
          profile_views?: number | null;
          website_clicks?: number | null;
          reach_daily?: number | null;
          impressions_daily?: number | null;
          online_peak_hour?: number | null;
          audience_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          followers_count?: number | null;
          profile_views?: number | null;
          website_clicks?: number | null;
          reach_daily?: number | null;
          impressions_daily?: number | null;
          online_peak_hour?: number | null;
          audience_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: never;
    Functions: never;
    Enums: never;
    CompositeTypes: never;
  };
}
