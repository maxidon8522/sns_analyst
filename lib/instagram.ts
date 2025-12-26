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
    'id,caption,media_type,timestamp,like_count,comments_count,permalink,media_url,thumbnail_url';
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

const normalizeMetricMap = (value: unknown): Record<string, number> => {
  if (!value) return {};

  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((acc, entry) => {
      if (!entry || typeof entry !== 'object') return acc;
      const obj = entry as Record<string, unknown>;
      const keyRaw = obj.value ?? obj.label ?? obj.name;
      const countRaw = obj.count ?? obj.total_value ?? obj.value_count ?? obj.value;
      const key =
        typeof keyRaw === 'string' || typeof keyRaw === 'number' ? String(keyRaw) : null;
      const count = safeNumber(countRaw);
      if (key && Number.isFinite(count)) {
        acc[key] = (acc[key] ?? 0) + count;
      }
      return acc;
    }, {});
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
      (acc, [key, val]) => {
        if (typeof val === 'number' || typeof val === 'string') {
          acc[key] = safeNumber(val);
          return acc;
        }
        if (val && typeof val === 'object') {
          const nested = val as Record<string, unknown>;
          if ('count' in nested) {
            acc[key] = safeNumber(nested.count);
          } else if ('value' in nested) {
            acc[key] = safeNumber(nested.value);
          }
        }
        return acc;
      },
      {},
    );
  }

  return {};
};

const normalizeBreakdownList = (
  value: unknown,
  dimension?: string,
): Record<string, number> => {
  if (!Array.isArray(value)) return {};
  return value.reduce<Record<string, number>>((acc, entry) => {
    if (!entry || typeof entry !== 'object') return acc;
    const obj = entry as Record<string, unknown>;
    if (dimension && obj.dimension && obj.dimension !== dimension) return acc;
    const keyRaw = obj.value ?? obj.label ?? obj.name;
    const countRaw = obj.count ?? obj.total_value ?? obj.value_count ?? obj.value;
    const key =
      typeof keyRaw === 'string' || typeof keyRaw === 'number' ? String(keyRaw) : null;
    const count = safeNumber(countRaw);
    if (key && Number.isFinite(count)) {
      acc[key] = (acc[key] ?? 0) + count;
    }
    return acc;
  }, {});
};

const extractDemographicBreakdown = (
  value: unknown,
  dimension: string,
): Record<string, number> => {
  if (!value) return {};

  if (Array.isArray(value)) {
    return normalizeBreakdownList(value, dimension);
  }

  if (typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;

  const candidates = [
    obj,
    obj.breakdown,
    obj.breakdowns,
    obj.value,
    (obj.value as any)?.breakdown,
    (obj.value as any)?.breakdowns,
    obj.total_value,
    (obj.total_value as any)?.breakdown,
    (obj.total_value as any)?.breakdowns,
    obj.data,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (Array.isArray(candidate)) {
      const list = normalizeBreakdownList(candidate, dimension);
      if (Object.keys(list).length > 0) return list;
      continue;
    }
    if (typeof candidate !== 'object') continue;
    const mapCandidate = candidate as Record<string, unknown>;
    if (dimension in mapCandidate) {
      const map = normalizeMetricMap(mapCandidate[dimension]);
      if (Object.keys(map).length > 0) return map;
    }
  }

  return {};
};

const normalizeGenderAge = (map: Record<string, number>): Record<string, number> => {
  if (Object.keys(map).length === 0) return map;
  const keys = Object.keys(map);
  const hasDot = keys.some((key) => key.includes('.'));
  if (hasDot) return map;

  const genderOnly = keys.every((key) => ['M', 'F', 'U', 'UNKNOWN', 'OTHER'].includes(key));
  if (genderOnly) {
    return keys.reduce<Record<string, number>>((acc, key) => {
      acc[`${key}.不明`] = map[key];
      return acc;
    }, {});
  }

  return keys.reduce<Record<string, number>>((acc, key) => {
    acc[`U.${key}`] = map[key];
    return acc;
  }, {});
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

const getLatestValuePayload = (entry: any): unknown => {
  if (!entry) return null;
  if (entry?.total_value?.value !== undefined) {
    return entry.total_value.value;
  }
  const values = Array.isArray(entry?.values) ? entry.values : [];
  if (values.length === 0) return null;
  const latest = [...values].sort((a, b) => {
    const aTime = a?.end_time ? new Date(a.end_time).getTime() : 0;
    const bTime = b?.end_time ? new Date(b.end_time).getTime() : 0;
    return bTime - aTime;
  })[0];
  return latest?.value ?? null;
};

const getLatestNumberValue = (entry: any): number =>
  safeNumber(getLatestValuePayload(entry));

export async function getMediaInsights(mediaId: string) {
  if (!ACCESS_TOKEN) return null;

  let likes = 0;
  let comments = 0;
  let insightsOk = false;

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
      insightsOk = true;
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
    insightsOk,
  };
}

export const getAccountInsights = async (): Promise<AccountInsights | null> => {
  if (!ACCESS_TOKEN || !USER_ID) return null;

  const { since, until } = getDayRange();

  const demographicsMetrics = 'follower_demographics';
  const demographicsUrl =
    `${BASE_URL}/${USER_ID}/insights?metric=${demographicsMetrics}` +
    `&period=lifetime&breakdown=age,gender,city,country&metric_type=total_value` +
    `&access_token=${ACCESS_TOKEN}`;

  const dailyTotalsMetrics = 'profile_views,website_clicks';
  const dailyTotalsUrl =
    `${BASE_URL}/${USER_ID}/insights?metric=${dailyTotalsMetrics}` +
    `&period=day&metric_type=total_value&since=${since}&until=${until}` +
    `&access_token=${ACCESS_TOKEN}`;

  const dailySeriesMetrics = 'reach,follower_count';
  const dailySeriesWithRangeUrl =
    `${BASE_URL}/${USER_ID}/insights?metric=${dailySeriesMetrics}` +
    `&period=day&since=${since}&until=${until}&access_token=${ACCESS_TOKEN}`;

  const onlineFollowersUrl =
    `${BASE_URL}/${USER_ID}/insights?metric=online_followers` +
    `&period=lifetime&access_token=${ACCESS_TOKEN}`;

  const [demographicsResponse, totalsResponse, seriesResponse, onlineFollowersResponse] =
    await Promise.all([
      fetchInsights(demographicsUrl),
      fetchInsights(dailyTotalsUrl),
      fetchInsights(dailySeriesWithRangeUrl),
      fetchInsights(onlineFollowersUrl),
    ]);

  const demographicsData = Array.isArray(demographicsResponse?.data)
    ? demographicsResponse.data
    : [];
  const totalsData = Array.isArray(totalsResponse?.data) ? totalsResponse.data : [];
  const seriesData = Array.isArray(seriesResponse?.data) ? seriesResponse.data : [];
  const onlineData = Array.isArray(onlineFollowersResponse?.data)
    ? onlineFollowersResponse.data
    : [];

  const audienceCountry = demographicsData.find((item: any) => item?.name === 'audience_country');
  const audienceCity = demographicsData.find((item: any) => item?.name === 'audience_city');
  const audienceGenderAge = demographicsData.find((item: any) => item?.name === 'audience_gender_age');
  const followerDemographics = demographicsData.find((item: any) =>
    ['follower_demographics', 'engaged_audience_demographics', 'reached_audience_demographics']
      .includes(item?.name),
  );

  const profileViews = totalsData.find((item: any) => item?.name === 'profile_views');
  const websiteClicks = totalsData.find((item: any) => item?.name === 'website_clicks');
  const onlineFollowers = onlineData.find((item: any) => item?.name === 'online_followers');
  const reachDaily = seriesData.find((item: any) => item?.name === 'reach');
  const followerCount = seriesData.find(
    (item: any) => item?.name === 'follower_count' || item?.name === 'followers_count',
  );

  const onlineFollowersByHour = normalizeMetricMap(getLatestValuePayload(onlineFollowers));

  let onlinePeakHour: number | null = null;
  let peakValue = -1;
  Object.entries(onlineFollowersByHour).forEach(([hour, value]) => {
    const hourNumber = Number(hour);
    if (Number.isFinite(hourNumber) && value > peakValue) {
      peakValue = value;
      onlinePeakHour = hourNumber;
    }
  });

  const fallbackValues = Array.isArray(followerDemographics?.values)
    ? followerDemographics.values
    : [];

  let countries = parseInsightValue(audienceCountry?.values?.[0]?.value);
  let cities = parseInsightValue(audienceCity?.values?.[0]?.value);
  let genderAge = parseInsightValue(audienceGenderAge?.values?.[0]?.value);

  if (fallbackValues.length > 0) {
    fallbackValues.forEach((entry: any) => {
      const value = entry?.value ?? entry?.total_value ?? entry;
      if (Object.keys(countries).length === 0) {
        const next = extractDemographicBreakdown(value, 'country');
        if (Object.keys(next).length > 0) countries = next;
      }
      if (Object.keys(cities).length === 0) {
        const next = extractDemographicBreakdown(value, 'city');
        if (Object.keys(next).length > 0) cities = next;
      }
      if (Object.keys(genderAge).length === 0) {
        let next = extractDemographicBreakdown(value, 'gender_age');
        if (Object.keys(next).length === 0) {
          next = extractDemographicBreakdown(value, 'age_gender');
        }
        if (Object.keys(next).length === 0) {
          const ageOnly = extractDemographicBreakdown(value, 'age');
          if (Object.keys(ageOnly).length > 0) {
            next = normalizeGenderAge(ageOnly);
          }
        }
        if (Object.keys(next).length === 0) {
          const genderOnly = extractDemographicBreakdown(value, 'gender');
          if (Object.keys(genderOnly).length > 0) {
            next = normalizeGenderAge(genderOnly);
          }
        }
        if (Object.keys(next).length > 0) {
          genderAge = next;
        }
      }
    });
  }

  return {
    demographics: {
      countries,
      cities,
      genderAge,
    },
    dailyStats: {
      followersCount: getLatestNumberValue(followerCount),
      profileViews: getLatestNumberValue(profileViews),
      websiteClicks: getLatestNumberValue(websiteClicks),
      reachDaily: getLatestNumberValue(reachDaily),
      impressionsDaily: 0,
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
    'id,caption,media_type,timestamp,like_count,comments_count,permalink,media_url,thumbnail_url';
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
    insights: insights && insights.insightsOk !== false ? insights : fallbackInsights,
  };
  } catch (error) {
    return null;
  }
};
