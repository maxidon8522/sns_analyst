const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = process.env.INSTAGRAM_USER_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface InstagramMedia {
  id: string;
  caption: string;
  media_type: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  media_url?: string;
  thumbnail_url?: string;
  insights?: {
    views: number;
    reach: number;
    saved: number;
    likes: number;
    comments: number;
  };
}

export interface AccountInsights {
  demographics: {
    countries: Record<string, number>;
    cities: Record<string, number>;
    genderAge: Record<string, number>;
  };
  dailyStats: {
    followersCount: number;
    profileViews: number;
    websiteClicks: number;
    reachDaily: number;
    impressionsDaily: number;
    onlinePeakHour: number | null;
    onlineFollowersByHour: Record<string, number>;
  };
}

export const getInstagramPosts = async (): Promise<InstagramMedia[]> => {
  if (!ACCESS_TOKEN || !USER_ID) {
    console.error('❌ API Key missing');
    return [];
  }

  const fields =
    'id,caption,media_type,timestamp,like_count,comments_count,permalink,media_url';
  const url = `${BASE_URL}/${USER_ID}/media?fields=${fields}&access_token=${ACCESS_TOKEN}&limit=20`;

  console.log('Fetching URL:', url);

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      const errorData = await res.json();
      console.error('❌ Instagram API Error:', errorData);
      return [];
    }

    const data = await res.json();
    console.log('✅ Posts fetched:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('❌ Fetch Error:', error);
    return [];
  }
};

const safeNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseInsightValue = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, val]) => {
      acc[key] = safeNumber(val);
      return acc;
    },
    {},
  );
};

const getDayRange = () => {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - 1);
  return {
    since: Math.floor(start.getTime() / 1000),
    until: Math.floor(end.getTime() / 1000),
  };
};

const fetchInsights = async (url: string) => {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error('❌ Instagram Insights API Error:', errorData || res.statusText);
      return null;
    }
    return res.json();
  } catch (error) {
    console.error('❌ Insights Fetch Error:', error);
    return null;
  }
};

export async function getMediaInsights(mediaId: string) {
  if (!ACCESS_TOKEN) return null;

  let likes = 0;
  let comments = 0;

  try {
    const mediaUrl = `${BASE_URL}/${mediaId}?fields=like_count,comments_count&access_token=${ACCESS_TOKEN}`;
    const mediaRes = await fetch(mediaUrl, { cache: 'no-store' });
    if (mediaRes.ok) {
      const mediaData = await mediaRes.json();
      likes = safeNumber(mediaData?.like_count);
      comments = safeNumber(mediaData?.comments_count);
    } else {
      console.error(`Media API error (${mediaId}):`, mediaRes.statusText);
    }
  } catch (error) {
    console.error(`Media fetch failed (${mediaId}):`, error);
  }

  const metrics = 'views,reach,saved';
  const insightsUrl = `${BASE_URL}/${mediaId}/insights?metric=${metrics}&access_token=${ACCESS_TOKEN}`;

  let views = 0;
  let reach = 0;
  let saved = 0;

  try {
    const res = await fetch(insightsUrl, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const data = json?.data;

      if (Array.isArray(data)) {
        for (const item of data) {
          const value = safeNumber(item?.values?.[0]?.value);
          if (typeof item?.name === 'string') {
            switch (item.name) {
              case 'views':
              case 'plays':
                views = value;
                break;
              case 'reach':
                reach = value;
                break;
              case 'saved':
                saved = value;
                break;
              default:
                break;
            }
          }
        }
      }
    } else {
      console.error(`Insights API error (${mediaId}):`, res.statusText);
    }
  } catch (error) {
    console.error(`Insights fetch failed (${mediaId}):`, error);
  }

  return {
    likes,
    comments,
    views,
    reach,
    saved,
  };
}

export const getAccountInsights = async (): Promise<AccountInsights | null> => {
  if (!ACCESS_TOKEN || !USER_ID) return null;

  const demographicsMetrics = 'audience_country,audience_city,audience_gender_age';
  const demographicsUrl = `${BASE_URL}/${USER_ID}/insights?metric=${demographicsMetrics}&period=lifetime&access_token=${ACCESS_TOKEN}`;

  const dailyMetrics =
    'profile_views,website_clicks,online_followers,reach,impressions,follower_count';
  const { since, until } = getDayRange();
  const dailyUrl = `${BASE_URL}/${USER_ID}/insights?metric=${dailyMetrics}&period=day&since=${since}&until=${until}&access_token=${ACCESS_TOKEN}`;

  const [demographicsResponse, dailyResponse] = await Promise.all([
    fetchInsights(demographicsUrl),
    fetchInsights(dailyUrl),
  ]);

  const demographicsData = Array.isArray(demographicsResponse?.data)
    ? demographicsResponse.data
    : [];
  const dailyData = Array.isArray(dailyResponse?.data) ? dailyResponse.data : [];

  const audienceCountry = demographicsData.find((item: any) => item?.name === 'audience_country');
  const audienceCity = demographicsData.find((item: any) => item?.name === 'audience_city');
  const audienceGenderAge = demographicsData.find((item: any) => item?.name === 'audience_gender_age');

  const profileViews = dailyData.find((item: any) => item?.name === 'profile_views');
  const websiteClicks = dailyData.find((item: any) => item?.name === 'website_clicks');
  const onlineFollowers = dailyData.find((item: any) => item?.name === 'online_followers');
  const reachDaily = dailyData.find((item: any) => item?.name === 'reach');
  const impressionsDaily = dailyData.find((item: any) => item?.name === 'impressions');
  const followerCount = dailyData.find(
    (item: any) => item?.name === 'follower_count' || item?.name === 'followers_count',
  );

  const onlineFollowersByHour = parseInsightValue(
    onlineFollowers?.values?.[0]?.value,
  );

  let onlinePeakHour: number | null = null;
  let peakValue = -1;
  Object.entries(onlineFollowersByHour).forEach(([hour, value]) => {
    const hourNumber = Number(hour);
    if (Number.isFinite(hourNumber) && value > peakValue) {
      peakValue = value;
      onlinePeakHour = hourNumber;
    }
  });

  return {
    demographics: {
      countries: parseInsightValue(audienceCountry?.values?.[0]?.value),
      cities: parseInsightValue(audienceCity?.values?.[0]?.value),
      genderAge: parseInsightValue(audienceGenderAge?.values?.[0]?.value),
    },
    dailyStats: {
      followersCount: safeNumber(followerCount?.values?.[0]?.value),
      profileViews: safeNumber(profileViews?.values?.[0]?.value),
      websiteClicks: safeNumber(websiteClicks?.values?.[0]?.value),
      reachDaily: safeNumber(reachDaily?.values?.[0]?.value),
      impressionsDaily: safeNumber(impressionsDaily?.values?.[0]?.value),
      onlinePeakHour,
      onlineFollowersByHour,
    },
  };
};

export const getPostWithInsights = async (
  mediaId: string,
): Promise<InstagramMedia | null> => {
  if (!ACCESS_TOKEN) return null;

  const fields =
    'id,caption,media_type,timestamp,like_count,comments_count,permalink,media_url';
  const url = `${BASE_URL}/${mediaId}?fields=${fields}&access_token=${ACCESS_TOKEN}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;

    const post = await res.json();
    const insights = await getMediaInsights(mediaId);

    const fallbackInsights = {
      views: 0,
      reach: 0,
      saved: 0,
      likes: safeNumber(post.like_count),
      comments: safeNumber(post.comments_count),
    };

    return {
      ...post,
      insights: insights || fallbackInsights,
    };
  } catch (error) {
    return null;
  }
};
